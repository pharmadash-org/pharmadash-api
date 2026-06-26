jest.mock('../../middlewares/auth', () => ({
  authGuard: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireRoles:
    (..._roles: string[]) =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock('../../config/database', () => ({
  prisma: { medication: {}, $transaction: jest.fn() },
}));

import router from './routes';

describe('medications routes', () => {
  it('exports a router', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('function');
  });
});
