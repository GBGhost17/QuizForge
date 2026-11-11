import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import type { Question } from '@quizforge/shared-types';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  const mockQuestion: Question = {
    id: 'q-1',
    bankId: 'bank-1',
    type: 'SINGLE_CHOICE',
    prompt: '2 + 2 = ?',
    explanation: '4',
    topic: 'Math',
    tags: ['math'],
    difficulty: 'EASY',
    defaultPoints: 1.0,
    rubric: null,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: [
      {
        id: 'opt-1',
        questionId: 'q-1',
        text: '4',
        isCorrect: true,
        explanation: 'Correct',
        order: 0,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockQuestion),
    findAll: jest.fn().mockResolvedValue({
      data: [mockQuestion],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(mockQuestion),
    update: jest.fn().mockResolvedValue({ ...mockQuestion, prompt: 'Updated?' }),
    delete: jest.fn().mockResolvedValue({ message: 'Success', isArchived: false }),
    checkDuplicates: jest.fn().mockResolvedValue({
      hasDuplicates: true,
      totalChecked: 1,
      duplicateCount: 1,
      duplicates: [],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [{ provide: QuestionsService, useValue: mockService }],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('delegates create to QuestionsService', async () => {
    const dto = {
      prompt: '2 + 2 = ?',
      type: 'SINGLE_CHOICE' as const,
      options: [{ text: '4', isCorrect: true }],
    };
    const result = await controller.create('user-1', 'bank-1', dto);
    expect(mockService.create).toHaveBeenCalledWith('user-1', 'bank-1', dto);
    expect(result).toBe(mockQuestion);
  });

  it('delegates findAll to QuestionsService', async () => {
    const query = { page: 1, limit: 20 };
    const result = await controller.findAll('user-1', 'bank-1', query);
    expect(mockService.findAll).toHaveBeenCalledWith('user-1', 'bank-1', query);
    expect(result.data).toHaveLength(1);
  });

  it('delegates findOne to QuestionsService', async () => {
    const result = await controller.findOne('user-1', 'q-1');
    expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'q-1');
    expect(result).toBe(mockQuestion);
  });

  it('delegates update to QuestionsService', async () => {
    const dto = { prompt: 'Updated?' };
    const result = await controller.update('user-1', 'q-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('user-1', 'q-1', dto);
    expect(result.prompt).toBe('Updated?');
  });

  it('delegates delete to QuestionsService', async () => {
    const result = await controller.delete('user-1', 'q-1');
    expect(mockService.delete).toHaveBeenCalledWith('user-1', 'q-1');
    expect(result.message).toBe('Success');
  });

  it('delegates checkDuplicates to QuestionsService', async () => {
    const dto = {
      questions: [{ prompt: '2 + 2 = ?' }],
    };
    const result = await controller.checkDuplicates('user-1', 'bank-1', dto);
    expect(mockService.checkDuplicates).toHaveBeenCalledWith('user-1', 'bank-1', dto);
    expect(result.hasDuplicates).toBe(true);
  });
});
