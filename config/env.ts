import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  BASE_URL_ADMIN: z.string().url(),
  BASE_URL_CUSTOMER: z.string().url(),
  BASE_URL_BUSINESS: z.string().url(),
  BASE_URL_NEW_ADMIN: z.string().url(),

  ADMIN_USER_EMAIL: z.string().min(1),
  ADMIN_USER_PASSWORD: z.string().min(1),
  CUSTOMER_USER_EMAIL: z.string().min(1),
  CUSTOMER_USER_PASSWORD: z.string().min(1),
  BUSINESS_USER_EMAIL: z.string().min(1),
  BUSINESS_USER_PASSWORD: z.string().min(1),
  NEW_ADMIN_USER_EMAIL: z.string().min(1),
  NEW_ADMIN_USER_PASSWORD: z.string().min(1),

  BASE_URL_BACKEND: z.string().url(),
  BASE_URL_EMI: z.string().url(),
  BASE_URL_LGD: z.string().url(),

  BACKEND_USER_EMAIL: z.string().min(1),
  BACKEND_USER_PASSWORD: z.string().min(1),
  EMI_USER_EMAIL: z.string().min(1),
  EMI_USER_PASSWORD: z.string().min(1),
  LGD_USER_EMAIL: z.string().min(1),
  LGD_USER_PASSWORD: z.string().min(1),

  ENV: z.enum(['dev', 'staging', 'production']).default('dev'),
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
  try {
    return loadEnv();
  } catch (err) {
    if (process.env.SKIP_ENV_VALIDATION === 'true') {
      return {} as AppEnv;
    }
    throw err;
  }
})();
