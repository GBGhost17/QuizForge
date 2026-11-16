import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsController } from './attempts.controller';
import { SessionsJoinController } from './sessions-join.controller';
import { AttemptsService } from './attempts.service';

describe('AttemptsController & SessionsJoinController', () => {
  let attemptsController: AttemptsController;
  let sessionsJoinController: SessionsJoinController;

  const mockService = {
    getJoinSessionPreview: jest.fn(),
    startOrResumeAttempt: jest.fn(),
    getAttemptDetail: jest.fn(),
    saveAnswers: jest.fn(),
    submitAttempt: jest.fn(),
    getUserAttempts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptsController, SessionsJoinController],
      providers: [{ provide: AttemptsService, useValue: mockService }],
    }).compile();

    attemptsController = module.get<AttemptsController>(AttemptsController);
    sessionsJoinController = module.get<SessionsJoinController>(SessionsJoinController);
  });

  it('delegates getJoinSessionPreview to service', async () => {
    mockService.getJoinSessionPreview.mockResolvedValue({
      joinCode: 'ABC123',
    } as unknown as Awaited<ReturnType<AttemptsService['getJoinSessionPreview']>>);
    const res = await sessionsJoinController.getJoinSessionPreview('user-1', 'ABC123');
    expect(res.joinCode).toBe('ABC123');
    expect(mockService.getJoinSessionPreview).toHaveBeenCalledWith('user-1', 'ABC123');
  });

  it('delegates startOrResumeAttempt to service', async () => {
    mockService.startOrResumeAttempt.mockResolvedValue({ id: 'att-1' } as unknown as Awaited<
      ReturnType<AttemptsService['startOrResumeAttempt']>
    >);
    const res = await sessionsJoinController.startOrResumeAttempt('user-1', 'ABC123');
    expect(res.id).toBe('att-1');
    expect(mockService.startOrResumeAttempt).toHaveBeenCalledWith('user-1', 'ABC123');
  });

  it('delegates getAttemptDetail to service', async () => {
    mockService.getAttemptDetail.mockResolvedValue({ id: 'att-1' } as unknown as Awaited<
      ReturnType<AttemptsService['getAttemptDetail']>
    >);
    const res = await attemptsController.getAttemptDetail('user-1', 'att-1');
    expect(res.id).toBe('att-1');
    expect(mockService.getAttemptDetail).toHaveBeenCalledWith('user-1', 'att-1');
  });

  it('delegates saveAnswers to service', async () => {
    mockService.saveAnswers.mockResolvedValue({ success: true } as unknown as Awaited<
      ReturnType<AttemptsService['saveAnswers']>
    >);
    const res = await attemptsController.saveAnswers('user-1', 'att-1', { answers: [] });
    expect(res.success).toBe(true);
    expect(mockService.saveAnswers).toHaveBeenCalledWith('user-1', 'att-1', { answers: [] });
  });

  it('delegates submitAttempt to service', async () => {
    mockService.submitAttempt.mockResolvedValue({ status: 'SUBMITTED' } as unknown as Awaited<
      ReturnType<AttemptsService['submitAttempt']>
    >);
    const res = await attemptsController.submitAttempt('user-1', 'att-1');
    expect(res.status).toBe('SUBMITTED');
    expect(mockService.submitAttempt).toHaveBeenCalledWith('user-1', 'att-1');
  });

  it('delegates getUserAttempts to service', async () => {
    mockService.getUserAttempts.mockResolvedValue([{ id: 'att-1' }] as unknown as Awaited<
      ReturnType<AttemptsService['getUserAttempts']>
    >);
    const res = await attemptsController.getUserAttempts('user-1');
    expect(res).toHaveLength(1);
    expect(mockService.getUserAttempts).toHaveBeenCalledWith('user-1');
  });
});
