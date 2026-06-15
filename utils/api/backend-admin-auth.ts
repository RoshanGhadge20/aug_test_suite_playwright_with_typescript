import { request as pwRequest, type APIRequestContext } from '@playwright/test';
import { apiCreds, apiUrl } from '../../config/urls';
import { getTargetEnv } from '../../config/environments';
import { extractToken, globalTokenCache } from './api-auth';

const FIVE_MINUTES = 5 * 60 * 1000;

export async function fetchBackendAdminToken(
  request: APIRequestContext,
  mobileNumber: string,
  otp: string | number,
): Promise<string> {
  const sendRes = await request.post('/api/user-otp/user-send-otp', {
    data: { mobileNumber, type: 'login', id: null },
  });
  if (!sendRes.ok()) {
    throw new Error(`send-otp failed: ${sendRes.status()} ${await sendRes.text()}`);
  }

  const sendBody = (await sendRes.json()) as { referenceCode?: string };
  if (!sendBody.referenceCode) {
    throw new Error('send-otp response missing referenceCode');
  }

  const verifyRes = await request.post('/api/auth/verify-login', {
    data: {
      referenceCode: sendBody.referenceCode,
      otp: typeof otp === 'string' ? Number(otp) : otp,
      type: 'login',
      isFromWeb: true,
    },
  });
  if (!verifyRes.ok()) {
    throw new Error(`verify-login failed: ${verifyRes.status()} ${await verifyRes.text()}`);
  }

  return extractToken(await verifyRes.json(), 'Token');
}

/** Cached admin JWT for gold-loan-backend-api (customer shop setup). */
export async function getBackendAdminToken(): Promise<string> {
  const envName = getTargetEnv();
  const creds = apiCreds('api-backend', envName);
  const loginCtx = await pwRequest.newContext({ baseURL: apiUrl('api-backend', envName) });
  try {
    return await globalTokenCache.get(
      `${envName}:api-backend-admin:${creds.mobile}`,
      () => fetchBackendAdminToken(loginCtx, creds.mobile, creds.otp),
      FIVE_MINUTES,
    );
  } finally {
    await loginCtx.dispose();
  }
}
