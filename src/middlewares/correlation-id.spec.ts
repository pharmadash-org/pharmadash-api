import { Request, Response } from 'express';
import { correlationId } from './correlation-id';

function mockRes(): Response {
  const res = {} as Response;
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

describe('correlationId middleware', () => {
  it('reuses an incoming x-correlation-id header', () => {
    const req = { headers: { 'x-correlation-id': 'existing-id' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toBe('existing-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', 'existing-id');
    expect(next).toHaveBeenCalled();
  });

  it('generates a uuid when no header is present', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(next).toHaveBeenCalled();
  });
});
