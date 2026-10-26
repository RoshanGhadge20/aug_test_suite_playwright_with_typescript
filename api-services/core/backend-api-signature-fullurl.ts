import { createHmac } from 'crypto';
import { env } from '../../config/env';
import { getTargetEnv } from '../../config/environments';

function backendHmacKey(): string | undefined {
  const prefix = getTargetEnv() === 'uat' ? 'UAT' : 'TEST';
  const key = (env as unknown as Record<string, string>)[`${prefix}_BACKEND_HMAC_KEY`]?.trim();
  return key || undefined;
}

export function computeBackendApiSignatureFullUrl(
  method: string,
  baseUrl: string,
  path: string,
  body: Record<string, unknown> | undefined,
  secret: string,
): string {
  const url = `${baseUrl}${path}`.replace(/%20/g, ' ');

  const valuebody =
    ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body
      ? { ...body }
      : {};

  return createHmac('sha256', secret)
    .update(JSON.stringify({ ...valuebody, url }))
    .digest('hex');
}

export function signedBackendHeadersFullUrl(
  token: string,
  method: string,
  baseUrl: string,
  path: string,
  body?: Record<string, unknown>,
): Record<string, string> {
  const secret = backendHmacKey();

  if (!secret) {
    throw new Error('Set UAT_BACKEND_HMAC_KEY in .env');
  }

  const signature = computeBackendApiSignatureFullUrl(
    method,
    baseUrl,
    path,
    body,
    secret,
  );

  return {
    Authorization: `Bearer ${token}`,
    signature,
    'Content-Type': 'application/json',
  };
}