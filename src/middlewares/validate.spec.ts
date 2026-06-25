import { Request, Response } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery } from './validate';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const schema = z.object({ name: z.string().min(3) });

describe('validateBody', () => {
  it('calls next and replaces body with parsed data on success', () => {
    const req = { body: { name: 'Paracetamol', extra: 'stripped' } } as Request;
    const res = mockRes();
    const next = jest.fn();
    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Paracetamol' });
  });

  it('responds 400 with details on failure', () => {
    const req = { body: { name: 'ab' } } as Request;
    const res = mockRes();
    const next = jest.fn();
    validateBody(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateQuery', () => {
  const querySchema = z.object({ page: z.coerce.number().int().positive() });

  it('calls next on valid query', () => {
    const req = { query: { page: '2' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();
    validateQuery(querySchema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ page: 2 });
  });

  it('responds 400 on invalid query', () => {
    const req = { query: { page: '0' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();
    validateQuery(querySchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
