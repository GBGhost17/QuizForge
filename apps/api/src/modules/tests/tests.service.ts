import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddQuestionsBatchDto,
  AddQuestionToTestDto,
  CreateTestDto,
  PublishTestDto,
  ReorderQuestionsDto,
  TestQueryDto,
  UpdateTestDto,
} from './dto';
import type {
  PaginatedResult,
  Test,
  TestQuestionSnapshot,
  TestSession,
} from '@quizforge/shared-types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã phòng thi ngẫu nhiên gồm 6 ký tự chữ in hoa và chữ số (bỏ 0, O, 1, I để tránh nhầm lẫn).
   */
  private generateJoinCode(length = 6): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Tạo mã joinCode duy nhất chưa tồn tại trong hệ thống.
   */
  private async generateUniqueJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = this.generateJoinCode();
      const existing = await this.prisma.testSession.findUnique({
        where: { joinCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new BadRequestException('Không thể tạo mã phòng thi độc nhất lúc này, vui lòng thử lại');
  }

  /**
   * Tạo đề thi mới ở trạng thái DRAFT kèm TestVersion đầu tiên (versionNumber = 1).
   */
  async create(userId: string, dto: CreateTestDto): Promise<Test> {
    const title = dto.title.trim();
    const description = dto.description?.trim() || null;
    const instructions = dto.instructions?.trim() || null;

    const created = await this.prisma.test.create({
      data: {
        authorId: userId,
        title,
        description,
        instructions,
        mode: dto.mode || 'ASSIGNMENT',
        status: 'DRAFT',
        versions: {
          create: {
            versionNumber: 1,
            title,
            description,
            instructions,
            timeLimitMinutes: dto.timeLimitMinutes ?? null,
            maxAttempts: dto.maxAttempts ?? 1,
            shuffleQuestions: dto.shuffleQuestions ?? false,
            shuffleOptions: dto.shuffleOptions ?? false,
            releaseMode: dto.releaseMode || 'ON_FINALIZATION',
            passScore: dto.passScore ?? null,
            totalPoints: 0,
            isPublished: false,
          },
        },
      },
      include: {
        versions: {
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
            sessions: true,
          },
        },
      },
    });

    return this.mapToTest(created);
  }

  /**
   * Lấy danh sách đề thi của người dùng hiện tại có phân trang và bộ lọc.
   */
  async findAll(userId: string, query: TestQueryDto): Promise<PaginatedResult<Test>> {
    const { q, status, mode, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TestWhereInput = {
      authorId: userId,
      ...(status ? { status } : {}),
      ...(mode ? { mode } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, tests] = await Promise.all([
      this.prisma.test.count({ where }),
      this.prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: {
              questionSnapshots: {
                orderBy: { order: 'asc' },
              },
              sessions: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: tests.map((t) => this.mapToTest(t)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Lấy chi tiết đề thi theo ID (kèm kiểm tra phân quyền sở hữu IDOR).
   */
  async findOne(userId: string, testId: string): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
            sessions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đề thi này');
    }

    return this.mapToTest(test);
  }

  /**
   * Cập nhật thông tin và cấu hình đề thi nháp (DRAFT).
   */
  async update(userId: string, testId: string, dto: UpdateTestDto): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa đề thi khi ở trạng thái nháp (DRAFT)');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion) {
      throw new NotFoundException('Không tìm thấy phiên bản đề thi');
    }

    const updatedTitle = dto.title !== undefined ? dto.title.trim() : test.title;
    const updatedDesc =
      dto.description !== undefined ? dto.description.trim() || null : test.description;
    const updatedInstructions =
      dto.instructions !== undefined ? dto.instructions.trim() || null : test.instructions;

    await this.prisma.$transaction([
      this.prisma.test.update({
        where: { id: testId },
        data: {
          title: updatedTitle,
          description: updatedDesc,
          instructions: updatedInstructions,
          ...(dto.mode ? { mode: dto.mode } : {}),
        },
      }),
      this.prisma.testVersion.update({
        where: { id: latestVersion.id },
        data: {
          title: updatedTitle,
          description: updatedDesc,
          instructions: updatedInstructions,
          ...(dto.timeLimitMinutes !== undefined ? { timeLimitMinutes: dto.timeLimitMinutes } : {}),
          ...(dto.maxAttempts !== undefined ? { maxAttempts: dto.maxAttempts } : {}),
          ...(dto.shuffleQuestions !== undefined ? { shuffleQuestions: dto.shuffleQuestions } : {}),
          ...(dto.shuffleOptions !== undefined ? { shuffleOptions: dto.shuffleOptions } : {}),
          ...(dto.releaseMode ? { releaseMode: dto.releaseMode } : {}),
          ...(dto.passScore !== undefined ? { passScore: dto.passScore } : {}),
        },
      }),
    ]);

    return this.findOne(userId, testId);
  }

  /**
   * Xóa đề thi (chỉ cho phép nếu ở trạng thái DRAFT hoặc chưa có bài làm nào).
   */
  async remove(userId: string, testId: string): Promise<{ success: boolean; message: string }> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          include: {
            attempts: { select: { id: true } },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đề thi này');
    }

    const hasAttempts = test.versions.some((v) => v.attempts.length > 0);
    if (hasAttempts) {
      throw new BadRequestException('Không thể xóa đề thi đã có học sinh làm bài');
    }

    await this.prisma.test.delete({
      where: { id: testId },
    });

    return {
      success: true,
      message: 'Xóa đề thi thành công',
    };
  }

  /**
   * Thêm một câu hỏi từ ngân hàng vào đề thi nháp (tạo TestQuestionSnapshot).
   */
  async addQuestion(
    userId: string,
    testId: string,
    dto: AddQuestionToTestDto,
  ): Promise<TestQuestionSnapshot> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể thêm câu hỏi vào đề thi nháp (DRAFT)');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion || latestVersion.isPublished) {
      throw new BadRequestException('Không tìm thấy phiên bản nháp khả dụng');
    }

    // Lấy câu hỏi gốc kèm đáp án
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: {
        bank: true,
        options: { orderBy: { order: 'asc' } },
      },
    });

    if (!question || question.isArchived) {
      throw new NotFoundException('Không tìm thấy câu hỏi hoặc câu hỏi đã bị lưu trữ');
    }

    if (question.bank.ownerId !== userId) {
      throw new ForbiddenException('Bạn không sở hữu câu hỏi này');
    }

    // Xác định thứ tự
    const nextOrder =
      dto.order && dto.order > 0
        ? dto.order
        : latestVersion.questionSnapshots.length > 0
          ? Math.max(...latestVersion.questionSnapshots.map((s) => s.order)) + 1
          : 1;

    const points = dto.points ?? question.defaultPoints ?? 1.0;

    // Snapshot dữ liệu câu hỏi và options để bảo toàn tính toàn vẹn (Assessment Integrity)
    const optionsSnapshot = question.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation,
      order: opt.order,
    }));

    const snapshot = await this.prisma.testQuestionSnapshot.create({
      data: {
        versionId: latestVersion.id,
        questionId: question.id,
        order: nextOrder,
        points,
        type: question.type,
        prompt: question.prompt,
        explanation: question.explanation,
        options: optionsSnapshot as unknown as Prisma.InputJsonValue,
        rubric: (question.rubric as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Cập nhật lại totalPoints cho version
    const newTotalPoints =
      latestVersion.questionSnapshots.reduce((acc, s) => acc + s.points, 0) + points;
    await this.prisma.testVersion.update({
      where: { id: latestVersion.id },
      data: { totalPoints: newTotalPoints },
    });

    return snapshot as unknown as TestQuestionSnapshot;
  }

  /**
   * Thêm hàng loạt câu hỏi từ ngân hàng vào đề thi nháp.
   */
  async addQuestionsBatch(
    userId: string,
    testId: string,
    dto: AddQuestionsBatchDto,
  ): Promise<{ addedCount: number; test: Test }> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể thêm câu hỏi vào đề thi nháp (DRAFT)');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion || latestVersion.isPublished) {
      throw new BadRequestException('Không tìm thấy phiên bản nháp khả dụng');
    }

    // Lấy tất cả các câu hỏi được yêu cầu thuộc ngân hàng của user
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: dto.questionIds },
        isArchived: false,
        bank: { ownerId: userId },
      },
      include: {
        options: { orderBy: { order: 'asc' } },
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Không tìm thấy câu hỏi hợp lệ nào để thêm');
    }

    let currentOrder =
      latestVersion.questionSnapshots.length > 0
        ? Math.max(...latestVersion.questionSnapshots.map((s) => s.order))
        : 0;

    let pointsToAdd = 0;

    await this.prisma.$transaction(
      questions.map((q) => {
        currentOrder += 1;
        const pts = dto.defaultPoints ?? q.defaultPoints ?? 1.0;
        pointsToAdd += pts;

        const optionsSnapshot = q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
          order: opt.order,
        }));

        return this.prisma.testQuestionSnapshot.create({
          data: {
            versionId: latestVersion.id,
            questionId: q.id,
            order: currentOrder,
            points: pts,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            options: optionsSnapshot as unknown as Prisma.InputJsonValue,
            rubric: (q.rubric as Prisma.InputJsonValue) ?? undefined,
          },
        });
      }),
    );

    const newTotalPoints =
      latestVersion.questionSnapshots.reduce((acc, s) => acc + s.points, 0) + pointsToAdd;
    await this.prisma.testVersion.update({
      where: { id: latestVersion.id },
      data: { totalPoints: newTotalPoints },
    });

    const updated = await this.findOne(userId, testId);

    return {
      addedCount: questions.length,
      test: updated,
    };
  }

  /**
   * Xóa một snapshot câu hỏi khỏi đề thi nháp và đánh lại thứ tự liên tục.
   */
  async removeQuestion(userId: string, testId: string, snapshotId: string): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể xóa câu hỏi khi đề thi ở trạng thái nháp (DRAFT)');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion) {
      throw new NotFoundException('Không tìm thấy phiên bản đề thi');
    }

    const snapshotToDelete = latestVersion.questionSnapshots.find((s) => s.id === snapshotId);
    if (!snapshotToDelete) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong đề thi này');
    }

    // Xóa snapshot
    await this.prisma.testQuestionSnapshot.delete({
      where: { id: snapshotId },
    });

    // Re-index thứ tự cho các snapshot còn lại
    const remaining = latestVersion.questionSnapshots
      .filter((s) => s.id !== snapshotId)
      .sort((a, b) => a.order - b.order);

    const reindexOperations = remaining.map((snap, idx) =>
      this.prisma.testQuestionSnapshot.update({
        where: { id: snap.id },
        data: { order: idx + 1 },
      }),
    );

    const newTotal = remaining.reduce((acc, s) => acc + s.points, 0);

    await this.prisma.$transaction([
      ...reindexOperations,
      this.prisma.testVersion.update({
        where: { id: latestVersion.id },
        data: { totalPoints: newTotal },
      }),
    ]);

    return this.findOne(userId, testId);
  }

  /**
   * Sắp xếp lại thứ tự và cập nhật điểm số cho các câu hỏi trong đề thi nháp.
   */
  async reorderQuestions(userId: string, testId: string, dto: ReorderQuestionsDto): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể sắp xếp lại câu hỏi khi đề thi ở trạng thái nháp');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion) {
      throw new NotFoundException('Không tìm thấy phiên bản đề thi');
    }

    const snapshotIds = new Set(latestVersion.questionSnapshots.map((s) => s.id));

    // Kiểm tra tất cả snapshotId gửi lên phải thuộc đề thi này
    for (const item of dto.items) {
      if (!snapshotIds.has(item.snapshotId)) {
        throw new BadRequestException(`Snapshot ID ${item.snapshotId} không thuộc đề thi này`);
      }
    }

    // Do có unique constraint [versionId, order], ta dùng 2 bước để tránh va chạm order:
    // Bước 1: chuyển order thành số âm tạm thời
    // Bước 2: cập nhật order và points chính thức
    await this.prisma.$transaction(async (tx) => {
      for (const [idx, item] of dto.items.entries()) {
        await tx.testQuestionSnapshot.update({
          where: { id: item.snapshotId },
          data: { order: -(idx + 1) },
        });
      }

      for (const item of dto.items) {
        await tx.testQuestionSnapshot.update({
          where: { id: item.snapshotId },
          data: {
            order: item.order,
            ...(item.points !== undefined ? { points: item.points } : {}),
          },
        });
      }

      // Tính lại tổng điểm
      const allSnaps = await tx.testQuestionSnapshot.findMany({
        where: { versionId: latestVersion.id },
      });
      const totalPoints = allSnaps.reduce((acc, s) => acc + s.points, 0);

      await tx.testVersion.update({
        where: { id: latestVersion.id },
        data: { totalPoints },
      });
    });

    return this.findOne(userId, testId);
  }

  /**
   * Xuất bản đề thi (Publish): Đóng băng snapshot, tạo TestSession và sinh mã joinCode 6 ký tự.
   */
  async publish(userId: string, testId: string, dto?: PublishTestDto): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xuất bản đề thi này');
    }

    if (test.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể xuất bản đề thi đang ở trạng thái nháp (DRAFT)');
    }

    const latestVersion = test.versions[0];
    if (!latestVersion) {
      throw new BadRequestException('Không tìm thấy phiên bản đề thi');
    }

    if (latestVersion.questionSnapshots.length === 0) {
      throw new BadRequestException('Không thể xuất bản đề thi chưa có câu hỏi nào');
    }

    const joinCode = await this.generateUniqueJoinCode();
    const totalPoints = latestVersion.questionSnapshots.reduce((acc, s) => acc + s.points, 0);

    const startsAt = dto?.startsAt ? new Date(dto.startsAt) : new Date();
    const endsAt = dto?.endsAt ? new Date(dto.endsAt) : null;

    await this.prisma.$transaction([
      // Cập nhật TestVersion thành đã xuất bản
      this.prisma.testVersion.update({
        where: { id: latestVersion.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          totalPoints,
          ...(dto?.timeLimitMinutes !== undefined
            ? { timeLimitMinutes: dto.timeLimitMinutes }
            : {}),
          ...(dto?.maxAttempts !== undefined ? { maxAttempts: dto.maxAttempts } : {}),
          ...(dto?.shuffleQuestions !== undefined
            ? { shuffleQuestions: dto.shuffleQuestions }
            : {}),
          ...(dto?.shuffleOptions !== undefined ? { shuffleOptions: dto.shuffleOptions } : {}),
          ...(dto?.releaseMode ? { releaseMode: dto.releaseMode } : {}),
          ...(dto?.passScore !== undefined ? { passScore: dto.passScore } : {}),
        },
      }),

      // Cập nhật Test thành PUBLISHED
      this.prisma.test.update({
        where: { id: testId },
        data: {
          status: 'PUBLISHED',
        },
      }),

      // Tạo TestSession tự động với mã tham gia joinCode
      this.prisma.testSession.create({
        data: {
          versionId: latestVersion.id,
          joinCode,
          title: `Phòng thi: ${test.title}`,
          status: 'ACTIVE',
          startsAt,
          endsAt,
        },
      }),
    ]);

    return this.findOne(userId, testId);
  }

  /**
   * Đóng bài kiểm tra: Chuyển trạng thái sang CLOSED và kết thúc các phiên làm bài (SessionStatus = ENDED).
   */
  async close(userId: string, testId: string): Promise<Test> {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        versions: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    if (test.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đóng đề thi này');
    }

    if (test.status === 'CLOSED') {
      return this.mapToTest(test);
    }

    if (test.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Chỉ có thể đóng đề thi đang ở trạng thái đã xuất bản (PUBLISHED)',
      );
    }

    const versionIds = test.versions.map((v) => v.id);

    await this.prisma.$transaction([
      this.prisma.test.update({
        where: { id: testId },
        data: { status: 'CLOSED' },
      }),
      this.prisma.testSession.updateMany({
        where: {
          versionId: { in: versionIds },
          status: 'ACTIVE',
        },
        data: {
          status: 'ENDED',
          endsAt: new Date(),
        },
      }),
    ]);

    return this.findOne(userId, testId);
  }

  /**
   * Chuyển đổi Prisma model sang Test contract của @quizforge/shared-types
   */
  private mapToTest(prismaTest: Record<string, unknown>): Test {
    const versions = Array.isArray(prismaTest.versions)
      ? (prismaTest.versions as Array<Record<string, unknown>>)
      : undefined;

    return {
      id: prismaTest.id as string,
      authorId: prismaTest.authorId as string,
      title: prismaTest.title as string,
      description: (prismaTest.description as string | null) ?? undefined,
      instructions: (prismaTest.instructions as string | null) ?? undefined,
      mode: prismaTest.mode as Test['mode'],
      status: prismaTest.status as Test['status'],
      createdAt: (prismaTest.createdAt as Date).toISOString(),
      updatedAt: (prismaTest.updatedAt as Date).toISOString(),
      versions: versions?.map((v) => {
        const questionSnapshots = Array.isArray(v.questionSnapshots)
          ? (v.questionSnapshots as Array<Record<string, unknown>>)
          : undefined;
        const sessions = Array.isArray(v.sessions)
          ? (v.sessions as Array<Record<string, unknown>>)
          : undefined;

        return {
          id: v.id as string,
          testId: v.testId as string,
          versionNumber: v.versionNumber as number,
          title: v.title as string,
          description: (v.description as string | null) ?? undefined,
          instructions: (v.instructions as string | null) ?? undefined,
          timeLimitMinutes: (v.timeLimitMinutes as number | null) ?? undefined,
          maxAttempts: v.maxAttempts as number,
          shuffleQuestions: Boolean(v.shuffleQuestions),
          shuffleOptions: Boolean(v.shuffleOptions),
          releaseMode: v.releaseMode as Test['versions'] extends (infer U)[] | undefined
            ? U extends { releaseMode: infer R }
              ? R
              : never
            : never,
          passScore: (v.passScore as number | null) ?? undefined,
          totalPoints: v.totalPoints as number,
          isPublished: Boolean(v.isPublished),
          publishedAt: v.publishedAt ? (v.publishedAt as Date).toISOString() : undefined,
          createdAt: (v.createdAt as Date).toISOString(),
          questionSnapshots: questionSnapshots?.map((s) => ({
            id: s.id as string,
            versionId: s.versionId as string,
            questionId: (s.questionId as string | null) ?? undefined,
            order: s.order as number,
            points: s.points as number,
            type: s.type as TestQuestionSnapshot['type'],
            prompt: s.prompt as string,
            explanation: (s.explanation as string | null) ?? undefined,
            options: s.options as TestQuestionSnapshot['options'],
            rubric: (s.rubric as TestQuestionSnapshot['rubric']) ?? undefined,
            createdAt: (s.createdAt as Date).toISOString(),
          })),
          sessions: sessions?.map((sess) => ({
            id: sess.id as string,
            versionId: sess.versionId as string,
            joinCode: (sess.joinCode as string | null) ?? undefined,
            title: (sess.title as string | null) ?? undefined,
            status: sess.status as TestSession['status'],
            startsAt: sess.startsAt ? (sess.startsAt as Date).toISOString() : undefined,
            endsAt: sess.endsAt ? (sess.endsAt as Date).toISOString() : undefined,
            createdAt: (sess.createdAt as Date).toISOString(),
            updatedAt: (sess.updatedAt as Date).toISOString(),
          })),
        };
      }),
    };
  }
}
