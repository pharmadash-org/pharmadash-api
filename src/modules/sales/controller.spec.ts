import { Request, Response } from 'express';
import { SaleController } from './controller';
import { SaleService } from './service';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('SaleController', () => {
  let service: jest.Mocked<SaleService>;
  let controller: SaleController;
  let next: jest.Mock;

  beforeEach(() => {
    service = { create: jest.fn() } as unknown as jest.Mocked<SaleService>;
    controller = new SaleController(service);
    next = jest.fn();
  });

  it('uses the authenticated user oid and responds 201', async () => {
    service.create.mockResolvedValue({ id: 'sale-1' } as never);
    const res = mockRes();
    const req = {
      authenticatedUser: { oid: 'oid-1' },
      body: { items: [] },
    } as unknown as Request;

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith('oid-1', { items: [] });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    service.create.mockRejectedValue(err);
    const res = mockRes();
    const req = { authenticatedUser: { oid: 'oid-1' }, body: {} } as unknown as Request;
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
