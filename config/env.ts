import { z } from 'zod';
import * as dotenv from 'dotenv';
import { ENVIRONMENTS } from './environments';

dotenv.config();

const nonEmpty = z.string().min(1);
const url = z.string().url();

const envSchema = z.object({
  // TEST block
  TEST_BASE_URL_ADMIN: url,
  TEST_BASE_URL_CUSTOMER: url,
  TEST_BASE_URL_BUSINESS: url,
  TEST_BASE_URL_NEW_ADMIN: url,
  TEST_BASE_URL_BACKEND: url,
  TEST_BASE_URL_EMI: url,
  TEST_BASE_URL_LGD: url,
  TEST_ADMIN_USER_EMAIL: nonEmpty,
  TEST_ADMIN_USER_PASSWORD: nonEmpty,
  TEST_CUSTOMER_USER_EMAIL: nonEmpty,
  TEST_CUSTOMER_USER_PASSWORD: nonEmpty,
  TEST_BUSINESS_USER_EMAIL: nonEmpty,
  TEST_BUSINESS_USER_PASSWORD: nonEmpty,
  TEST_NEW_ADMIN_USER_EMAIL: nonEmpty,
  TEST_NEW_ADMIN_USER_PASSWORD: nonEmpty,
  TEST_BACKEND_USER_EMAIL: nonEmpty,
  TEST_BACKEND_USER_PASSWORD: nonEmpty,
  TEST_EMI_USER_EMAIL: nonEmpty,
  TEST_EMI_USER_PASSWORD: nonEmpty,
  TEST_LGD_USER_EMAIL: nonEmpty,
  TEST_LGD_USER_PASSWORD: nonEmpty,

  // UAT block
  UAT_BASE_URL_ADMIN: url,
  UAT_BASE_URL_CUSTOMER: url,
  UAT_BASE_URL_BUSINESS: url,
  UAT_BASE_URL_NEW_ADMIN: url,
  UAT_BASE_URL_BACKEND: url,
  UAT_BASE_URL_EMI: url,
  UAT_BASE_URL_LGD: url,
  UAT_ADMIN_USER_EMAIL: nonEmpty,
  UAT_ADMIN_USER_PASSWORD: nonEmpty,
  UAT_CUSTOMER_USER_EMAIL: nonEmpty,
  UAT_CUSTOMER_USER_PASSWORD: nonEmpty,
  UAT_BUSINESS_USER_EMAIL: nonEmpty,
  UAT_BUSINESS_USER_PASSWORD: nonEmpty,
  UAT_NEW_ADMIN_USER_EMAIL: nonEmpty,
  UAT_NEW_ADMIN_USER_PASSWORD: nonEmpty,
  UAT_BACKEND_USER_EMAIL: nonEmpty,
  UAT_BACKEND_USER_PASSWORD: nonEmpty,
  UAT_EMI_USER_EMAIL: nonEmpty,
  UAT_EMI_USER_PASSWORD: nonEmpty,
  UAT_LGD_USER_EMAIL: nonEmpty,
  UAT_LGD_USER_PASSWORD: nonEmpty,

  // PRODUCTION block
  PRODUCTION_BASE_URL_ADMIN: url,
  PRODUCTION_BASE_URL_CUSTOMER: url,
  PRODUCTION_BASE_URL_BUSINESS: url,
  PRODUCTION_BASE_URL_NEW_ADMIN: url,
  PRODUCTION_BASE_URL_BACKEND: url,
  PRODUCTION_BASE_URL_EMI: url,
  PRODUCTION_BASE_URL_LGD: url,
  PRODUCTION_ADMIN_USER_EMAIL: nonEmpty,
  PRODUCTION_ADMIN_USER_PASSWORD: nonEmpty,
  PRODUCTION_CUSTOMER_USER_EMAIL: nonEmpty,
  PRODUCTION_CUSTOMER_USER_PASSWORD: nonEmpty,
  PRODUCTION_BUSINESS_USER_EMAIL: nonEmpty,
  PRODUCTION_BUSINESS_USER_PASSWORD: nonEmpty,
  PRODUCTION_NEW_ADMIN_USER_EMAIL: nonEmpty,
  PRODUCTION_NEW_ADMIN_USER_PASSWORD: nonEmpty,
  PRODUCTION_BACKEND_USER_EMAIL: nonEmpty,
  PRODUCTION_BACKEND_USER_PASSWORD: nonEmpty,
  PRODUCTION_EMI_USER_EMAIL: nonEmpty,
  PRODUCTION_EMI_USER_PASSWORD: nonEmpty,
  PRODUCTION_LGD_USER_EMAIL: nonEmpty,
  PRODUCTION_LGD_USER_PASSWORD: nonEmpty,

  // Flags & runner
  DEFAULT_ENV: z.enum(ENVIRONMENTS).default('test'),
  ALLOW_PRODUCTION_RUNS: z.string().default('false').transform((v) => v === 'true'),
  HEADLESS: z.string().default('true').transform((v) => v !== 'false'),

  API_PORT: z.coerce.number().int().positive().default(3000),
  API_KEY: z.string().min(8),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export const env = (() => {
  try { return loadEnv(); } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') return {} as AppEnv;
    throw err;
  }
})();
