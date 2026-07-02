import { env } from '../../config/env';
import { createServer } from './server';
import { logger } from '../../utils/logger/logger';

const { app } = createServer({
  apiKey: env.API_KEY,
  defaultEnv: env.DEFAULT_ENV,
  maxConcurrentRuns: 2,
});

const server = app.listen(env.API_PORT, () => {
  logger.info('api listening', {
    port: env.API_PORT,
    defaultEnv: env.DEFAULT_ENV,
  });
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    logger.info('shutting down', { signal: sig });
    server.close(() => process.exit(0));
  });
}
