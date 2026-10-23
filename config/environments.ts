export const ENVIRONMENTS = ['test', 'uat'] as const;
export type EnvName = typeof ENVIRONMENTS[number];

export function isEnvName(v: unknown): v is EnvName {
  return v === 'test' || v === 'uat';
}

export function getTargetEnv(processEnv:NodeJS.ProcessEnv = process.env): EnvName {
  const requested = processEnv.TARGET_ENV;
  if (isEnvName(requested)) return requested;
  const fallback = processEnv.DEFAULT_ENV;
  if (isEnvName(fallback)) return fallback;
  return 'test';
}
