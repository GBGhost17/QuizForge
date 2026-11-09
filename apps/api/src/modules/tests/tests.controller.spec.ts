import { Test, TestingModule } from '@nestjs/testing';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import type { Test as TestModel } from '@quizforge/shared-types';

describe('TestsController', () => {
  let controller: TestsController;

  const mockTest: TestModel = {
    id: 'test-1',
    authorId: 'user-1',
    title: 'Kiểm tra 15 phút',
    mode: 'ASSIGNMENT',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTestsService = {
    create: jest.fn().mockResolvedValue(mockTest),
    findAll: jest.fn().mockResolvedValue({
      data: [mockTest],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(mockTest),
    update: jest.fn().mockResolvedValue({ ...mockTest, title: 'Đã đổi tên' }),
    remove: jest.fn().mockResolvedValue({ success: true, message: 'Xóa đề thi thành công' }),
    addQuestion: jest.fn().mockResolvedValue({ id: 'snap-1', points: 1 }),
    addQuestionsBatch: jest.fn().mockResolvedValue({ addedCount: 2, test: mockTest }),
    removeQuestion: jest.fn().mockResolvedValue(mockTest),
    reorderQuestions: jest.fn().mockResolvedValue(mockTest),
    publish: jest.fn().mockResolvedValue({ ...mockTest, status: 'PUBLISHED' }),
    close: jest.fn().mockResolvedValue({ ...mockTest, status: 'CLOSED' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestsController],
      providers: [{ provide: TestsService, useValue: mockTestsService }],
    }).compile();

    controller = module.get<TestsController>(TestsController);
  });

  it('creates test', async () => {
    const result = await controller.create('user-1', { title: 'Kiểm tra 15 phút' });
    expect(mockTestsService.create).toHaveBeenCalledWith('user-1', { title: 'Kiểm tra 15 phút' });
    expect(result.id).toBe('test-1');
  });

  it('finds all tests', async () => {
    const result = await controller.findAll('user-1', { page: 1, limit: 10 });
    expect(mockTestsService.findAll).toHaveBeenCalledWith('user-1', { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
  });

  it('finds one test', async () => {
    const result = await controller.findOne('user-1', 'test-1');
    expect(mockTestsService.findOne).toHaveBeenCalledWith('user-1', 'test-1');
    expect(result.id).toBe('test-1');
  });

  it('publishes test', async () => {
    const result = await controller.publish('user-1', 'test-1', {});
    expect(mockTestsService.publish).toHaveBeenCalledWith('user-1', 'test-1', {});
    expect(result.status).toBe('PUBLISHED');
  });

  it('closes test', async () => {
    const result = await controller.close('user-1', 'test-1');
    expect(mockTestsService.close).toHaveBeenCalledWith('user-1', 'test-1');
    expect(result.status).toBe('CLOSED');
  });
});
