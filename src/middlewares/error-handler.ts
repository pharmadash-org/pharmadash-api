import { Request, Response, NextFunction } from 'express';
import { AppException } from '../shared/exceptions';
import { sendError } from '../shared/utils/response';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppException) {
    if (err.statusCode >= 500) {
      logger.error(
        { err, correlationId: req.correlationId, userId: req.authenticatedUser?.oid },
        err.message,
      );
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  logger.error(
    { err, correlationId: req.correlationId, userId: req.authenticatedUser?.oid },
    'Unhandled error',
  );
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
