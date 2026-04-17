import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../../utils/logger/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'validation_failed', issues: err.issues });
    return;
  }
  logger.error('unhandled error', { path: req.path, message: (err as Error).message });
  res.status(500).json({ error: 'internal_server_error' });
};
