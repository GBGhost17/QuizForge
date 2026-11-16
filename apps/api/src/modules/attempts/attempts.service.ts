import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type {
  AttemptDetail,
  AttemptQuestion,
  AttemptSummary,
  SanitizedOption,
  SaveAnswersBatchDto,
  SaveAnswersResponse,
  SavedAnswer,
  SessionPreview,
  SubmitAttemptResponse,
} from '@quizforge/shared-types';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xem trước thông tin phòng thi trước khi thí sinh bắt đầu làm bài
   */
  async getJoinSessionPreview(userId: string, rawCode: string): Promise<SessionPreview> {
    const joinCode = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(joinCode)) {
      throw new BadRequestException('Mã phòng thi phải gồm đúng 6 ký tự chữ hoa hoặc chữ số');
    }

    const session = await this.prisma.testSession.findFirst({
      where: { joinCode },
      include: {
        version: {
          include: {
            test: {
              include: {
                author: {
                  select: { id: true, name: true },
                },
              },
            },
            questionSnapshots: {
              select: { id: true, points: true },
            },
            attempts: {
              where: { userId },
              select: { id: true, attemptNumber: true, status: true, startedAt: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phòng thi với mã đã cung cấp');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Phòng thi chưa mở hoặc đã kết thúc');
    }

    if (session.version.test.status === 'CLOSED') {
      throw new BadRequestException('Bài kiểm tra này đã bị đóng bởi người tạo');
    }

    const activeAttempt = session.version.attempts.find((a) => a.status === 'IN_PROGRESS');
    const usedAttempts = session.version.attempts.filter((a) => a.status !== 'IN_PROGRESS').length;

    let canAttempt = true;
    let reason: string | undefined;

    if (activeAttempt) {
      canAttempt = true;
    } else if (usedAttempts >= session.version.maxAttempts) {
      canAttempt = false;
      reason = 'Bạn đã sử dụng hết số lượt làm bài cho phép cho bài thi này';
    }

    const totalQuestions = session.version.questionSnapshots.length;
    const totalPoints = session.version.totalPoints;

    return {
      sessionId: session.id,
      joinCode: session.joinCode ?? joinCode,
      testTitle: session.version.title || session.version.test.title,
      description: session.version.description ?? session.version.test.description,
      instructions: session.version.instructions ?? session.version.test.instructions,
      authorName: session.version.test.author.name,
      timeLimitMinutes: session.version.timeLimitMinutes,
      totalQuestions,
      totalPoints,
      maxAttempts: session.version.maxAttempts,
      usedAttempts,
      activeAttemptId: activeAttempt?.id ?? null,
      canAttempt,
      reason,
    };
  }

  /**
   * Bắt đầu một lượt làm bài mới hoặc tiếp tục bài thi đang dở dang (resume)
   */
  async startOrResumeAttempt(userId: string, rawCode: string): Promise<AttemptDetail> {
    const joinCode = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(joinCode)) {
      throw new BadRequestException('Mã phòng thi phải gồm đúng 6 ký tự chữ hoa hoặc chữ số');
    }

    const session = await this.prisma.testSession.findFirst({
      where: { joinCode },
      include: {
        version: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                status: true,
                description: true,
                instructions: true,
              },
            },
            questionSnapshots: {
              orderBy: { order: 'asc' },
            },
            attempts: {
              where: { userId },
              select: { id: true, attemptNumber: true, status: true, expiresAt: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phòng thi với mã đã cung cấp');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Phòng thi chưa mở hoặc đã kết thúc');
    }

    if (session.version.test.status === 'CLOSED') {
      throw new BadRequestException('Bài kiểm tra này đã bị đóng bởi người tạo');
    }

    if (session.version.questionSnapshots.length === 0) {
      throw new BadRequestException('Bài kiểm tra chưa có câu hỏi nào để làm bài');
    }

    // 1. Kiểm tra bài làm đang dang dở (IN_PROGRESS)
    const activeAttempt = session.version.attempts.find((a) => a.status === 'IN_PROGRESS');
    if (activeAttempt) {
      const now = new Date();
      // Nếu có timeLimit và đã quá hạn (cộng 30s grace period) -> tự động submit
      if (activeAttempt.expiresAt && now.getTime() > activeAttempt.expiresAt.getTime() + 30000) {
        await this.prisma.attempt.update({
          where: { id: activeAttempt.id },
          data: { status: 'SUBMITTED', submittedAt: activeAttempt.expiresAt },
        });
      } else {
        return this.getAttemptDetail(userId, activeAttempt.id);
      }
    }

    // 2. Kiểm tra giới hạn số lượt thi
    const completedAttempts = await this.prisma.attempt.count({
      where: {
        versionId: session.version.id,
        userId,
        status: { not: 'IN_PROGRESS' },
      },
    });

    if (completedAttempts >= session.version.maxAttempts) {
      throw new BadRequestException('Bạn đã sử dụng hết số lượt làm bài cho phép');
    }

    const attemptNumber = completedAttempts + 1;
    const now = new Date();
    const expiresAt = session.version.timeLimitMinutes
      ? new Date(now.getTime() + session.version.timeLimitMinutes * 60 * 1000)
      : null;

    // 3. Xử lý xáo trộn câu hỏi và đáp án
    // Luôn xáo trộn thứ tự câu hỏi và phương án trắc nghiệm cho mỗi lượt làm bài (attempt)
    // để đảm bảo tính công bằng và chống gian lận (tránh đáp án đúng luôn rơi vào lựa chọn A)
    const snapshots = [...session.version.questionSnapshots];
    if (snapshots.length > 1) {
      this.shuffleArray(snapshots);
    }

    const questionOrderItems = snapshots.map((snapshot) => {
      let shuffledOptionIds: string[] | null = null;
      if (
        Array.isArray(snapshot.options) &&
        snapshot.options.length > 1 &&
        (snapshot.type === 'SINGLE_CHOICE' || snapshot.type === 'MULTIPLE_CHOICE')
      ) {
        const rawOpts = snapshot.options as Array<{ id?: string; text?: string }>;
        const optsCopy = [...rawOpts];
        this.shuffleArray(optsCopy);
        shuffledOptionIds = optsCopy.map((o, idx) => String(o.id ?? `opt-${idx}`));
      }
      return {
        snapshotId: snapshot.id,
        shuffledOptionIds,
      };
    });

    // 4. Khởi tạo nguyên tử trong Prisma transaction
    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.attempt.create({
        data: {
          versionId: session.version.id,
          sessionId: session.id,
          userId,
          attemptNumber,
          status: 'IN_PROGRESS',
          totalPoints: session.version.totalPoints,
          startedAt: now,
          expiresAt,
        },
      });

      await tx.attemptQuestionOrder.createMany({
        data: questionOrderItems.map((item, index) => ({
          attemptId: created.id,
          snapshotId: item.snapshotId,
          assignedOrder: index + 1,
          shuffledOptionIds: item.shuffledOptionIds ?? Prisma.DbNull,
        })),
      });

      return created;
    });

    return this.getAttemptDetail(userId, attempt.id);
  }

  /**
   * Lấy chi tiết bài làm với dữ liệu đã được khử trùng bảo mật (Sanitization: Không lộ đáp án đúng, giải thích hay rubric)
   */
  async getAttemptDetail(userId: string, attemptId: string): Promise<AttemptDetail> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        version: {
          include: {
            test: {
              select: { title: true, description: true, instructions: true, status: true },
            },
            questionSnapshots: true,
          },
        },
        questionOrders: {
          orderBy: { assignedOrder: 'asc' },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập bài làm này');
    }

    // Map câu hỏi theo đúng thứ tự đã lưu trong questionOrders
    const snapshotMap = new Map(attempt.version.questionSnapshots.map((s) => [s.id, s]));

    const questions: AttemptQuestion[] = attempt.questionOrders.map((qo) => {
      const snapshot = snapshotMap.get(qo.snapshotId);
      if (!snapshot) {
        throw new NotFoundException(`Không tìm thấy câu hỏi snapshot ${qo.snapshotId}`);
      }

      let rawOptions: Array<{ id: string; text?: string; order?: number }> = [];
      if (Array.isArray(snapshot.options)) {
        rawOptions = snapshot.options as Array<{ id: string; text?: string; order?: number }>;
      }

      // Nếu có thứ tự xáo trộn phương án đã lưu, sắp xếp lại theo danh sách ID
      let orderList: string[] | null = null;
      if (Array.isArray(qo.shuffledOptionIds)) {
        orderList = qo.shuffledOptionIds as string[];
      } else if (typeof qo.shuffledOptionIds === 'string') {
        try {
          const parsed = JSON.parse(qo.shuffledOptionIds);
          if (Array.isArray(parsed)) {
            orderList = parsed as string[];
          }
        } catch {
          orderList = null;
        }
      }

      if (orderList && orderList.length > 0) {
        const optMap = new Map(rawOptions.map((o, idx) => [String(o.id ?? `opt-${idx}`), o]));
        const sorted: typeof rawOptions = [];
        for (const optId of orderList) {
          const found = optMap.get(String(optId));
          if (found) sorted.push(found);
        }
        for (let idx = 0; idx < rawOptions.length; idx++) {
          const opt = rawOptions[idx];
          if (opt) {
            const optKey = String(opt.id ?? `opt-${idx}`);
            if (!orderList.includes(optKey) && !sorted.includes(opt)) {
              sorted.push(opt);
            }
          }
        }
        rawOptions = sorted;
      } else if (
        rawOptions.length > 1 &&
        (snapshot.type === 'SINGLE_CHOICE' || snapshot.type === 'MULTIPLE_CHOICE')
      ) {
        // Fallback: nếu bài làm cũ chưa có shuffledOptionIds đã lưu, xáo trộn trực tiếp để không bị cố định đáp án A
        const optsCopy = [...rawOptions];
        this.shuffleArray(optsCopy);
        rawOptions = optsCopy;
      }

      // Khử trùng tuyệt đối: CHỈ trả về id, text, order. KHÔNG BAO GIỜ gửi isCorrect hay explanation!
      const sanitizedOptions: SanitizedOption[] = rawOptions.map((opt, idx) => ({
        id: String(opt.id),
        text: String(opt.text ?? ''),
        order: idx + 1,
      }));

      return {
        snapshotId: snapshot.id,
        order: qo.assignedOrder,
        points: snapshot.points,
        type: snapshot.type,
        prompt: snapshot.prompt,
        options: sanitizedOptions,
      };
    });

    // Map câu trả lời đã lưu
    const answersRecord: Record<string, SavedAnswer> = {};
    for (const ans of attempt.answers) {
      answersRecord[ans.snapshotId] = {
        snapshotId: ans.snapshotId,
        selectedOptionIds: Array.isArray(ans.selectedOptionIds)
          ? (ans.selectedOptionIds as string[])
          : undefined,
        textAnswer: ans.textAnswer ?? undefined,
        updatedAt: ans.updatedAt.toISOString(),
      };
    }

    return {
      id: attempt.id,
      versionId: attempt.versionId,
      sessionId: attempt.sessionId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      totalPoints: attempt.totalPoints,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      serverTime: new Date().toISOString(),
      timeLimitMinutes: attempt.version.timeLimitMinutes,
      title: attempt.version.title || attempt.version.test.title,
      instructions: attempt.version.instructions ?? attempt.version.test.instructions,
      questions,
      answers: answersRecord,
    };
  }

  /**
   * Tự động lưu câu trả lời (Autosave Answers)
   */
  async saveAnswers(
    userId: string,
    attemptId: string,
    dto: SaveAnswersBatchDto,
  ): Promise<SaveAnswersResponse> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy bài làm');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật bài làm này');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Bài làm đã được nộp hoặc không ở trạng thái mở');
    }

    // Kiểm tra thời hạn làm bài (cho phép 30 giây grace period do độ trễ mạng)
    const now = new Date();
    if (attempt.expiresAt && now.getTime() > attempt.expiresAt.getTime() + 30000) {
      throw new BadRequestException('Đã hết thời gian làm bài thi');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.answers) {
        await tx.answer.upsert({
          where: {
            attemptId_snapshotId: {
              attemptId,
              snapshotId: item.snapshotId,
            },
          },
          update: {
            selectedOptionIds: item.selectedOptionIds
              ? (item.selectedOptionIds as Prisma.InputJsonValue)
              : Prisma.DbNull,
            textAnswer: item.textAnswer ?? null,
          },
          create: {
            attemptId,
            snapshotId: item.snapshotId,
            selectedOptionIds: item.selectedOptionIds
              ? (item.selectedOptionIds as Prisma.InputJsonValue)
              : Prisma.DbNull,
            textAnswer: item.textAnswer ?? null,
          },
        });
      }
    });

    return {
      success: true,
      savedCount: dto.answers.length,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Nộp bài thi một lần (Atomic Submit-Once Semantics)
   */
  async submitAttempt(userId: string, attemptId: string): Promise<SubmitAttemptResponse> {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.findUnique({
        where: { id: attemptId },
      });

      if (!attempt) {
        throw new NotFoundException('Không tìm thấy bài làm');
      }

      if (attempt.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền nộp bài làm này');
      }

      if (attempt.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Bài làm đã được nộp trước đó hoặc không ở trạng thái mở');
      }

      const submitted = await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      return {
        id: submitted.id,
        status: submitted.status,
        submittedAt: (submitted.submittedAt ?? new Date()).toISOString(),
        message: 'Nộp bài thi thành công',
      };
    });
  }

  /**
   * Lấy lịch sử các bài thi của thí sinh
   */
  async getUserAttempts(userId: string): Promise<AttemptSummary[]> {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      include: {
        version: {
          include: {
            test: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      versionId: a.versionId,
      sessionId: a.sessionId,
      testTitle: a.version.title || a.version.test.title,
      attemptNumber: a.attemptNumber,
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
      score: a.score,
      totalPoints: a.totalPoints,
    }));
  }

  /**
   * Thuật toán xáo trộn Fisher-Yates
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      if (temp !== undefined && array[j] !== undefined) {
        array[i] = array[j] as T;
        array[j] = temp;
      }
    }
  }
}
