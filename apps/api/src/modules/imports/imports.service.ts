import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarkdownParserService } from './markdown-parser.service';
import { CommitMarkdownDto, ParseMarkdownDto } from './dto';
import type { MarkdownImportResult } from '@quizforge/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdownParser: MarkdownParserService,
  ) {}

  /**
   * Parses markdown content and returns structured preview with line-level diagnostics.
   * Does NOT mutate database.
   */
  async parseMarkdown(dto: ParseMarkdownDto): Promise<MarkdownImportResult> {
    return this.markdownParser.parse(dto.content);
  }

  /**
   * Transactionally commits validated questions into a target Question Bank.
   * Atomic operation: all questions succeed or total rollback occurs.
   */
  async commitQuestions(
    userId: string,
    dto: CommitMarkdownDto,
  ): Promise<{ count: number; bankId: string; message: string }> {
    // 1. Verify target bank ownership
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: dto.bankId },
    });

    if (!bank) {
      throw new NotFoundException('Không tìm thấy ngân hàng câu hỏi đích.');
    }

    if (bank.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền nhập câu hỏi vào ngân hàng này.');
    }

    if (!dto.questions || dto.questions.length === 0) {
      throw new BadRequestException('Danh sách câu hỏi cần nhập không được rỗng.');
    }

    // 2. Transactional insertion
    const createdQuestions = await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const q of dto.questions) {
        const created = await tx.question.create({
          data: {
            bankId: dto.bankId,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation || null,
            topic: q.topic || null,
            tags: q.tags || [],
            difficulty: q.difficulty || 'MEDIUM',
            defaultPoints: q.defaultPoints || 1.0,
            rubric: q.rubric ? (q.rubric as Prisma.InputJsonValue) : Prisma.JsonNull,
            options: {
              create: (q.options || []).map((opt, idx) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation || null,
                order: opt.order ?? idx,
              })),
            },
          },
        });
        results.push(created);
      }

      return results;
    });

    return {
      count: createdQuestions.length,
      bankId: dto.bankId,
      message: `Đã nhập thành công ${createdQuestions.length} câu hỏi vào ngân hàng "${bank.title}".`,
    };
  }
}
