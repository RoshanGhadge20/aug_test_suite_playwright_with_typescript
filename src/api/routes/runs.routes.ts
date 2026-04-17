import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { RunRequestSchema } from '../schemas/run-request.schema';
import type { RunManager } from '../services/run-manager.service';
import type { ExecuteOptions } from '../services/playwright-executor.service';
import { logger } from '../../../utils/logger/logger';

type ExecuteFn = (opts: ExecuteOptions) => Promise<number>;

export interface RunsRouterDeps {
  runManager: RunManager;
  executePlaywright: ExecuteFn;
}

export function createRunsRouter(deps: RunsRouterDeps): Router {
  const router = Router();
  const { runManager, executePlaywright } = deps;

  router.post('/runs', (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = RunRequestSchema.parse(req.body ?? {});
      if (!runManager.canStartAnother()) {
        res.status(429).json({ error: 'concurrency_limit_reached' });
        return;
      }
      const record = runManager.create(parsed);

      setImmediate(async () => {
        runManager.updateStatus(record.id, 'running');
        try {
          const exitCode = await executePlaywright({
            runId: record.id,
            request: parsed,
            runManager,
            artifactDir: record.artifactDir,
          });
          runManager.markFinished(record.id, exitCode);
          logger.info('run finished', { runId: record.id, exitCode });
        } catch (err) {
          runManager.markError(record.id);
          logger.error('run errored', { runId: record.id, err: (err as Error).message });
        }
      });

      res.status(202).json(record);
    } catch (err) { next(err); }
  });

  router.get('/runs', (_req, res) => {
    res.json({ runs: runManager.list() });
  });

  router.get('/runs/:id', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json(r);
  });

  router.get('/runs/:id/report', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    const reportIndex = path.join(r.artifactDir, 'html', 'index.html');
    if (!fs.existsSync(reportIndex)) {
      res.status(404).json({ error: 'report_not_ready', runStatus: r.status });
      return;
    }
    res.sendFile(path.resolve(reportIndex));
  });

  router.get('/runs/:id/logs', (req, res) => {
    const r = runManager.get(req.params.id);
    if (!r) { res.status(404).json({ error: 'not_found' }); return; }
    res.json({
      stdoutTail: r.stdoutTail ?? '',
      stderrTail: r.stderrTail ?? '',
    });
  });

  return router;
}
