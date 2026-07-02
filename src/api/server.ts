import express, { Express } from 'express';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { healthRouter } from './routes/health.routes';
import { createRunsRouter } from './routes/runs.routes';
import { RunManager } from './services/run-manager.service';
import { executePlaywright } from './services/playwright-executor.service';
import type { TargetEnv } from './types/run.types';

export interface ServerConfig {
  apiKey: string;
  defaultEnv: TargetEnv;
  maxConcurrentRuns?: number;
}

export function createServer(config: ServerConfig): { app: Express; runManager: RunManager } {
  const app = express();
  const runManager = new RunManager({ maxConcurrent: config.maxConcurrentRuns ?? 2 });

  app.use(express.json({ limit: '256kb' }));
  app.use(healthRouter);
  app.use('/api', createAuthMiddleware(config.apiKey));
  app.use('/api', createRunsRouter({
    runManager,
    executePlaywright,
    defaultEnv: config.defaultEnv,
  }));
  app.use(errorMiddleware);

  return { app, runManager };
}
