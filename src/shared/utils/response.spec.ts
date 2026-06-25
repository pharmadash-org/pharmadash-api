import { Response } from 'express';
import { sendSuccess, sendError } from './response';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('response helpers', () => {
  it('sendSuccess uses 200 by default', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('sendSuccess accepts custom status code', () => {
    const res = mockRes();
    sendSuccess(res, null, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('sendError builds uniform error body', () => {
    const res = mockRes();
    sendError(res, 409, 'CONFLICT', 'SKU exists');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CONFLICT', message: 'SKU exists' },
    });
  });

  it('sendError includes details only when provided', () => {
    const res = mockRes();
    sendError(res, 400, 'VALIDATION_ERROR', 'bad', [{ field: 'name' }]);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'bad', details: [{ field: 'name' }] },
    });
  });
});
