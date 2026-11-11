import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsController } from './attempts.controller';
import { SessionsJoinController } from './sessions-join.controller';
import { AttemptsService } from './attempts.service';

describe('AttemptsController & SessionsJoinController', () => {
  let attemptsController: AttemptsController;
  let sessionsJoinController: SessionsJoinController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      getJoinSessionPreview: jest.fn(),
      startOrResumeAttempt: jest.fn(),
      getAttemptDetail: jest.fn(),
      saveAnswers: jest.fn(),
      submitAttempt: jest.fn(),
      getUserAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptsController, SessionsJoinController],
      providers: [{ provide: AttemptsService, useValue: service }],
    }).compile();

    attemptsController = module.get<AttemptsController>(AttemptsController);
    sessionsJoinController = module.get<SessionsJoinController>(SessionsJoinController);
  });

  it('delegates getJoinSessionPreview to service', async () => {
    service.getJoinSessionPreview.mockResolvedValue({ joinCode: 'ABC123' });
    const res = await sessionsJoinController.getJoinSessionPreview('user-1', 'ABC123');
    expect(res.joinCode).toBe('ABC123');
    expect(service.getJoinSessionPreview).toHaveBeenCalledWith('user-1', 'ABC123');
  });

  it('delegates startOrResumeAttempt to service', async () => {
    service.startOrResumeAttempt.mockResolvedValue({ id: 'att-1' });
    const res = await sessionsJoinController.startOrResumeAttempt('user-1', 'ABC123');
    expect(res.id).toBe('att-1');
    expect(service.startOrResumeAttempt).toHaveBeenCalledWith('user-1', 'ABC123');
  });

  it('delegates getAttemptDetail to service', async () => {
    service.getAttemptDetail.mockResolvedValue({ id: 'att-1' });
    const res = await attemptsController.getAttemptDetail('user-1', 'att-1');
    expect(res.id).toBe('att-1');
    expect(service.getAttemptDetail).toHaveBeenCalledWith('user-1', 'att-1');
  });

  it('delegates saveAnswers to service', async () => {
    service.saveAnswers.mockResolvedValue({ success: true });
    const res = await attemptsController.saveAnswers('user-1', 'att-1', { answers: [] });
    expect(res.success).toBe(true);
    expect(service.saveAnswers).toHaveBeenCalledWith('user-1', 'att-1', { answers: [] });
  });

  it('delegates submitAttempt to service', async () => {
    service.submitAttempt.mockResolvedValue({ status: 'SUBMITTED' });
    const res = await attemptsController.submitAttempt('user-1', 'att-1');
    expect(res.status).toBe('SUBMITTED');
    expect(service.submitAttempt).toHaveBeenCalledWith('user-1', 'att-1');
  });

  it('delegates getUserAttempts to service', async () => {
    service.getUserAttempts.mockResolvedValue([{ id: 'att-1' }]);
    const res = await attemptsController.getUserAttempts('user-1');
    expect(res).toHaveLength(1);
    expect(service.getUserAttempts).toHaveBeenCalledWith('user-1');
  });
});
