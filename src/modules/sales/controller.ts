import { Request, Response, NextFunction } from 'express';
import { SaleService } from './service';
import { sendSuccess } from '../../shared/utils/response';

export class SaleController {
  constructor(private readonly service: SaleService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.authenticatedUser!.oid;
      const sale = await this.service.create(userId, req.body);
      sendSuccess(res, sale, 201);
    } catch (err) {
      next(err);
    }
  };
}
