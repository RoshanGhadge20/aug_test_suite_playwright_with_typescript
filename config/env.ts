import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS, getTargetEnv, type EnvName } from './environments';

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
    [`${prefix}_AADHARXML_PATH`]: path,
    [`${prefix}_IMAGE_PATH`]: path,
    // Optional extras read through config/urls.ts (zod strips any key not listed here)
    [`${prefix}_AUTO_PAN_NUMBER`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_USER_EMAIL`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_USER_PASSWORD`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_INACTIVE_USER_EMAIL`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_INACTIVE_USER_PASSWORD`]: nonEmpty.optional(),
    // Per-role backdoor OTPs (adminRoleCreds falls back to ADMIN_OTP, then '1234')
    [`${prefix}_ADMIN_ADMIN_OTP`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_APPRAISER_OTP`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_BM_OTP`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_OPS_OTP`]: nonEmpty.optional(),
    [`${prefix}_ADMIN_PARTNER_OTP`]: nonEmpty.optional(),
  };
}

const commonShape: z.ZodRawShape = {
  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  HEADLESS: z.string().default('true').transform((v) => v !== 'false'),
  ADMIN_OTP: nonEmpty.optional(),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
};

/**
 * Only the env being targeted this run (TARGET_ENV, else DEFAULT_ENV, else 'test') has its block
 * required; the other env's block is accepted but optional.
 */
function buildEnvSchema(source: NodeJS.ProcessEnv | Record<string, string | undefined>) {
  const active = getTargetEnv(source as NodeJS.ProcessEnv);
  return z.object({
    ...commonShape,
    ...envBlockShape('TEST', active === 'test'),
    ...envBlockShape('UAT', active === 'uat'),
  });
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
  | `${Prefix}_ADMIN_USER_EMAIL`
  | `${Prefix}_ADMIN_USER_PASSWORD`
  | `${Prefix}_ADMIN_INACTIVE_USER_EMAIL`
  | `${Prefix}_ADMIN_INACTIVE_USER_PASSWORD`
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
  const parsed = buildEnvSchema(source).safeParse(source);
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
