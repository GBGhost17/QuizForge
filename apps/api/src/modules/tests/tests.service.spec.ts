import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestsService } from './tests.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TestsService', () => {
  let service: TestsService;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockQuestion = {
    id: 'q-1',
    bankId: 'bank-1',
    type: 'SINGLE_CHOICE',
    prompt: '2 + 2 = ?',
    explanation: 'Giải thích cơ bản',
    defaultPoints: 1.0,
    rubric: null,
    isArchived: false,
    bank: {
      id: 'bank-1',
      ownerId: 'user-1',
    },
    options: [
      { id: 'opt-1', text: '4', isCorrect: true, explanation: 'Chính xác', order: 0 },
      { id: 'opt-2', text: '5', isCorrect: false, explanation: 'Sai', order: 1 },
    ],
  };

  const mockSnapshot = {
    id: 'snap-1',
    versionId: 'ver-1',
    questionId: 'q-1',
    order: 1,
    points: 1.0,
    type: 'SINGLE_CHOICE',
    prompt: '2 + 2 = ?',
    explanation: 'Giải thích cơ bản',
    options: mockQuestion.options,
    rubric: null,
    createdAt: mockDate,
  };

  const mockTestVersion = {
    id: 'ver-1',
    testId: 'test-1',
    versionNumber: 1,
    title: 'Kiểm tra 15 phút',
    description: 'Mô tả bài kiểm tra',
    instructions: 'Không dùng tài liệu',
    timeLimitMinutes: 15,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    releaseMode: 'ON_FINALIZATION',
    passScore: 5.0,
    totalPoints: 1.0,
    isPublished: false,
    publishedAt: null,
    createdAt: mockDate,
    questionSnapshots: [mockSnapshot],
    sessions: [],
    attempts: [],
  };

  const mockTest = {
    id: 'test-1',
    authorId: 'user-1',
    title: 'Kiểm tra 15 phút',
    description: 'Mô tả bài kiểm tra',
    instructions: 'Không dùng tài liệu',
    mode: 'ASSIGNMENT',
    status: 'DRAFT',
    createdAt: mockDate,
    updatedAt: mockDate,
    versions: [mockTestVersion],
  };

  const mockPrisma = {
    test: {
      create: jest.fn().mockResolvedValue(mockTest),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockTest]),
      findUnique: jest.fn().mockResolvedValue(mockTest),
      update: jest.fn().mockResolvedValue(mockTest),
      delete: jest.fn().mockResolvedValue(mockTest),
    },
    testVersion: {
      create: jest.fn().mockResolvedValue(mockTestVersion),
      update: jest.fn().mockResolvedValue(mockTestVersion),
    },
    testQuestionSnapshot: {
      create: jest.fn().mockResolvedValue(mockSnapshot),
      findMany: jest.fn().mockResolvedValue([mockSnapshot]),
      update: jest.fn().mockResolvedValue(mockSnapshot),
      delete: jest.fn().mockResolvedValue(mockSnapshot),
    },
    question: {
      findUnique: jest.fn().mockResolvedValue(mockQuestion),
      findMany: jest.fn().mockResolvedValue([mockQuestion]),
    },
    testSession: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'sess-1',
        versionId: 'ver-1',
        joinCode: 'ABC123',
        status: 'ACTIVE',
        createdAt: mockDate,
        updatedAt: mockDate,
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn().mockImplementation((args) => {
      if (typeof args === 'function') {
        return args(mockPrisma);
      }
      return Promise.all(args);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TestsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TestsService>(TestsService);
  });

  describe('create', () => {
    it('creates a new test with DRAFT status and initial TestVersion', async () => {
      const result = await service.create('user-1', {
        title: 'Kiểm tra 15 phút',
        description: 'Mô tả bài kiểm tra',
        instructions: 'Không dùng tài liệu',
        timeLimitMinutes: 15,
        maxAttempts: 1,
      });

      expect(mockPrisma.test.create).toHaveBeenCalled();
      expect(result.id).toBe('test-1');
      expect(result.status).toBe('DRAFT');
      expect(result.versions?.[0]?.versionNumber).toBe(1);
    });
  });

  describe('findAll', () => {
    it('returns paginated tests for user', async () => {
      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(mockPrisma.test.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns test detail if owned by user', async () => {
      const result = await service.findOne('user-1', 'test-1');
      expect(result.id).toBe('test-1');
    });

    it('throws NotFoundException if test does not exist', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('user-1', 'non-existing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if test is owned by another user', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({ ...mockTest, authorId: 'other-user' });
      await expect(service.findOne('user-1', 'test-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates test configuration when status is DRAFT', async () => {
      const result = await service.update('user-1', 'test-1', {
        title: 'Tiêu đề mới',
        timeLimitMinutes: 30,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('test-1');
    });

    it('throws BadRequestException if test is not in DRAFT status', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({ ...mockTest, status: 'PUBLISHED' });
      await expect(
        service.update('user-1', 'test-1', { title: 'Thử đổi tiêu đề' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes test if no attempts exist', async () => {
      const result = await service.remove('user-1', 'test-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.test.delete).toHaveBeenCalledWith({ where: { id: 'test-1' } });
    });

    it('throws BadRequestException if test has student attempts', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({
        ...mockTest,
        versions: [{ ...mockTestVersion, attempts: [{ id: 'att-1' }] }],
      });

      await expect(service.remove('user-1', 'test-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addQuestion', () => {
    it('adds a question snapshot to draft test', async () => {
      const result = await service.addQuestion('user-1', 'test-1', {
        questionId: 'q-1',
        points: 2.0,
      });

      expect(mockPrisma.testQuestionSnapshot.create).toHaveBeenCalled();
      expect(result.id).toBe('snap-1');
    });

    it('throws ForbiddenException if user does not own the question bank', async () => {
      mockPrisma.question.findUnique.mockResolvedValueOnce({
        ...mockQuestion,
        bank: { id: 'bank-2', ownerId: 'other-user' },
      });

      await expect(service.addQuestion('user-1', 'test-1', { questionId: 'q-1' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('publish', () => {
    it('publishes test, creates TestSession, and generates 6-char joinCode', async () => {
      await service.publish('user-1', 'test-1');

      expect(mockPrisma.testSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            joinCode: expect.stringMatching(/^[A-Z0-9]{6}$/),
            status: 'ACTIVE',
          }),
        }),
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException if test has no questions', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({
        ...mockTest,
        versions: [{ ...mockTestVersion, questionSnapshots: [] }],
      });

      await expect(service.publish('user-1', 'test-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if test is already published', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({
        ...mockTest,
        status: 'PUBLISHED',
      });

      await expect(service.publish('user-1', 'test-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('close', () => {
    it('closes published test and marks sessions as ENDED', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({
        ...mockTest,
        status: 'PUBLISHED',
      });

      await service.close('user-1', 'test-1');

      expect(mockPrisma.test.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-1' },
          data: { status: 'CLOSED' },
        }),
      );
      expect(mockPrisma.testSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ENDED' }),
        }),
      );
    });

    it('throws BadRequestException if test is in DRAFT status', async () => {
      mockPrisma.test.findUnique.mockResolvedValueOnce({
        ...mockTest,
        status: 'DRAFT',
      });

      await expect(service.close('user-1', 'test-1')).rejects.toThrow(BadRequestException);
    });
  });
});
