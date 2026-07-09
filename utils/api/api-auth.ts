import { type APIRequestContext, request as pwRequest } from '@playwright/test';
import { apiAuthConfig, apiUrl } from '../../config/urls';
import { getTargetEnv, type EnvName } from '../../config/environments';
import type { ApiService } from '../../config/constants';

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
  sendOtpPath: string;
  verifyOtpPath: string;
  mobile: string;
  otp: string;
  tokenJsonPath: string;
}

export async function fetchBearerToken(args: FetchTokenArgs): Promise<string> {
  const sendRes = await args.request.post(args.sendOtpPath, { data: { mobile: args.mobile } });
  if (!sendRes.ok()) {
    throw new Error(`send-otp ${args.sendOtpPath} failed: ${sendRes.status()} ${await sendRes.text()}`);
  }
  const verifyRes = await args.request.post(args.verifyOtpPath, {
    data: { mobile: args.mobile, otp: args.otp },
  });
  if (!verifyRes.ok()) {
    throw new Error(`verify-otp ${args.verifyOtpPath} failed: ${verifyRes.status()} ${await verifyRes.text()}`);
  }
  const body = await verifyRes.json();
  return extractToken(body, args.tokenJsonPath);
}

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Authenticated `APIRequestContext` for `service` — fetches (and caches, 5min/worker) a bearer
 * token via OTP login, then returns a context with it pre-set. Extracted out of
 * `fixtures/api.fixture.ts`'s `authedRequest` so it's usable outside the `apiTest` fixture, which
 * is hard-restricted to the `api-backend`/`api-emi` Playwright projects (no browser). Callers must
 * `dispose()` the returned context.
 */
export async function createAuthedApiContext(
  service: ApiService,
  envName: EnvName = getTargetEnv(),
): Promise<APIRequestContext> {
  const baseURL = apiUrl(service, envName);
  const auth = apiAuthConfig(service, envName);
  const loginCtx = await pwRequest.newContext({ baseURL });
  const token = await globalTokenCache.get(
    `${envName}:${service}:${auth.mobile}`,
    () => fetchBearerToken({
      request: loginCtx,
      sendOtpPath: auth.sendOtpPath,
      verifyOtpPath: auth.verifyOtpPath,
      mobile: auth.mobile,
      otp: auth.otp,
      tokenJsonPath: auth.tokenJsonPath,
    }),
    FIVE_MINUTES,
  );
  await loginCtx.dispose();

  return pwRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}
