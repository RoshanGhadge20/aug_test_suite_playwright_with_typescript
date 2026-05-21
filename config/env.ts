import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS, type EnvName } from './environments';

dotenv.config();

const nonEmpty = z.string().min(1);
const url = z.string().url();

const envSchema = z.object({
  TEST_BASE_URL_ADMIN: url,
  TEST_BASE_URL_CUSTOMER: url,
  TEST_BASE_URL_BUSINESS: url,
  TEST_BASE_URL_NEW_ADMIN: url,
  TEST_BASE_URL_BACKEND: url,
  TEST_BASE_URL_EMI: url,
  TEST_ADMIN_USER_MOBILE: nonEmpty,
  TEST_ADMIN_USER_OTP: nonEmpty,
  TEST_CUSTOMER_USER_MOBILE: nonEmpty,
  TEST_CUSTOMER_USER_OTP: nonEmpty,
  TEST_BUSINESS_USER_MOBILE: nonEmpty,
  TEST_BUSINESS_USER_OTP: nonEmpty,
  TEST_NEW_ADMIN_USER_MOBILE: nonEmpty,
  TEST_NEW_ADMIN_USER_OTP: nonEmpty,
  TEST_BACKEND_USER_MOBILE: nonEmpty,
  TEST_BACKEND_USER_OTP: nonEmpty,
  TEST_EMI_USER_MOBILE: nonEmpty,
  TEST_EMI_USER_OTP: nonEmpty,

  UAT_BASE_URL_ADMIN: url,
  UAT_BASE_URL_CUSTOMER: url,
  UAT_BASE_URL_BUSINESS: url,
  UAT_BASE_URL_NEW_ADMIN: url,
  UAT_BASE_URL_BACKEND: url,
  UAT_BASE_URL_EMI: url,
  UAT_ADMIN_USER_MOBILE: nonEmpty,
  UAT_ADMIN_USER_OTP: nonEmpty,
  UAT_CUSTOMER_USER_MOBILE: nonEmpty,
  UAT_CUSTOMER_USER_OTP: nonEmpty,
  UAT_BUSINESS_USER_MOBILE: nonEmpty,
  UAT_BUSINESS_USER_OTP: nonEmpty,
  UAT_NEW_ADMIN_USER_MOBILE: nonEmpty,
  UAT_NEW_ADMIN_USER_OTP: nonEmpty,
  UAT_BACKEND_USER_MOBILE: nonEmpty,
  UAT_BACKEND_USER_OTP: nonEmpty,
  UAT_EMI_USER_MOBILE: nonEmpty,
  UAT_EMI_USER_OTP: nonEmpty,

  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  HEADLESS: z.string().default('true').transform((v) => v !== 'false'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

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
  const parsed = envSchema.safeParse(source);
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