import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRunsRouter } from '../../src/api/routes/runs.routes';
import { RunManager } from '../../src/api/services/run-manager.service';
import { errorMiddleware } from '../../src/api/middleware/error.middleware';
import type { TargetEnv } from '../../src/api/types/run.types';

const makeApp = (opts: { mgr?: RunManager; exec?: () => Promise<number>; allowProd?: boolean; defaultEnv?: TargetEnv } = {}) => {
  const mgr = opts.mgr ?? new RunManager();
  const exec = opts.exec ?? (async () => 0);
  const app = express();
  app.use(express.json());
  app.use('/api', createRunsRouter({
    runManager: mgr,
    executePlaywright: exec,
    defaultEnv: opts.defaultEnv ?? 'test',
    allowProductionRuns: opts.allowProd ?? false,
  }));
  app.use(errorMiddleware);
  return { app, mgr };
};

describe('runs routes', () => {
  it('POST /api/runs creates queued run with default env', async () => {
    const { app } = makeApp({ defaultEnv: 'uat' });
    const res = await request(app).post('/api/runs').send({ projects: ['admin'] });
    expect(res.status).toBe(202);
    expect(res.body.resolvedEnv).toBe('uat');
    expect(res.body.status).toBe('queued');
  });

  it('POST /api/runs honors explicit env', async () => {
    const { app } = makeApp({ defaultEnv: 'test' });
    const res = await request(app).post('/api/runs').send({ env: 'uat' });
    expect(res.body.resolvedEnv).toBe('uat');
  });

  it('POST /api/runs blocks production when gate is off', async () => {
    const { app } = makeApp({ allowProd: false });
    const res = await request(app).post('/api/runs').send({ env: 'production' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('production_runs_disabled');
  });

  it('POST /api/runs allows production when gate is on', async () => {
    const { app } = makeApp({ allowProd: true });
    const res = await request(app).post('/api/runs').send({ env: 'production' });
    expect(res.status).toBe(202);
    expect(res.body.resolvedEnv).toBe('production');
  });

  it('POST /api/runs rejects invalid env value', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/runs').send({ env: 'staging' });
    expect(res.status).toBe(400);
  });

  it('GET /api/runs/:id returns 404 for unknown', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/runs/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /api/runs/:id returns run', async () => {
    const { app, mgr } = makeApp();
    const r = mgr.create({}, 'test');
    const res = await request(app).get(`/api/runs/${r.id}`);
    expect(res.body.id).toBe(r.id);
  });

  it('GET /api/runs lists runs', async () => {
    const { app, mgr } = makeApp();
    mgr.create({}, 'test'); mgr.create({}, 'uat');
    const res = await request(app).get('/api/runs');
    expect(res.body.runs.length).toBe(2);
  });
});
