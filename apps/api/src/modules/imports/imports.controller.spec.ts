import { Test, TestingModule } from '@nestjs/testing';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import type { CommitMarkdownDto } from './dto';
import type { UserProfile } from '@quizforge/shared-types';

describe('ImportsController', () => {
  let controller: ImportsController;
  let service: {
    parseMarkdown: jest.Mock;
    commitQuestions: jest.Mock;
  };

  const mockUser: UserProfile = {
    id: 'user-1',
    email: 'teacher@quizforge.com',
    role: 'USER',
    name: 'Teacher',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      parseMarkdown: jest.fn(),
      commitQuestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportsController],
      providers: [{ provide: ImportsService, useValue: service }],
    }).compile();

    controller = module.get<ImportsController>(ImportsController);
  });

  it('delegates parseMarkdown to ImportsService', async () => {
    service.parseMarkdown.mockResolvedValue({
      questions: [],
      diagnostics: [],
      hasErrors: false,
    });

    const result = await controller.parseMarkdown({ content: '# Test' });
    expect(service.parseMarkdown).toHaveBeenCalledWith({ content: '# Test' });
    expect(result.hasErrors).toBe(false);
  });

  it('delegates commitQuestions to ImportsService with user.id', async () => {
    service.commitQuestions.mockResolvedValue({
      count: 5,
      bankId: 'bank-1',
      message: 'Success',
    });

    const dto: CommitMarkdownDto = { bankId: 'bank-1', questions: [] };
    const result = await controller.commitQuestions(mockUser, dto);
    expect(service.commitQuestions).toHaveBeenCalledWith('user-1', dto);
    expect(result.count).toBe(5);
  });
});
