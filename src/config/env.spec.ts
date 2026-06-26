// env.ts runs at import time; the module is already loaded via setup-env.ts
// so we just verify the exported object has the expected shape.
import { env } from './env';

describe('env config', () => {
  it('exports PORT as string', () => {
    expect(typeof env.PORT).toBe('string');
  });

  it('exports NODE_ENV', () => {
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
  });

  it('exports DATABASE_URL', () => {
    expect(env.DATABASE_URL).toBeTruthy();
  });

  it('exports AZURE_TENANT_ID and AZURE_CLIENT_ID', () => {
    expect(env.AZURE_TENANT_ID).toBeTruthy();
    expect(env.AZURE_CLIENT_ID).toBeTruthy();
  });

  it('exports AZURE_AUDIENCE', () => {
    expect(env.AZURE_AUDIENCE).toBeTruthy();
  });

  it('exports LOG_LEVEL', () => {
    expect(env.LOG_LEVEL).toBeTruthy();
  });

  it('exports CORS_ORIGIN with a default', () => {
    expect(typeof env.CORS_ORIGIN).toBe('string');
    expect(env.CORS_ORIGIN.length).toBeGreaterThan(0);
  });
});
