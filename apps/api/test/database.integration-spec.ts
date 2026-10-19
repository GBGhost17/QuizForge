import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { QuestionType, SessionStatus } from '@prisma/client';

describe('Database Integration Tests (Stage S02)', () => {
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  it('connects to PostgreSQL database successfully', async () => {
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    expect(result).toHaveLength(1);
    expect(result[0]?.connected).toBe(1);
  });

  it('can query seeded users (Teacher and Student)', async () => {
    const teacher = await prisma.user.findUnique({
      where: { email: 'teacher@quizforge.local' },
    });
    expect(teacher).not.toBeNull();
    expect(teacher?.name).toBe('Thầy Giáo Mẫu');

    const student = await prisma.user.findUnique({
      where: { email: 'student@quizforge.local' },
    });
    expect(student).not.toBeNull();
    expect(student?.name).toBe('Học Sinh Mẫu');
  });

  it('can query question bank with all 5 question types and options', async () => {
    const bank = await prisma.questionBank.findFirst({
      where: { title: 'Ngân hàng Câu hỏi Tin học Căn bản' },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    expect(bank).not.toBeNull();
    expect(bank?.questions.length).toBeGreaterThanOrEqual(5);

    const types = bank?.questions.map((q) => q.type);
    expect(types).toContain(QuestionType.SINGLE_CHOICE);
    expect(types).toContain(QuestionType.MULTIPLE_CHOICE);
    expect(types).toContain(QuestionType.TRUE_FALSE);
    expect(types).toContain(QuestionType.SHORT_ANSWER);
    expect(types).toContain(QuestionType.ESSAY);
  });

  it('verifies immutable assessment snapshot and session lookup by joinCode', async () => {
    const session = await prisma.testSession.findUnique({
      where: { joinCode: 'QUIZ101' },
      include: {
        version: {
          include: {
            questionSnapshots: true,
          },
        },
      },
    });

    expect(session).not.toBeNull();
    expect(session?.status).toBe(SessionStatus.ACTIVE);
    expect(session?.version.questionSnapshots.length).toBeGreaterThanOrEqual(5);
    expect(session?.version.totalPoints).toBe(10.0);
  });

  it('supports atomic transaction boundaries for attempts and answer storage', async () => {
    const student = await prisma.user.findUnique({
      where: { email: 'student@quizforge.local' },
    });
    const session = await prisma.testSession.findUnique({
      where: { joinCode: 'QUIZ101' },
      include: { version: { include: { questionSnapshots: true } } },
    });

    expect(student).not.toBeNull();
    expect(session).not.toBeNull();
    if (!student || !session) {
      throw new Error('Test preconditions not met: student or session missing');
    }

    const firstSnapshot = session.version.questionSnapshots[0];
    if (!firstSnapshot) {
      throw new Error('No question snapshots found in test session');
    }

    // Perform an atomic attempt creation inside a transaction
    const testAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.create({
        data: {
          versionId: session.versionId,
          sessionId: session.id,
          userId: student.id,
          attemptNumber: 999, // Isolated number for test
          totalPoints: session.version.totalPoints,
        },
      });

      await tx.attemptQuestionOrder.create({
        data: {
          attemptId: attempt.id,
          snapshotId: firstSnapshot.id,
          assignedOrder: 0,
        },
      });

      await tx.answer.create({
        data: {
          attemptId: attempt.id,
          snapshotId: firstSnapshot.id,
          textAnswer: 'Test Answer',
        },
      });

      return attempt;
    });

    expect(testAttempt.id).toBeDefined();

    // Verify isolation and clean up test attempt
    const found = await prisma.attempt.findUnique({
      where: { id: testAttempt.id },
      include: { answers: true, questionOrders: true },
    });

    expect(found?.answers).toHaveLength(1);
    expect(found?.questionOrders).toHaveLength(1);

    // Clean up
    await prisma.attempt.delete({ where: { id: testAttempt.id } });
  });
});
