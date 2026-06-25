import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  req.correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
