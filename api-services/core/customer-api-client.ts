import { request as pwRequest, type APIRequestContext, type APIResponse } from '@playwright/test';
import { env } from '../../config/env';
import { apiUrl, panelCreds } from '../../config/urls';
import { getTargetEnv, type EnvName } from '../../config/environments';
import { CUSTOMER_APP_HEADERS, CUSTOMER_ENDPOINTS } from '../customer/customer-endpoints';
import { extractToken } from './api-auth';
import { signatureOnlyHeaders, signedBackendHeaders } from './backend-api-signature';

export interface CustomerPinLogin {
  mobileNumber: string;
  pin: string;
}

/** Customer-panel login (mobile + 6-digit security PIN) from `<ENV>_CUSTOMER_USER_MOBILE/_PIN`. */
export function customerPinCreds(envName: EnvName = getTargetEnv()): CustomerPinLogin {
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  const pin = (env as unknown as Record<string, string | undefined>)[`${prefix}_CUSTOMER_USER_PIN`]?.trim();
  const { mobile } = panelCreds('customer', envName);
  if (!mobile || !pin) {
    throw new Error(`Set ${prefix}_CUSTOMER_USER_MOBILE and ${prefix}_CUSTOMER_USER_PIN in .env`);
  }
  return { mobileNumber: mobile, pin };
}

export function pinLoginPayload(creds: CustomerPinLogin) {
  return { pin: creds.pin, verifyByPin: true, mobileNumber: creds.mobileNumber, deviceId: null };
}

/**
 * Gives a customer without a PIN (fresh registrations never reach the app's set-PIN screen) the PIN
 * in `creds`, the way the app does on first login: OTP login → add-pin. No-op when a PIN exists.
 * Needed because PIN login for a customer with no PIN hangs (504) instead of failing (UAT, 2026-10-27).
 * The OTP is the env's backdoor one; UAT allows one send-otp per mobile per minute. The pre-login
 * calls must be signed too — unsigned, send-otp answers 200 with an empty body and sends nothing.
 */
export async function ensureCustomerPin(
  creds: CustomerPinLogin,
  envName: EnvName = getTargetEnv(),
): Promise<void> {
  const ctx = await pwRequest.newContext({
    baseURL: apiUrl('api-backend', envName),
    extraHTTPHeaders: { ...CUSTOMER_APP_HEADERS, Accept: 'application/json' },
  });
  try {
    const { mobileNumber, pin } = creds;
    const post = (path: string, data: Record<string, unknown>) =>
      ctx.post(path, { data, headers: signatureOnlyHeaders('POST', path, data) });

    const check = await post(CUSTOMER_ENDPOINTS.checkDevicePin, { mobileNumber });
    if (!check.ok()) throw new Error(`check-device-pin failed: ${check.status()} ${await check.text()}`);
    if ((await check.json()).pinExists) return;

    const type = 'customerSignIn';
    const sent = await post(CUSTOMER_ENDPOINTS.sendLoginOtp, { captcha: '', value: '', mobileNumber, type });
    if (!sent.ok()) throw new Error(`customer-send-otp failed: ${sent.status()} ${await sent.text()}`);
    const { referenceCode } = await sent.json();

    const otp = panelCreds('customer', envName).otp;
    const verified = await post(CUSTOMER_ENDPOINTS.verifyLoginOtp, { otp, mobileNumber, referenceCode, isCustomer: true, type });
    if (!verified.ok()) throw new Error(`verify-customer-login failed: ${verified.status()} ${await verified.text()}`);
    const token = extractToken(await verified.json(), 'token');

    const body = { pin, renterPin: pin, template: '', isQuestionAsk: false };
    const added = await ctx.post(CUSTOMER_ENDPOINTS.addPin, {
      data: body,
      headers: signedBackendHeaders(token, 'POST', CUSTOMER_ENDPOINTS.addPin, body),
    });
    if (!added.ok()) throw new Error(`add-pin failed: ${added.status()} ${await added.text()}`);
  } finally {
    await ctx.dispose();
  }
}

/**
 * Customer-side gold-loan-backend API client — the same calls cp.<env>.augmont.com makes.
 * Plumbing only (login + signed get/post); endpoint calls live in `api-services/customer/`.
 *
 * Every authenticated call needs three headers (confirmed live on UAT, 2026-10-26):
 *  - `Authorization: Bearer <token>` from `validate-pin-biometric/v2`
 *  - `signature` — HMAC of `{...body, url: path}` (see backend-api-signature.ts), path incl. query
 *  - `iscustomerapp: true` — without it some endpoints answer 401 "You are not login customer"
 *
 * Gotchas: a call carrying the token but NO signature invalidates the session server-side (every
 * later call 401s), and a new login kills the previous token — so share one client per worker and
 * never send the real token unsigned. A wrong PIN burns one of 3 attempts before lockout.
 */
export class CustomerApiClient {
  private constructor(
    private readonly ctx: APIRequestContext,
    private readonly creds: CustomerPinLogin,
    private currentToken: string,
  ) {}

  get token(): string {
    return this.currentToken;
  }

  static async login(
    creds: CustomerPinLogin = customerPinCreds(),
    envName: EnvName = getTargetEnv(),
  ): Promise<CustomerApiClient> {
    const ctx = await pwRequest.newContext({
      baseURL: apiUrl('api-backend', envName),
      extraHTTPHeaders: { ...CUSTOMER_APP_HEADERS, Accept: 'application/json' },
    });
    try {
      return new CustomerApiClient(ctx, creds, await fetchToken(ctx, creds));
    } catch (err) {
      await ctx.dispose();
      throw err;
    }
  }

  /** Log in again — call after anything that started a new session for this customer. */
  async relogin(): Promise<void> {
    this.currentToken = await fetchToken(this.ctx, this.creds);
  }

  async get(path: string): Promise<APIResponse> {
    return this.ctx.get(path, { headers: signedBackendHeaders(this.currentToken, 'GET', path) });
  }

  async post(path: string, body: Record<string, unknown>): Promise<APIResponse> {
    return this.ctx.post(path, {
      data: body,
      headers: signedBackendHeaders(this.currentToken, 'POST', path, body),
    });
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}

async function fetchToken(ctx: APIRequestContext, creds: CustomerPinLogin): Promise<string> {
  const res = await ctx.post(CUSTOMER_ENDPOINTS.pinLogin, { data: pinLoginPayload(creds) });
  if (!res.ok()) throw new Error(`customer PIN login failed: ${res.status()} ${await res.text()}`);
  return extractToken(await res.json(), 'token');
}
