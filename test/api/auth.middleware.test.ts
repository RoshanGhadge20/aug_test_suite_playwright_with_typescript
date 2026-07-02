import { describe, it, expect, vi } from 'vitest';
import { createAuthMiddleware } from '../../src/api/middleware/auth.middleware';
import type { Request, Response, NextFunction } from 'express';

const mkReq = (headers: Record<string, string> = {}) => ({ headers } as unknown as Request);
const mkRes = () => {
  const res = { statusCode: 200, body: undefined as unknown } as unknown as Response & { body: unknown };
  (res as any).status = (c: number) => { (res as any).statusCode = c; return res; };
  (res as any).json = (b: unknown) => { (res as any).body = b; return res; };
  return res as Response & { body: unknown };
};

describe('authMiddleware', () => {
  it('passes through with correct key', () => {
    const mw = createAuthMiddleware('secret');
    const next = vi.fn();
    mw(mkReq({ 'x-api-key': 'secret' }), mkRes(), next as NextFunction);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing key', () => {
    const mw = createAuthMiddleware('secret');
    const res = mkRes();
    const next = vi.fn();
    mw(mkReq(), res, next as NextFunction);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects wrong key', () => {
    const mw = createAuthMiddleware('secret');
    const res = mkRes();
    const next = vi.fn();
    mw(mkReq({ 'x-api-key': 'other' }), res, next as NextFunction);
    expect(res.statusCode).toBe(401);
  });
});
