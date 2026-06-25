import { Request, Response, NextFunction } from 'express';
import { MedicationService } from './service';
import { sendSuccess } from '../../shared/utils/response';
import { ListMedicationsQuery } from './schema';

export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListMedicationsQuery;
      const result = await this.service.list(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.service.search(req.query.q as string);
      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const med = await this.service.getById(req.params.id);
      sendSuccess(res, med);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const med = await this.service.create(req.body);
      sendSuccess(res, med, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const med = await this.service.update(req.params.id, req.body);
      sendSuccess(res, med);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      sendSuccess(res, null, 204);
    } catch (err) {
      next(err);
    }
  };
}
