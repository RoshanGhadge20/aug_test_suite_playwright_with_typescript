import winston from 'winston';

const SENSITIVE_KEYS = new Set(['password', 'apiKey', 'api_key', 'token', 'authorization', 'secret']);

export type Logger = winston.Logger & {
  maskSensitive: (obj: Record<string, unknown>) => Record<string, unknown>;
};

export function createLogger(opts: { level: string; name: string }): Logger {
  const base = winston.createLogger({
    level: opts.level,
    defaultMeta: { service: opts.name },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  });

  const maskSensitive = (obj: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(k)) out[k] = '***';
      else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = maskSensitive(v as Record<string, unknown>);
      else out[k] = v;
    }
    return out;
  };

  (base as Logger).maskSensitive = maskSensitive;
  return base as Logger;
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  name: 'augmont-test-suite',
});
