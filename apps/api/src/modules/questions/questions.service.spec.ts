import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Difficulty, QuestionType } from '@prisma/client';

describe('QuestionsService', () => {
  let service: QuestionsService;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockBank = {
    id: 'bank-1',
    ownerId: 'user-1',
    title: 'Ngân hàng Toán',
  };

  const mockQuestion = {
    id: 'q-1',
    bankId: 'bank-1',
    type: QuestionType.SINGLE_CHOICE,
    prompt: '2 + 2 = ?',
    explanation: '2 + 2 = 4',
    topic: 'Toán',
    tags: ['toan-hoc'],
    difficulty: Difficulty.EASY,
    defaultPoints: 1.0,
    rubric: null,
    isArchived: false,
    createdAt: mockDate,
    updatedAt: mockDate,
    options: [
      {
        id: 'opt-1',
        questionId: 'q-1',
        text: '4',
        isCorrect: true,
        explanation: 'Đúng',
        order: 0,
        createdAt: mockDate,
      },
      {
        id: 'opt-2',
        questionId: 'q-1',
        text: '5',
        isCorrect: false,
        explanation: 'Sai',
        order: 1,
        createdAt: mockDate,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrisma: any = {
    questionBank: {
      findUnique: jest.fn().mockResolvedValue(mockBank),
    },
    question: {
      create: jest.fn().mockResolvedValue(mockQuestion),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockQuestion]),
      findUnique: jest.fn().mockResolvedValue({
        ...mockQuestion,
        bank: mockBank,
      }),
      update: jest.fn().mockResolvedValue(mockQuestion),
      delete: jest.fn().mockResolvedValue(mockQuestion),
    },
    questionOption: {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    testQuestionSnapshot: {
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  describe('create', () => {
    it('creates single choice question with valid options', async () => {
      const result = await service.create('user-1', 'bank-1', {
        prompt: '2 + 2 = ?',
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
        ],
      });

      expect(mockPrisma.questionBank.findUnique).toHaveBeenCalledWith({
        where: { id: 'bank-1' },
      });
      expect(result.id).toBe('q-1');
      expect(result.options).toHaveLength(2);
    });

    it('rejects question when user does not own bank', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValueOnce({
        id: 'bank-1',
        ownerId: 'other-user',
      });

      await expect(
        service.create('user-1', 'bank-1', {
          prompt: '2 + 2 = ?',
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects single choice question with 0 correct options', async () => {
      await expect(
        service.create('user-1', 'bank-1', {
          prompt: '2 + 2 = ?',
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { text: '4', isCorrect: false },
            { text: '5', isCorrect: false },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated questions for bank', async () => {
      const result = await service.findAll('user-1', 'bank-1', {
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.question.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns question if user owns bank', async () => {
      const result = await service.findOne('user-1', 'q-1');
      expect(result.id).toBe('q-1');
    });

    it('throws NotFoundException when question does not exist', async () => {
      mockPrisma.question.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own question bank', async () => {
      mockPrisma.question.findUnique.mockResolvedValueOnce({
        ...mockQuestion,
        bank: { id: 'bank-1', ownerId: 'other-user' },
      });
      await expect(service.findOne('user-1', 'q-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates question and replaces options', async () => {
      const result = await service.update('user-1', 'q-1', {
        prompt: 'Updated prompt?',
        options: [
          { text: 'Ans 1', isCorrect: true },
          { text: 'Ans 2', isCorrect: false },
        ],
      });

      expect(mockPrisma.questionOption.deleteMany).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
      });
      expect(mockPrisma.questionOption.createMany).toHaveBeenCalled();
      expect(result.id).toBe('q-1');
    });
  });

  describe('delete', () => {
    it('hard-deletes question if not referenced in test snapshots', async () => {
      mockPrisma.testQuestionSnapshot.count.mockResolvedValueOnce(0);

      const result = await service.delete('user-1', 'q-1');

      expect(mockPrisma.question.delete).toHaveBeenCalledWith({ where: { id: 'q-1' } });
      expect(result.isArchived).toBe(false);
    });

    it('soft-deletes question if referenced in test snapshots', async () => {
      mockPrisma.testQuestionSnapshot.count.mockResolvedValueOnce(3);

      const result = await service.delete('user-1', 'q-1');

      expect(mockPrisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
      expect(result.message).toMatch(/đã được lưu trữ/i);
    });
  });
});
