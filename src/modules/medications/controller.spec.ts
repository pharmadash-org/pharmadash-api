import { Request, Response } from 'express';
import { MedicationController } from './controller';
import { MedicationService } from './service';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('MedicationController', () => {
  let service: jest.Mocked<MedicationService>;
  let controller: MedicationController;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      list: jest.fn(),
      search: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MedicationService>;
    controller = new MedicationController(service);
    next = jest.fn();
  });

  it('list responds 200 with data', async () => {
    service.list.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    const res = mockRes();
    await controller.list({ query: { page: 1, limit: 10 } } as unknown as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('search responds with results', async () => {
    service.search.mockResolvedValue([]);
    const res = mockRes();
    await controller.search({ query: { q: 'a' } } as unknown as Request, res, next);
    expect(service.search).toHaveBeenCalledWith('a');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getById responds with the medication', async () => {
    service.getById.mockResolvedValue({ id: 'x' } as never);
    const res = mockRes();
    await controller.getById({ params: { id: 'x' } } as unknown as Request, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'x' } });
  });

  it('create responds 201', async () => {
    service.create.mockResolvedValue({ id: 'x' } as never);
    const res = mockRes();
    await controller.create({ body: {} } as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('update responds 200', async () => {
    service.update.mockResolvedValue({ id: 'x' } as never);
    const res = mockRes();
    await controller.update({ params: { id: 'x' }, body: {} } as unknown as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('delete responds 204', async () => {
    service.delete.mockResolvedValue(undefined);
    const res = mockRes();
    await controller.delete({ params: { id: 'x' } } as unknown as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    service.getById.mockRejectedValue(err);
    const res = mockRes();
    await controller.getById({ params: { id: 'x' } } as unknown as Request, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
