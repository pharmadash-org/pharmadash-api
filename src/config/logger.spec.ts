import { logger } from './logger';

describe('logger', () => {
  it('is a pino logger instance with expected methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('has a valid log level', () => {
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
    expect(validLevels).toContain(logger.level);
  });
});
