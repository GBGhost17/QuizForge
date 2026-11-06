import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionBanksService } from './question-banks.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QuestionBanksService', () => {
  let service: QuestionBanksService;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockBank = {
    id: 'bank-1',
    ownerId: 'user-1',
    title: 'Toán học 12',
    description: 'Đề ôn tập',
    isArchived: false,
    createdAt: mockDate,
    updatedAt: mockDate,
    _count: { questions: 5 },
  };

  const mockPrisma = {
    questionBank: {
      create: jest.fn().mockResolvedValue(mockBank),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockBank]),
      findUnique: jest.fn().mockResolvedValue(mockBank),
      update: jest.fn().mockResolvedValue({ ...mockBank, title: 'Updated Title' }),
      delete: jest.fn().mockResolvedValue(mockBank),
    },
    testQuestionSnapshot: {
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionBanksService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<QuestionBanksService>(QuestionBanksService);
  });

  describe('create', () => {
    it('creates a new question bank for user', async () => {
      const result = await service.create('user-1', {
        title: 'Toán học 12',
        description: 'Đề ôn tập',
      });

      expect(mockPrisma.questionBank.create).toHaveBeenCalledWith({
        data: {
          ownerId: 'user-1',
          title: 'Toán học 12',
          description: 'Đề ôn tập',
        },
        include: {
          _count: { select: { questions: true } },
        },
      });
      expect(result.id).toBe('bank-1');
      expect(result.title).toBe('Toán học 12');
    });
  });

  describe('findAll', () => {
    it('returns paginated question banks with search query', async () => {
      const result = await service.findAll('user-1', {
        q: 'Toán',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.questionBank.count).toHaveBeenCalled();
      expect(mockPrisma.questionBank.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns bank when found and user is owner', async () => {
      const result = await service.findOne('user-1', 'bank-1');
      expect(result.id).toBe('bank-1');
    });

    it('throws NotFoundException when bank does not exist', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not owner', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValueOnce({
        ...mockBank,
        ownerId: 'another-user',
      });
      await expect(service.findOne('user-1', 'bank-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates question bank when owned by user', async () => {
      const result = await service.update('user-1', 'bank-1', { title: 'Updated Title' });
      expect(mockPrisma.questionBank.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bank-1' },
          data: expect.objectContaining({ title: 'Updated Title' }),
        }),
      );
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('deletes bank when no snapshots reference it', async () => {
      mockPrisma.testQuestionSnapshot.count.mockResolvedValueOnce(0);

      const result = await service.delete('user-1', 'bank-1');

      expect(mockPrisma.questionBank.delete).toHaveBeenCalledWith({ where: { id: 'bank-1' } });
      expect(result.isArchived).toBe(false);
      expect(result.message).toMatch(/Đã xóa ngân hàng câu hỏi/i);
    });

    it('soft-deletes (archives) bank when referenced in snapshots', async () => {
      mockPrisma.testQuestionSnapshot.count.mockResolvedValueOnce(2);

      const result = await service.delete('user-1', 'bank-1');

      expect(mockPrisma.questionBank.update).toHaveBeenCalledWith({
        where: { id: 'bank-1' },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
      expect(result.message).toMatch(/đã được lưu trữ/i);
    });
  });
});
