import { env } from './env';
import type { Panel } from './constants';

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
