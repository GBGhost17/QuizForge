import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, QuestionQueryDto, UpdateQuestionDto } from './dto';
import { CreateQuestionSchema, UpdateQuestionSchema } from '@quizforge/validation';
import type { PaginatedResult, Question, QuestionOption } from '@quizforge/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies that the question bank exists and is owned by the user.
   */
  private async verifyBankOwnership(userId: string, bankId: string): Promise<void> {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: bankId },
    });

    if (!bank) {
      throw new NotFoundException('Không tìm thấy ngân hàng câu hỏi');
    }

    if (bank.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ngân hàng câu hỏi này');
    }
  }

  /**
   * Creates a new question with options inside a question bank.
   */
  async create(userId: string, bankId: string, dto: CreateQuestionDto): Promise<Question> {
    await this.verifyBankOwnership(userId, bankId);

    // Validate type-specific constraints (e.g. single choice must have 1 correct)
    const validationResult = CreateQuestionSchema.safeParse(dto);
    if (!validationResult.success) {
      throw new BadRequestException(
        validationResult.error.errors[0]?.message || 'Dữ liệu câu hỏi không hợp lệ',
      );
    }

    const validated = validationResult.data;

    const createdQuestion = await this.prisma.$transaction(async (tx) => {
      return tx.question.create({
        data: {
          bankId,
          type: validated.type,
          prompt: validated.prompt,
          explanation: validated.explanation || null,
          topic: validated.topic || null,
          tags: validated.tags || [],
          difficulty: validated.difficulty || 'MEDIUM',
          defaultPoints: validated.defaultPoints || 1.0,
          rubric: validated.rubric ? (validated.rubric as Prisma.InputJsonValue) : Prisma.JsonNull,
          options: {
            create: (validated.options || []).map((opt, idx) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation || null,
              order: opt.order ?? idx,
            })),
          },
        },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    return this.mapToQuestion(createdQuestion);
  }

  /**
   * Retrieves paginated questions in a specific question bank.
   */
  async findAll(
    userId: string,
    bankId: string,
    query: QuestionQueryDto,
  ): Promise<PaginatedResult<Question>> {
    await this.verifyBankOwnership(userId, bankId);

    const { q, type, difficulty, topic, isArchived, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {
      bankId,
      ...(type ? { type } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(topic ? { topic: { contains: topic, mode: 'insensitive' } } : {}),
      ...(isArchived !== undefined ? { isArchived } : {}),
      ...(q ? { prompt: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [total, questions] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: questions.map((q) => this.mapToQuestion(q)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single question by ID with ownership verification.
   */
  async findOne(userId: string, id: string): Promise<Question> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        bank: true,
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Không tìm thấy câu hỏi');
    }

    if (question.bank.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập câu hỏi này');
    }

    return this.mapToQuestion(question);
  }

  /**
   * Updates an existing question and replaces its options if provided.
   */
  async update(userId: string, id: string, dto: UpdateQuestionDto): Promise<Question> {
    const existing = await this.findOne(userId, id);

    // Merge for full validation if options or type changed
    const effectiveType = dto.type || existing.type;
    const effectiveOptions = dto.options || existing.options;

    const validationResult = UpdateQuestionSchema.safeParse({
      ...dto,
      type: effectiveType,
      options: effectiveOptions,
    });

    if (!validationResult.success) {
      throw new BadRequestException(
        validationResult.error.errors[0]?.message || 'Dữ liệu câu hỏi không hợp lệ',
      );
    }

    const updatedQuestion = await this.prisma.$transaction(async (tx) => {
      // If options are explicitly provided, replace existing options
      if (dto.options) {
        await tx.questionOption.deleteMany({
          where: { questionId: id },
        });

        await tx.questionOption.createMany({
          data: dto.options.map((opt, idx) => ({
            questionId: id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation || null,
            order: opt.order ?? idx,
          })),
        });
      }

      return tx.question.update({
        where: { id },
        data: {
          ...(dto.prompt !== undefined ? { prompt: dto.prompt.trim() } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
          ...(dto.defaultPoints !== undefined ? { defaultPoints: dto.defaultPoints } : {}),
          ...(dto.topic !== undefined ? { topic: dto.topic ? dto.topic.trim() : null } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.explanation !== undefined
            ? { explanation: dto.explanation ? dto.explanation.trim() : null }
            : {}),
          ...(dto.rubric !== undefined
            ? {
                rubric: dto.rubric ? (dto.rubric as Prisma.InputJsonValue) : Prisma.JsonNull,
              }
            : {}),
          ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
        },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    return this.mapToQuestion(updatedQuestion);
  }

  /**
   * Deletes a question or archives it if already referenced in published tests.
   */
  async delete(userId: string, id: string): Promise<{ message: string; isArchived: boolean }> {
    await this.findOne(userId, id);

    const snapshotCount = await this.prisma.testQuestionSnapshot.count({
      where: { questionId: id },
    });

    if (snapshotCount > 0) {
      await this.prisma.question.update({
        where: { id },
        data: { isArchived: true },
      });
      return {
        message: 'Câu hỏi đã được lưu trữ vì đã sử dụng trong đề thi',
        isArchived: true,
      };
    }

    await this.prisma.question.delete({
      where: { id },
    });

    return {
      message: 'Đã xóa câu hỏi thành công',
      isArchived: false,
    };
  }

  private mapToQuestion(q: {
    id: string;
    bankId: string;
    type: string;
    prompt: string;
    explanation: string | null;
    topic: string | null;
    tags: string[];
    difficulty: string;
    defaultPoints: number;
    rubric: unknown;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    options: Array<{
      id: string;
      questionId: string;
      text: string;
      isCorrect: boolean;
      explanation: string | null;
      order: number;
      createdAt: Date;
    }>;
  }): Question {
    return {
      id: q.id,
      bankId: q.bankId,
      type: q.type as Question['type'],
      prompt: q.prompt,
      explanation: q.explanation,
      topic: q.topic,
      tags: q.tags,
      difficulty: q.difficulty as Question['difficulty'],
      defaultPoints: q.defaultPoints,
      rubric: q.rubric ? (q.rubric as Question['rubric']) : null,
      isArchived: q.isArchived,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      options: q.options.map((opt): QuestionOption => ({
        id: opt.id,
        questionId: opt.questionId,
        text: opt.text,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation,
        order: opt.order,
        createdAt: opt.createdAt.toISOString(),
      })),
    };
  }
}
