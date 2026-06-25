import { Request, Response } from 'express';
import { errorHandler } from './error-handler';
import { ConflictException, AppException } from '../shared/exceptions';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const req = { correlationId: 'cid' } as Request;

describe('errorHandler', () => {
  it('maps an AppException to its status and code', () => {
    const res = mockRes();
    errorHandler(new ConflictException('dup'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CONFLICT', message: 'dup' },
    });
  });

  it('logs and still maps a 5xx AppException', () => {
    const res = mockRes();
    errorHandler(new AppException(503, 'DOWN', 'unavailable'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('maps unknown errors to a generic 500', () => {
    const res = mockRes();
    errorHandler(new Error('kaboom'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });
});
