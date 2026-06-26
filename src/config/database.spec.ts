jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $on: jest.fn(),
  })),
}));

jest.mock('./logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

describe('database module', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports a prisma client instance', async () => {
    const { prisma } = await import('./database');
    expect(prisma).toBeDefined();
    expect(typeof prisma.$on).toBe('function');
  });
});
