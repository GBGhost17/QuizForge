import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsService } from './attempts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AttemptsService', () => {
  let service: AttemptsService;
  let prisma: Record<string, Record<string, jest.Mock> | jest.Mock>;

  const mockSnapshot = {
    id: 'snap-1',
    versionId: 'ver-1',
    order: 1,
    points: 10,
    type: 'SINGLE_CHOICE',
    prompt: 'What is 1 + 1?',
    explanation: 'Secret explanation that must NOT be exposed',
    rubric: { secretRubric: true },
    options: [
      { id: 'opt-1', text: '2', isCorrect: true, explanation: 'Correct answer explanation' },
      { id: 'opt-2', text: '3', isCorrect: false },
    ],
  };

  const mockSession = {
    id: 'sess-1',
    joinCode: 'ABC123',
    status: 'ACTIVE',
    version: {
      id: 'ver-1',
      title: 'Math Quiz',
      description: 'Quiz description',
      instructions: 'Do your best',
      timeLimitMinutes: 30,
      maxAttempts: 2,
      totalPoints: 10,
      shuffleQuestions: false,
      shuffleOptions: false,
      test: {
        id: 'test-1',
        title: 'Math Test',
        status: 'PUBLISHED',
        author: { id: 'teacher-1', name: 'Teacher 1' },
      },
      questionSnapshots: [mockSnapshot],
      attempts: [],
    },
  };

  beforeEach(async () => {
    prisma = {
      testSession: {
        findFirst: jest.fn(),
      },
      attempt: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      attemptQuestionOrder: {
        createMany: jest.fn(),
      },
      answer: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttemptsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
  });

  describe('getJoinSessionPreview', () => {
    it('throws BadRequestException for invalid join code length or format', async () => {
      await expect(service.getJoinSessionPreview('user-1', 'INVALID_CODE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when session is not found', async () => {
      prisma.testSession.findFirst.mockResolvedValue(null);
      await expect(service.getJoinSessionPreview('user-1', 'ABC123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns preview with sanitized metadata', async () => {
      prisma.testSession.findFirst.mockResolvedValue(mockSession);
      const preview = await service.getJoinSessionPreview('user-1', 'ABC123');

      expect(preview.joinCode).toBe('ABC123');
      expect(preview.testTitle).toBe('Math Quiz');
      expect(preview.totalQuestions).toBe(1);
      expect(preview.maxAttempts).toBe(2);
      expect(preview.canAttempt).toBe(true);
    });

    it('flags canAttempt false when max attempts reached', async () => {
      const sessionWithAttempts = {
        ...mockSession,
        version: {
          ...mockSession.version,
          attempts: [
            { id: 'att-1', attemptNumber: 1, status: 'SUBMITTED' },
            { id: 'att-2', attemptNumber: 2, status: 'SUBMITTED' },
          ],
        },
      };
      prisma.testSession.findFirst.mockResolvedValue(sessionWithAttempts);
      const preview = await service.getJoinSessionPreview('user-1', 'ABC123');

      expect(preview.canAttempt).toBe(false);
      expect(preview.usedAttempts).toBe(2);
      expect(preview.reason).toBeDefined();
    });
  });

  describe('getAttemptDetail & Data Sanitization', () => {
    it('strictly sanitizes questions and options (no isCorrect, explanation, rubric)', async () => {
      const mockAttempt = {
        id: 'att-1',
        versionId: 'ver-1',
        sessionId: 'sess-1',
        userId: 'user-1',
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        totalPoints: 10,
        startedAt: new Date('2026-11-11T20:00:00Z'),
        submittedAt: null,
        expiresAt: new Date('2026-11-11T20:30:00Z'),
        version: {
          title: 'Math Test',
          timeLimitMinutes: 30,
          test: { title: 'Math Test', instructions: 'No calculators' },
          questionSnapshots: [mockSnapshot],
        },
        questionOrders: [
          { attemptId: 'att-1', snapshotId: 'snap-1', assignedOrder: 1, shuffledOptionIds: null },
        ],
        answers: [],
      };

      prisma.attempt.findUnique.mockResolvedValue(mockAttempt);

      const detail = await service.getAttemptDetail('user-1', 'att-1');

      expect(detail.id).toBe('att-1');
      expect(detail.questions).toHaveLength(1);

      const q = detail.questions[0];
      expect(q).toBeDefined();
      if (!q) return;
      expect(q.prompt).toBe('What is 1 + 1?');
      const qRecord = q as unknown as Record<string, unknown>;
      expect(qRecord['explanation']).toBeUndefined();
      expect(qRecord['rubric']).toBeUndefined();

      expect(q.options).toHaveLength(2);
      const optRecord = q.options[0] as unknown as Record<string, unknown>;
      expect(optRecord['isCorrect']).toBeUndefined();
      expect(optRecord['explanation']).toBeUndefined();
      expect(q.options[0]?.text).toBe('2');
    });

    it('rejects access from another user (IDOR prevention)', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'different-user',
      });

      await expect(service.getAttemptDetail('user-1', 'att-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('saveAnswers (Autosave)', () => {
    it('saves answers batch within time limit', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: 'IN_PROGRESS',
        expiresAt: new Date(Date.now() + 600000), // 10 minutes in future
      });

      const res = await service.saveAnswers('user-1', 'att-1', {
        answers: [{ snapshotId: 'snap-1', selectedOptionIds: ['opt-1'] }],
      });

      expect(res.success).toBe(true);
      expect(res.savedCount).toBe(1);
      expect(prisma.answer.upsert).toHaveBeenCalledTimes(1);
    });

    it('rejects saving when attempt is already submitted', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: 'SUBMITTED',
      });

      await expect(
        service.saveAnswers('user-1', 'att-1', {
          answers: [{ snapshotId: 'snap-1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAttempt (Submit-once Semantics)', () => {
    it('submits an in-progress attempt successfully', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: 'IN_PROGRESS',
      });

      prisma.attempt.update.mockResolvedValue({
        id: 'att-1',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      const res = await service.submitAttempt('user-1', 'att-1');
      expect(res.status).toBe('SUBMITTED');
      expect(prisma.attempt.update).toHaveBeenCalled();
    });

    it('rejects duplicate submission', async () => {
      prisma.attempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        status: 'SUBMITTED',
      });

      await expect(service.submitAttempt('user-1', 'att-1')).rejects.toThrow(BadRequestException);
    });
  });
});
