import { Request, Response, NextFunction, RequestHandler } from 'express';

export function createAuthMiddleware(expectedKey: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const provided = req.headers['x-api-key'];
    if (typeof provided !== 'string' || provided !== expectedKey) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };
}
