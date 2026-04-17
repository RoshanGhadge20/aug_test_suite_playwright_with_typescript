import { env } from './env';
import type { Panel, ApiService } from './constants';

export const PANEL_URLS: Record<Panel, string> = {
  admin: env.BASE_URL_ADMIN,
  customer: env.BASE_URL_CUSTOMER,
  business: env.BASE_URL_BUSINESS,
  'new-admin': env.BASE_URL_NEW_ADMIN,
};

export const PANEL_CREDENTIALS: Record<Panel, { email: string; password: string }> = {
  admin: { email: env.ADMIN_USER_EMAIL, password: env.ADMIN_USER_PASSWORD },
  customer: { email: env.CUSTOMER_USER_EMAIL, password: env.CUSTOMER_USER_PASSWORD },
  business: { email: env.BUSINESS_USER_EMAIL, password: env.BUSINESS_USER_PASSWORD },
  'new-admin': { email: env.NEW_ADMIN_USER_EMAIL, password: env.NEW_ADMIN_USER_PASSWORD },
};

export const API_SERVICE_URLS: Record<ApiService, string> = {
  'api-backend': env.BASE_URL_BACKEND,
  'api-emi': env.BASE_URL_EMI,
  'api-lgd': env.BASE_URL_LGD,
};

export interface ApiServiceAuthConfig {
  loginPath: string;
  email: string;
  password: string;
  tokenJsonPath: string;
}

export const API_SERVICE_AUTH: Record<ApiService, ApiServiceAuthConfig> = {
  'api-backend': {
    loginPath: '/api/v1/auth/login',
    email: env.BACKEND_USER_EMAIL,
    password: env.BACKEND_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
  'api-emi': {
    loginPath: '/api/v1/auth/login',
    email: env.EMI_USER_EMAIL,
    password: env.EMI_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
  'api-lgd': {
    loginPath: '/api/v1/auth/login',
    email: env.LGD_USER_EMAIL,
    password: env.LGD_USER_PASSWORD,
    tokenJsonPath: 'data.token',
  },
};
