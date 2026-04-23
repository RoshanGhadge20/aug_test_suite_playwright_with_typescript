import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS, isEnvName, type EnvName } from './environments';

dotenv.config();

const nonEmpty = z.string().min(1);
const url = z.string().url();

const baseSchema = z.object({
  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  TARGET_PANEL: z.enum(['admin', 'customer', 'business', 'new-admin', 'api-backend', 'api-emi']).optional(),
  HEADLESS: z.string().default('true').transform((v) => v !== 'false'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

function envBlockSchema(prefix: 'TEST' | 'UAT') {
  return z.object({
    [`${prefix}_BASE_URL_ADMIN`]: url,
    [`${prefix}_BASE_URL_CUSTOMER`]: url,
    [`${prefix}_BASE_URL_BUSINESS`]: url,
    [`${prefix}_BASE_URL_NEW_ADMIN`]: url,
    [`${prefix}_BASE_URL_BACKEND`]: url,
    [`${prefix}_BASE_URL_EMI`]: url,
    [`${prefix}_ADMIN_USER_MOBILE`]: nonEmpty,
    [`${prefix}_ADMIN_USER_OTP`]: nonEmpty,
    [`${prefix}_CUSTOMER_USER_MOBILE`]: nonEmpty,
    [`${prefix}_CUSTOMER_USER_OTP`]: nonEmpty,
    [`${prefix}_BUSINESS_USER_MOBILE`]: nonEmpty,
    [`${prefix}_BUSINESS_USER_OTP`]: nonEmpty,
    [`${prefix}_NEW_ADMIN_USER_MOBILE`]: nonEmpty,
    [`${prefix}_NEW_ADMIN_USER_OTP`]: nonEmpty,
    [`${prefix}_BACKEND_USER_MOBILE`]: nonEmpty,
    [`${prefix}_BACKEND_USER_OTP`]: nonEmpty,
    [`${prefix}_EMI_USER_MOBILE`]: nonEmpty,
    [`${prefix}_EMI_USER_OTP`]: nonEmpty,
  });
}

function panelSchema(prefix: 'TEST' | 'UAT', panel: 'admin' | 'customer' | 'business' | 'new-admin' | 'api-backend' | 'api-emi') {
  switch (panel) {
    case 'admin':
      return z.object({
        [`${prefix}_BASE_URL_ADMIN`]: url,
        [`${prefix}_ADMIN_USER_MOBILE`]: nonEmpty,
        [`${prefix}_ADMIN_USER_OTP`]: nonEmpty,
      });
    case 'customer':
      return z.object({
        [`${prefix}_BASE_URL_CUSTOMER`]: url,
        [`${prefix}_CUSTOMER_USER_MOBILE`]: nonEmpty,
        [`${prefix}_CUSTOMER_USER_OTP`]: nonEmpty,
      });
    case 'business':
      return z.object({
        [`${prefix}_BASE_URL_BUSINESS`]: url,
        [`${prefix}_BUSINESS_USER_MOBILE`]: nonEmpty,
        [`${prefix}_BUSINESS_USER_OTP`]: nonEmpty,
      });
    case 'new-admin':
      return z.object({
        [`${prefix}_BASE_URL_NEW_ADMIN`]: url,
        [`${prefix}_NEW_ADMIN_USER_MOBILE`]: nonEmpty,
        [`${prefix}_NEW_ADMIN_USER_OTP`]: nonEmpty,
      });
    case 'api-backend':
      return z.object({
        [`${prefix}_BASE_URL_BACKEND`]: url,
        [`${prefix}_BACKEND_USER_MOBILE`]: nonEmpty,
        [`${prefix}_BACKEND_USER_OTP`]: nonEmpty,
      });
    case 'api-emi':
      return z.object({
        [`${prefix}_BASE_URL_EMI`]: url,
        [`${prefix}_EMI_USER_MOBILE`]: nonEmpty,
        [`${prefix}_EMI_USER_OTP`]: nonEmpty,
      });
  }
}

function resolveTargetEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>): EnvName {
  const requested = source.TARGET_ENV;
  if (isEnvName(requested)) return requested;
  const fallback = source.DEFAULT_ENV;
  if (isEnvName(fallback)) return fallback;
  return 'test';
}

function resolveTargetPanel(
  source: NodeJS.ProcessEnv | Record<string, string | undefined>,
): 'admin' | 'customer' | 'business' | 'new-admin' | 'api-backend' | 'api-emi' | undefined {
  const panel = source.TARGET_PANEL;
  if (
    panel === 'admin'
    || panel === 'customer'
    || panel === 'business'
    || panel === 'new-admin'
    || panel === 'api-backend'
    || panel === 'api-emi'
  ) {
    return panel;
  }
  return undefined;
}

type EnvBlockKeys<Prefix extends string> =
  | `${Prefix}_BASE_URL_ADMIN`
  | `${Prefix}_BASE_URL_CUSTOMER`
  | `${Prefix}_BASE_URL_BUSINESS`
  | `${Prefix}_BASE_URL_NEW_ADMIN`
  | `${Prefix}_BASE_URL_BACKEND`
  | `${Prefix}_BASE_URL_EMI`
  | `${Prefix}_ADMIN_USER_MOBILE`
  | `${Prefix}_ADMIN_USER_OTP`
  | `${Prefix}_CUSTOMER_USER_MOBILE`
  | `${Prefix}_CUSTOMER_USER_OTP`
  | `${Prefix}_BUSINESS_USER_MOBILE`
  | `${Prefix}_BUSINESS_USER_OTP`
  | `${Prefix}_NEW_ADMIN_USER_MOBILE`
  | `${Prefix}_NEW_ADMIN_USER_OTP`
  | `${Prefix}_BACKEND_USER_MOBILE`
  | `${Prefix}_BACKEND_USER_OTP`
  | `${Prefix}_EMI_USER_MOBILE`
  | `${Prefix}_EMI_USER_OTP`;

export type AppEnv = Record<EnvBlockKeys<'TEST'>, string>
  & Record<EnvBlockKeys<'UAT'>, string>
  & {
    DEFAULT_ENV: EnvName;
    HEADLESS: boolean;
    API_PORT: number;
    API_KEY: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  };

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppEnv {
  const targetEnv = resolveTargetEnv(source);
  const targetPanel = resolveTargetPanel(source);
  const envPrefix = targetEnv === 'uat' ? 'UAT' : 'TEST';
  const scopedSchema = targetPanel ? panelSchema(envPrefix, targetPanel) : envBlockSchema(envPrefix);
  const parsed = baseSchema.and(scopedSchema).safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data as unknown as AppEnv;
}

export const env = (() => {
  try { return loadEnv(); } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') return {} as AppEnv;
    throw err;
  }
})();
