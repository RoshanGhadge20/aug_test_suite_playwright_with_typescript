import { env } from './env';
import type { Panel, ApiService } from './constants';
import type { EnvName } from './environments';
import { getTargetEnv } from './environments';
import { roleMobileKey, type AdminRole } from './roles';

export interface Credential { mobile: string; otp: string; }

interface EnvBundle {
  panels: Record<Panel, string>;
  panelCreds: Record<Panel, Credential>;
  apis: Record<ApiService, string>;
  apiCreds: Record<ApiService, Credential>;
}

function buildBundle(prefix: 'TEST' | 'UAT'): EnvBundle {
  const e = env as unknown as Record<string, string>;
  return {
    panels: {
      admin: e[`${prefix}_BASE_URL_ADMIN`],
      customer: e[`${prefix}_BASE_URL_CUSTOMER`],
      business: e[`${prefix}_BASE_URL_BUSINESS`],
      'new-admin': e[`${prefix}_BASE_URL_NEW_ADMIN`],
    },
    panelCreds: {
      admin: { mobile: e[`${prefix}_ADMIN_USER_MOBILE`], otp: e[`${prefix}_ADMIN_USER_OTP`] },
      customer: { mobile: e[`${prefix}_CUSTOMER_USER_MOBILE`], otp: e[`${prefix}_CUSTOMER_USER_OTP`] },
      business: { mobile: e[`${prefix}_BUSINESS_USER_MOBILE`], otp: e[`${prefix}_BUSINESS_USER_OTP`] },
      'new-admin': { mobile: e[`${prefix}_NEW_ADMIN_USER_MOBILE`], otp: e[`${prefix}_NEW_ADMIN_USER_OTP`] },
    },
    apis: {
      'api-backend': e[`${prefix}_BASE_URL_BACKEND`],
      'api-emi': e[`${prefix}_BASE_URL_EMI`],
    },
    apiCreds: {
      'api-backend': { mobile: e[`${prefix}_BACKEND_USER_MOBILE`], otp: e[`${prefix}_BACKEND_USER_OTP`] },
      'api-emi': { mobile: e[`${prefix}_EMI_USER_MOBILE`], otp: e[`${prefix}_EMI_USER_OTP`] },
    },
  };
}

const BUNDLES: Record<EnvName, EnvBundle> = {
  test: buildBundle('TEST'),
  uat: buildBundle('UAT'),
};

export function panelUrl(panel: Panel, envName: EnvName = getTargetEnv()): string {
  return BUNDLES[envName].panels[panel];
}

export function panelCreds(panel: Panel, envName: EnvName = getTargetEnv()): Credential {
  return BUNDLES[envName].panelCreds[panel];
}

export function apiUrl(service: ApiService, envName: EnvName = getTargetEnv()): string {
  return BUNDLES[envName].apis[service];
}

export function apiCreds(service: ApiService, envName: EnvName = getTargetEnv()): Credential {
  return BUNDLES[envName].apiCreds[service];
}

/** Shop checkout OTP (TC_SHOP_* specs). Separate from login OTP; defaults to `1234`. */
export function shopCheckoutOtp(envName: EnvName = getTargetEnv()): string {
  const e = env as unknown as Record<string, string>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return e[`${prefix}_SHOP_USER_OTP`]?.trim() || '1234';
}

export function adminRoleCreds(role: AdminRole, envName: EnvName = getTargetEnv()): Credential {
  const e = env as unknown as Record<string, string>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return {
    mobile: e[roleMobileKey(role, prefix)],
    otp: e[`${prefix}_ADMIN_${role.toUpperCase()}_OTP`] ?? e.ADMIN_OTP ?? '1234',
  };
}

/** Full URL for digital-gold spot rates (gBuy / gSell), aligned with `{TEST|UAT}_BASE_URL_BACKEND`. */
export function digitalGoldRatesUrl(envName: EnvName = getTargetEnv()): string {
  const base = apiUrl('api-backend', envName).replace(/\/+$/, '');
  return `${base}/api/digital-gold/rates`;
}

/** Get the file path for document uploads (PAN, Aadhaar, Signature, Document, Aadhaar XML). */
export function documentPath(docType: 'PAN_CARD' | 'AADHAAR' | 'SIGNATURE' | 'DOCUMENT' | 'AADHARXML', envName: EnvName = getTargetEnv()): string | undefined {
  const e = env as unknown as Record<string, string | undefined>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return e[`${prefix}_${docType}_PATH`];
}

export function autoPanNumber(envName: EnvName = getTargetEnv()): string {
  const e = env as unknown as Record<string, string | undefined>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return e[`${prefix}_AUTO_PAN_NUMBER`] ?? 'BLXPT4445F';
}

export interface PasswordCredential {
  userId?: string;
  password?: string;
}

/** Credentials for the admin panel's userId/password login form (negative-path login tests). */
export function adminPasswordCreds(envName: EnvName = getTargetEnv()): PasswordCredential {
  const e = env as unknown as Record<string, string | undefined>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return {
    userId: e[`${prefix}_ADMIN_USER_EMAIL`],
    password: e[`${prefix}_ADMIN_USER_PASSWORD`],
  };
}

export function adminInactiveUserCreds(envName: EnvName = getTargetEnv()): PasswordCredential {
  const e = env as unknown as Record<string, string | undefined>;
  const prefix = envName === 'uat' ? 'UAT' : 'TEST';
  return {
    userId: e[`${prefix}_ADMIN_INACTIVE_USER_EMAIL`],
    password: e[`${prefix}_ADMIN_INACTIVE_USER_PASSWORD`],
  };
}

export interface ApiServiceAuthConfig {
  sendOtpPath: string;
  verifyOtpPath: string;
  mobile: string;
  otp: string;
  tokenJsonPath: string;
}

export function apiAuthConfig(service: ApiService, envName: EnvName = getTargetEnv()): ApiServiceAuthConfig {
  const creds = apiCreds(service, envName);
  return {
    sendOtpPath: '/api/v1/auth/send-otp',
    verifyOtpPath: '/api/v1/auth/verify-otp',
    mobile: creds.mobile,
    otp: creds.otp,
    tokenJsonPath: 'data.token',
  };
}
