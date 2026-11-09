import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ImportsModule } from '../src/modules/imports/imports.module';
import { ImportsService } from '../src/modules/imports/imports.service';
describe('Markdown Import Integration Tests (Stage S06)', () => {
  let prisma: PrismaService;
  let importsService: ImportsService;
  let moduleRef: TestingModule;

  const testUserEmail = 'teacher.import@quizforge.local';
  let teacherId: string;
  let anotherUserId: string;
  let createdBankId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ImportsModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    importsService = moduleRef.get<ImportsService>(ImportsService);

    // Clean up if previous run left test user
    await prisma.user.deleteMany({
      where: { email: { in: [testUserEmail, 'other.import@quizforge.local'] } },
    });

    const teacher = await prisma.user.create({
      data: {
        email: testUserEmail,
        name: 'Import Teacher',
        role: 'USER',
      },
    });
    teacherId = teacher.id;

    const otherUser = await prisma.user.create({
      data: {
        email: 'other.import@quizforge.local',
        name: 'Other User',
        role: 'USER',
      },
    });
    anotherUserId = otherUser.id;

    const bank = await prisma.questionBank.create({
      data: {
        ownerId: teacherId,
        title: 'Ngân hàng kiểm thử nhập Markdown',
      },
    });
    createdBankId = bank.id;
  });

  afterAll(async () => {
    if (createdBankId) {
      await prisma.question.deleteMany({ where: { bankId: createdBankId } });
      await prisma.questionBank.deleteMany({ where: { id: createdBankId } });
    }
    if (teacherId || anotherUserId) {
      await prisma.user.deleteMany({
        where: { id: { in: [teacherId, anotherUserId].filter(Boolean) } },
      });
    }
    await prisma.$disconnect();
    await moduleRef.close();
  });

  it('parses valid markdown fixture and returns preview without database mutation', async () => {
    const fixturePath = path.join(__dirname, 'fixtures/markdown/valid-all-types.md');
    const content = fs.readFileSync(fixturePath, 'utf-8');

    const result = await importsService.parseMarkdown({ content });

    expect(result.hasErrors).toBe(false);
    expect(result.questions).toHaveLength(5);

    // Verify DB was NOT mutated
    const dbQuestionCount = await prisma.question.count({
      where: { bankId: createdBankId },
    });
    expect(dbQuestionCount).toBe(0);
  });

  it('transactionally commits parsed questions to the owned question bank', async () => {
    const fixturePath = path.join(__dirname, 'fixtures/markdown/valid-all-types.md');
    const content = fs.readFileSync(fixturePath, 'utf-8');
    const parseResult = await importsService.parseMarkdown({ content });

    const commitResult = await importsService.commitQuestions(teacherId, {
      bankId: createdBankId,
      questions: parseResult.questions,
    });

    expect(commitResult.count).toBe(5);
    expect(commitResult.bankId).toBe(createdBankId);

    // Verify questions and options exist in database
    const dbQuestions = await prisma.question.findMany({
      where: { bankId: createdBankId },
      include: { options: true },
    });

    expect(dbQuestions).toHaveLength(5);

    const singleChoice = dbQuestions.find((q) => q.type === 'SINGLE_CHOICE');
    expect(singleChoice).toBeDefined();
    expect(singleChoice?.options).toHaveLength(4);
    expect(singleChoice?.options.filter((o) => o.isCorrect)).toHaveLength(1);

    const multipleChoice = dbQuestions.find((q) => q.type === 'MULTIPLE_CHOICE');
    expect(multipleChoice).toBeDefined();
    expect(multipleChoice?.options.filter((o) => o.isCorrect)).toHaveLength(3);

    const essay = dbQuestions.find((q) => q.type === 'ESSAY');
    expect(essay).toBeDefined();
    const essayRubric = essay?.rubric as { modelAnswer?: string } | null;
    expect(essayRubric?.modelAnswer).toContain('Hàm đệ quy');
  });

  it('prevents IDOR: non-owner cannot commit questions into another user bank', async () => {
    await expect(
      importsService.commitQuestions(anotherUserId, {
        bankId: createdBankId,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            prompt: 'IDOR attempt',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 1,
            options: [
              { text: 'A', isCorrect: true, order: 0 },
              { text: 'B', isCorrect: false, order: 1 },
            ],
          },
        ],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects commit with NotFoundException for non-existent bank ID', async () => {
    await expect(
      importsService.commitQuestions(teacherId, {
        bankId: '00000000-0000-0000-0000-000000000000',
        questions: [
          {
            type: 'TRUE_FALSE',
            prompt: 'Test',
            difficulty: 'EASY',
            defaultPoints: 1.0,
            rawSourceLine: 1,
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
