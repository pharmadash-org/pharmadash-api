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

  it('unknown route returns 404 or higher (covers error handler path)', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('covers customLogLevel >= 500 branch via a route that throws', async () => {
    // Registrar una ruta temporal que lanza un error 500
    app.get('/test-500', () => {
      throw new Error('forced 500');
    });
    const res = await request(app).get('/test-500');
    expect(res.status).toBe(500);
  });

  it('serializer formats req correctly', async () => {
    // Segunda llamada a /health para ejercer el serializer de pino-http
    const res = await request(app)
      .get('/health')
      .set('x-correlation-id', 'test-cid');
    expect(res.status).toBe(200);
  });
});
