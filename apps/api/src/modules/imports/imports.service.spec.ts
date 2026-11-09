import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { MarkdownParserService } from './markdown-parser.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImportsService', () => {
  let service: ImportsService;
  let prisma: {
    questionBank: { findUnique: jest.Mock };
    question: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let markdownParser: {
    parse: jest.Mock;
  };

  const mockUserId = 'user-123';
  const mockBankId = 'bank-abc';

  const mockBank = {
    id: mockBankId,
    ownerId: mockUserId,
    title: 'Ngân hàng Toán cao cấp',
  };

  beforeEach(async () => {
    prisma = {
      questionBank: {
        findUnique: jest.fn(),
      },
      question: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    markdownParser = {
      parse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarkdownParserService, useValue: markdownParser },
      ],
    }).compile();

    service = module.get<ImportsService>(ImportsService);
  });

  it('delegates markdown parsing to MarkdownParserService', async () => {
    markdownParser.parse.mockResolvedValue({
      questions: [],
      diagnostics: [],
      hasErrors: false,
    });

    const result = await service.parseMarkdown({ content: '# Test' });
    expect(markdownParser.parse).toHaveBeenCalledWith('# Test');
    expect(result.hasErrors).toBe(false);
  });

  describe('commitQuestions', () => {
    it('throws NotFoundException if target question bank does not exist', async () => {
      prisma.questionBank.findUnique.mockResolvedValue(null);

      await expect(
        service.commitQuestions(mockUserId, {
          bankId: 'non-existent',
          questions: [
            {
              type: 'SINGLE_CHOICE',
              prompt: 'Question 1',
              difficulty: 'EASY',
              defaultPoints: 1,
              rawSourceLine: 1,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user is not the owner of the question bank', async () => {
      prisma.questionBank.findUnique.mockResolvedValue({
        id: mockBankId,
        ownerId: 'different-user',
        title: 'Bank',
      });

      await expect(
        service.commitQuestions(mockUserId, {
          bankId: mockBankId,
          questions: [
            {
              type: 'SINGLE_CHOICE',
              prompt: 'Question 1',
              difficulty: 'EASY',
              defaultPoints: 1,
              rawSourceLine: 1,
            },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if questions array is empty', async () => {
      prisma.questionBank.findUnique.mockResolvedValue(mockBank);

      await expect(
        service.commitQuestions(mockUserId, {
          bankId: mockBankId,
          questions: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('transactionally inserts questions and options and returns summary', async () => {
      prisma.questionBank.findUnique.mockResolvedValue(mockBank);
      prisma.question.create.mockResolvedValue({ id: 'q-1' });

      const result = await service.commitQuestions(mockUserId, {
        bankId: mockBankId,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            prompt: 'Question 1',
            difficulty: 'EASY',
            defaultPoints: 1,
            rawSourceLine: 1,
            options: [
              { text: 'A', isCorrect: true, order: 0 },
              { text: 'B', isCorrect: false, order: 1 },
            ],
          },
          {
            type: 'TRUE_FALSE',
            prompt: 'Question 2',
            difficulty: 'MEDIUM',
            defaultPoints: 1,
            rawSourceLine: 10,
          },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.question.create).toHaveBeenCalledTimes(2);
      expect(result.count).toBe(2);
      expect(result.bankId).toBe(mockBankId);
      expect(result.message).toContain('Đã nhập thành công 2 câu hỏi');
    });
  });
});
