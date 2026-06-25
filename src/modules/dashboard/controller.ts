import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { sendSuccess } from '../../shared/utils/response';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getKpis = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const kpis = await this.service.getKpis();
      sendSuccess(res, kpis);
    } catch (err) {
      next(err);
    }
  };

  getTopSold = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topSold = await this.service.getTopSold();
      sendSuccess(res, topSold);
    } catch (err) {
      next(err);
    }
  };
}
