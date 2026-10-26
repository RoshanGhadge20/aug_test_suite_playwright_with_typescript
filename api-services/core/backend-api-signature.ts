import { createHmac } from 'crypto';
import { env } from '../../config/env';
import { getTargetEnv } from '../../config/environments';

function backendHmacKey(): string | undefined {
  const prefix = getTargetEnv() === 'uat' ? 'UAT' : 'TEST';
  const key = (env as unknown as Record<string, string>)[`${prefix}_BACKEND_HMAC_KEY`]?.trim();
  return key || undefined;
}

/** Postman pre-request: HmacSHA256(JSON.stringify({ ...body, url }), HMAC_SECRET) */
export function computeBackendApiSignature(
  method: string,
  path: string,
  body: Record<string, unknown> | undefined,
  secret: string,
): string {
  let url = path.replace(/%20/g, ' ').replace(/\/\/+/g, '/');
  const valuebody =
    ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body ? { ...body } : {};
  return createHmac('sha256', secret)
    .update(JSON.stringify({ ...valuebody, url }))
    .digest('hex');
}

/** Bearer + signature headers for one backend API call. */
export function signedBackendHeaders(
  token: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Record<string, string> {
  const secret = backendHmacKey();
  if (!secret) throw new Error('Set UAT_BACKEND_HMAC_KEY in .env (Postman HMAC_SECRET)');
  const signature = computeBackendApiSignature(method, path, body, secret);
  return {
    Authorization: `Bearer ${token}`,
    signature,
    'Content-Type': 'application/json',
  };
}
