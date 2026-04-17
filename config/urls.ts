import { env } from './env';
import type { Panel, ApiService } from './constants';
import type { EnvName } from './environments';
import { getTargetEnv } from './environments';

interface Credential { email: string; password: string; }

interface EnvBundle {
  panels: Record<Panel, string>;
  panelCreds: Record<Panel, Credential>;
  apis: Record<ApiService, string>;
  apiCreds: Record<ApiService, Credential>;
}

function buildBundle(prefix: 'TEST' | 'UAT' | 'PRODUCTION'): EnvBundle {
  const e = env as unknown as Record<string, string>;
  return {
    panels: {
      admin: e[`${prefix}_BASE_URL_ADMIN`],
      customer: e[`${prefix}_BASE_URL_CUSTOMER`],
      business: e[`${prefix}_BASE_URL_BUSINESS`],
      'new-admin': e[`${prefix}_BASE_URL_NEW_ADMIN`],
    },
    panelCreds: {
      admin: { email: e[`${prefix}_ADMIN_USER_EMAIL`], password: e[`${prefix}_ADMIN_USER_PASSWORD`] },
      customer: { email: e[`${prefix}_CUSTOMER_USER_EMAIL`], password: e[`${prefix}_CUSTOMER_USER_PASSWORD`] },
      business: { email: e[`${prefix}_BUSINESS_USER_EMAIL`], password: e[`${prefix}_BUSINESS_USER_PASSWORD`] },
      'new-admin': { email: e[`${prefix}_NEW_ADMIN_USER_EMAIL`], password: e[`${prefix}_NEW_ADMIN_USER_PASSWORD`] },
    },
    apis: {
      'api-backend': e[`${prefix}_BASE_URL_BACKEND`],
      'api-emi': e[`${prefix}_BASE_URL_EMI`],
      'api-lgd': e[`${prefix}_BASE_URL_LGD`],
    },
    apiCreds: {
      'api-backend': { email: e[`${prefix}_BACKEND_USER_EMAIL`], password: e[`${prefix}_BACKEND_USER_PASSWORD`] },
      'api-emi': { email: e[`${prefix}_EMI_USER_EMAIL`], password: e[`${prefix}_EMI_USER_PASSWORD`] },
      'api-lgd': { email: e[`${prefix}_LGD_USER_EMAIL`], password: e[`${prefix}_LGD_USER_PASSWORD`] },
    },
  };
}

const BUNDLES: Record<EnvName, EnvBundle> = {
  test: buildBundle('TEST'),
  uat: buildBundle('UAT'),
  production: buildBundle('PRODUCTION'),
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

export interface ApiServiceAuthConfig {
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export function apiAuthConfig(service: ApiService, envName: EnvName = getTargetEnv()): ApiServiceAuthConfig {
  const creds = apiCreds(service, envName);
  return {
    loginPath: '/api/v1/auth/login',
    email: creds.email,
    password: creds.password,
    tokenJsonPath: 'data.token',
  };
}
