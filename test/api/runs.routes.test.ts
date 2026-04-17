import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRunsRouter } from '../../src/api/routes/runs.routes';
import { RunManager } from '../../src/api/services/run-manager.service';
import { errorMiddleware } from '../../src/api/middleware/error.middleware';

const makeApp = (mgr: RunManager, exec: () => Promise<number>) => {
  const app = express();
  app.use(express.json());
  app.use('/api', createRunsRouter({ runManager: mgr, executePlaywright: exec }));
  app.use(errorMiddleware);
  return app;
};

describe('runs routes', () => {
  it('POST /api/runs creates a queued run and returns 202', async () => {
    const mgr = new RunManager();
    const exec = vi.fn().mockResolvedValue(0);
    const res = await request(makeApp(mgr, exec)).post('/api/runs').send({ projects: ['admin'] });
    expect(res.status).toBe(202);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('queued');
  });

  it('POST /api/runs rejects invalid project', async () => {
    const mgr = new RunManager();
    const exec = vi.fn();
    const res = await request(makeApp(mgr, exec)).post('/api/runs').send({ projects: ['hacker'] });
    expect(res.status).toBe(400);
  });

  it('GET /api/runs/:id returns 404 for unknown', async () => {
    const mgr = new RunManager();
    const res = await request(makeApp(mgr, vi.fn())).get('/api/runs/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /api/runs/:id returns run for known id', async () => {
    const mgr = new RunManager();
    const created = mgr.create({});
    const res = await request(makeApp(mgr, vi.fn())).get(`/api/runs/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  it('GET /api/runs lists runs', async () => {
    const mgr = new RunManager();
    mgr.create({}); mgr.create({});
    const res = await request(makeApp(mgr, vi.fn())).get('/api/runs');
    expect(res.status).toBe(200);
    expect(res.body.runs.length).toBe(2);
  });
});
