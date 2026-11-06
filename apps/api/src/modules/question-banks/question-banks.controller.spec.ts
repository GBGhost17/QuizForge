import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBanksController } from './question-banks.controller';
import { QuestionBanksService } from './question-banks.service';
import type { QuestionBank } from '@quizforge/shared-types';

describe('QuestionBanksController', () => {
  let controller: QuestionBanksController;

  const mockBank: QuestionBank = {
    id: 'bank-1',
    ownerId: 'user-1',
    title: 'Toán học 12',
    description: 'Đề ôn tập',
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 10 },
  };

  const mockService = {
    create: jest.fn().mockResolvedValue(mockBank),
    findAll: jest.fn().mockResolvedValue({
      data: [mockBank],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(mockBank),
    update: jest.fn().mockResolvedValue({ ...mockBank, title: 'Updated' }),
    delete: jest.fn().mockResolvedValue({ message: 'Success', isArchived: false }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionBanksController],
      providers: [{ provide: QuestionBanksService, useValue: mockService }],
    }).compile();

    controller = module.get<QuestionBanksController>(QuestionBanksController);
  });

  it('delegates create to QuestionBanksService', async () => {
    const dto = { title: 'Toán học 12', description: 'Đề ôn tập' };
    const result = await controller.create('user-1', dto);
    expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toBe(mockBank);
  });

  it('delegates findAll to QuestionBanksService', async () => {
    const query = { page: 1, limit: 10 };
    const result = await controller.findAll('user-1', query);
    expect(mockService.findAll).toHaveBeenCalledWith('user-1', query);
    expect(result.data).toHaveLength(1);
  });

  it('delegates findOne to QuestionBanksService', async () => {
    const result = await controller.findOne('user-1', 'bank-1');
    expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'bank-1');
    expect(result).toBe(mockBank);
  });

  it('delegates update to QuestionBanksService', async () => {
    const dto = { title: 'Updated' };
    const result = await controller.update('user-1', 'bank-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('user-1', 'bank-1', dto);
    expect(result.title).toBe('Updated');
  });

  it('delegates delete to QuestionBanksService', async () => {
    const result = await controller.delete('user-1', 'bank-1');
    expect(mockService.delete).toHaveBeenCalledWith('user-1', 'bank-1');
    expect(result.message).toBe('Success');
  });
});
