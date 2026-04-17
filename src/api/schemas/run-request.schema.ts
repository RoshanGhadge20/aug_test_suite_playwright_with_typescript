import { z } from 'zod';

export const RunRequestSchema = z.object({
  projects: z.array(z.enum(['admin', 'customer', 'business', 'new-admin'])).optional(),
  grep: z.string().min(1).max(200).optional(),
  grepInvert: z.string().min(1).max(200).optional(),
  specFiles: z.array(z.string().min(1).max(500)).max(50).optional(),
  env: z.enum(['dev', 'staging', 'production']).optional(),
  workers: z.number().int().min(1).max(16).optional(),
  retries: z.number().int().min(0).max(5).optional(),
  headed: z.boolean().optional(),
}).strict();

export type ValidatedRunRequest = z.infer<typeof RunRequestSchema>;
