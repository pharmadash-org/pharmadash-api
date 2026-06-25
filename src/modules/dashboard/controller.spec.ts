import { Request, Response } from 'express';
import { DashboardController } from './controller';
import { DashboardService } from './service';

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('DashboardController', () => {
  let service: jest.Mocked<DashboardService>;
  let controller: DashboardController;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      getKpis: jest.fn(),
      getTopSold: jest.fn(),
    } as unknown as jest.Mocked<DashboardService>;
    controller = new DashboardController(service);
    next = jest.fn();
  });

  it('getKpis responds 200', async () => {
    service.getKpis.mockResolvedValue({ dailyRevenue: 0, criticalStockCount: 0, nearExpiryCount: 0 });
    const res = mockRes();
    await controller.getKpis({} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getTopSold responds 200', async () => {
    service.getTopSold.mockResolvedValue([]);
    const res = mockRes();
    await controller.getTopSold({} as Request, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    service.getKpis.mockRejectedValue(err);
    const res = mockRes();
    await controller.getKpis({} as Request, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
