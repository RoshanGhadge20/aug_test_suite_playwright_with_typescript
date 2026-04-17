import type { APIRequestContext } from '@playwright/test';

export function extractToken(body: unknown, dottedPath: string): string {
  const parts = dottedPath.split('.');
  let cur: unknown = body;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      throw new Error(`token not found at path '${dottedPath}'`);
    }
  }
  if (typeof cur !== 'string' || cur.length === 0) {
    throw new Error(`token at path '${dottedPath}' is not a non-empty string`);
  }
  return cur;
}

export class TokenCache {
  private store = new Map<string, { token: string; expiresAt: number }>();

  async get(key: string, fetcher: () => Promise<string>, ttlMs: number): Promise<string> {
    const now = Date.now();
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > now) return hit.token;
    const token = await fetcher();
    this.store.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  clear(): void {
    this.store.clear();
  }
}

export const globalTokenCache = new TokenCache();

export interface FetchTokenArgs {
  request: APIRequestContext;
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export async function fetchBearerToken(args: FetchTokenArgs): Promise<string> {
  const res = await args.request.post(args.loginPath, {
    data: { email: args.email, password: args.password },
  });
  if (!res.ok()) {
    throw new Error(`login ${args.loginPath} failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return extractToken(body, args.tokenJsonPath);
}
