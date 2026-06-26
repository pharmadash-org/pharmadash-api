jest.mock('./middlewares/auth', () => ({
  authGuard: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRoles:
    (..._roles: string[]) =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock('./config/database', () => ({
  prisma: {
    medication: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    sale: {},
    saleItem: {},
    $transaction: jest.fn(),
  },
}));

import request from 'supertest';
import { app } from './app';

describe('app', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/medications returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/medications')
      .query({ page: '1', limit: '10' });
    expect(res.status).toBe(200);
  });

  it('unknown route returns 404 or passes to error handler', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
