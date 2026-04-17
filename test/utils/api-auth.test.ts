import { describe, it, expect } from 'vitest';
import { extractToken, TokenCache } from '../../utils/api/api-auth';

describe('extractToken', () => {
  it('reads top-level field', () => {
    expect(extractToken({ token: 'abc' }, 'token')).toBe('abc');
  });

  it('reads dotted path', () => {
    expect(extractToken({ data: { token: 'abc' } }, 'data.token')).toBe('abc');
  });

  it('throws on missing path', () => {
    expect(() => extractToken({ data: {} }, 'data.token')).toThrow(/token not found/i);
  });

  it('throws on non-string value', () => {
    expect(() => extractToken({ data: { token: 123 } }, 'data.token')).toThrow();
  });
});

describe('TokenCache', () => {
  it('returns cached token if still valid', async () => {
    const cache = new TokenCache();
    let calls = 0;
    const fetcher = async () => { calls++; return 'tkn'; };
    expect(await cache.get('k', fetcher, 60_000)).toBe('tkn');
    expect(await cache.get('k', fetcher, 60_000)).toBe('tkn');
    expect(calls).toBe(1);
  });

  it('refetches after ttl expiry', async () => {
    const cache = new TokenCache();
    let calls = 0;
    const fetcher = async () => { calls++; return `tkn-${calls}`; };
    expect(await cache.get('k', fetcher, 1)).toBe('tkn-1');
    await new Promise((r) => setTimeout(r, 10));
    expect(await cache.get('k', fetcher, 1)).toBe('tkn-2');
  });
});
