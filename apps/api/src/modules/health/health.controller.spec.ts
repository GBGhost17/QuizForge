import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness with an ISO timestamp', () => {
    const body = new HealthController().liveness();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('quizforge-api');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
