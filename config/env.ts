import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS, type EnvName, getTargetEnv } from './environments';

dotenv.config();

const nonEmpty = z.string().min(1);
const url = z.string().url();

/**
 * Build the Zod shape for one env prefix's keys. When `required` is false every key is `.optional()`
 * — used for the env we are NOT targeting this run, so only the active env (TARGET_ENV/DEFAULT_ENV)
 * needs to be filled in `.env`. The inactive block is still accepted if present.
 */
function envBlockShape(prefix: 'TEST' | 'UAT', required: boolean): z.ZodRawShape {
  const u = required ? url : url.optional();
  const s = required ? nonEmpty : nonEmpty.optional();
  const path = nonEmpty.optional(); // File paths are always optional
  return {
    [`${prefix}_BASE_URL_ADMIN`]: u,
    [`${prefix}_BASE_URL_CUSTOMER`]: u,
    [`${prefix}_BASE_URL_BUSINESS`]: u,
    [`${prefix}_BASE_URL_NEW_ADMIN`]: u,
    [`${prefix}_BASE_URL_BACKEND`]: u,
    [`${prefix}_BASE_URL_EMI`]: u,
    // Admin role login credentials (mobile per role) — all optional to support various test scenarios
    [`${prefix}_ADMIN_ADMIN_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_APPRAISER_MOBILE`]: s,
    [`${prefix}_ADMIN_BM_MOBILE`]: s,
    [`${prefix}_ADMIN_OPS_MOBILE`]: s,
    [`${prefix}_ADMIN_PARTNER_MOBILE`]: s,
    // User panel credentials are always optional — panels may not run in every suite
    [`${prefix}_ADMIN_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_USER_OTP`]: nonEmpty.optional(),
    [`${prefix}_CUSTOMER_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_CUSTOMER_USER_OTP`]: nonEmpty.optional(),
    [`${prefix}_BUSINESS_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_BUSINESS_USER_OTP`]: nonEmpty.optional(),
    [`${prefix}_NEW_ADMIN_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_NEW_ADMIN_USER_OTP`]: nonEmpty.optional(),
    [`${prefix}_BACKEND_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_BACKEND_USER_OTP`]: nonEmpty.optional(),
    [`${prefix}_EMI_USER_MOBILE`]: nonEmpty.optional(),
    [`${prefix}_EMI_USER_OTP`]: nonEmpty.optional(),
    // File upload paths for test documents (KYC)
    [`${prefix}_PAN_CARD_PATH`]: path,
    [`${prefix}_AADHAAR_PATH`]: path,
    [`${prefix}_SIGNATURE_PATH`]: path,
    [`${prefix}_DOCUMENT_PATH`]: path,
  };
}

const commonShape: z.ZodRawShape = {
  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  HEADLESS: z.string().default('true').transform((v) => v !== 'false'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ADMIN_OTP: z.string().default('1234'),
};

/** Schema requiring only the ACTIVE env's keys; the other env block is optional. */
function buildSchema(activePrefix: 'TEST' | 'UAT') {
  const inactivePrefix = activePrefix === 'TEST' ? 'UAT' : 'TEST';
  return z.object({
    ...envBlockShape(activePrefix, true),
    ...envBlockShape(inactivePrefix, false),
    ...commonShape,
  });
}

type EnvUrlKeys<Prefix extends string> =
  | `${Prefix}_BASE_URL_ADMIN`
  | `${Prefix}_BASE_URL_CUSTOMER`
  | `${Prefix}_BASE_URL_BUSINESS`
  | `${Prefix}_BASE_URL_NEW_ADMIN`
  | `${Prefix}_BASE_URL_BACKEND`
  | `${Prefix}_BASE_URL_EMI`;

type EnvCredKeys<Prefix extends string> =
  | `${Prefix}_ADMIN_ADMIN_MOBILE`
  | `${Prefix}_ADMIN_APPRAISER_MOBILE`
  | `${Prefix}_ADMIN_BM_MOBILE`
  | `${Prefix}_ADMIN_OPS_MOBILE`
  | `${Prefix}_ADMIN_PARTNER_MOBILE`
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

export type AppEnv = Record<EnvUrlKeys<'TEST'>, string>
  & Record<EnvUrlKeys<'UAT'>, string>
  & Partial<Record<EnvCredKeys<'TEST'>, string>>
  & Partial<Record<EnvCredKeys<'UAT'>, string>>
  & {
    DEFAULT_ENV: EnvName;
    HEADLESS: boolean;
    API_PORT: number;
    API_KEY: string;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
    ADMIN_OTP: string;
  };

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppEnv {
  const target = getTargetEnv(source as NodeJS.ProcessEnv);
  const activePrefix = target === 'uat' ? 'UAT' : 'TEST';
  const parsed = buildSchema(activePrefix).safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i: z.core.$ZodIssue) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data as unknown as AppEnv;
};

export const env = (() => {
  try { return loadEnv(); } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') return {} as AppEnv;
    throw err;
  }
})();