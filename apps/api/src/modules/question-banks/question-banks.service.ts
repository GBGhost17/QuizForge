import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionBankDto, QuestionBankQueryDto, UpdateQuestionBankDto } from './dto';
import type { PaginatedResult, QuestionBank } from '@quizforge/shared-types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class QuestionBanksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new question bank for the authenticated user.
   */
  async create(userId: string, dto: CreateQuestionBankDto): Promise<QuestionBank> {
    const bank = await this.prisma.questionBank.create({
      data: {
        ownerId: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return this.mapToQuestionBank(bank);
  }

  /**
   * Retrieves a paginated list of question banks owned by the user.
   */
  async findAll(
    userId: string,
    query: QuestionBankQueryDto,
  ): Promise<PaginatedResult<QuestionBank>> {
    const { q, isArchived, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionBankWhereInput = {
      ownerId: userId,
      ...(isArchived !== undefined ? { isArchived } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, banks] = await Promise.all([
      this.prisma.questionBank.count({ where }),
      this.prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: banks.map((bank) => this.mapToQuestionBank(bank)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single question bank by ID with ownership verification.
   */
  async findOne(userId: string, id: string): Promise<QuestionBank> {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!bank) {
      throw new NotFoundException('Không tìm thấy ngân hàng câu hỏi');
    }

    if (bank.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ngân hàng câu hỏi này');
    }

    return this.mapToQuestionBank(bank);
  }

  /**
   * Updates an existing question bank.
   */
  async update(userId: string, id: string, dto: UpdateQuestionBankDto): Promise<QuestionBank> {
    await this.findOne(userId, id);

    const updated = await this.prisma.questionBank.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return this.mapToQuestionBank(updated);
  }

  /**
   * Deletes a question bank or soft-deletes (archives) if referenced in tests.
   */
  async delete(userId: string, id: string): Promise<{ message: string; isArchived: boolean }> {
    await this.findOne(userId, id);

    // Check if any question in this bank is referenced in published test snapshots
    const referencedSnapshotsCount = await this.prisma.testQuestionSnapshot.count({
      where: {
        question: {
          bankId: id,
        },
      },
    });

    if (referencedSnapshotsCount > 0) {
      await this.prisma.questionBank.update({
        where: { id },
        data: { isArchived: true },
      });
      return {
        message: 'Ngân hàng câu hỏi đã được lưu trữ do có câu hỏi đã sử dụng trong đề thi',
        isArchived: true,
      };
    }

    await this.prisma.questionBank.delete({
      where: { id },
    });

    return {
      message: 'Đã xóa ngân hàng câu hỏi thành công',
      isArchived: false,
    };
  }

  private mapToQuestionBank(bank: {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { questions: number };
  }): QuestionBank {
    return {
      id: bank.id,
      ownerId: bank.ownerId,
      title: bank.title,
      description: bank.description,
      isArchived: bank.isArchived,
      createdAt: bank.createdAt.toISOString(),
      updatedAt: bank.updatedAt.toISOString(),
      _count: bank._count,
    };
  }
}
