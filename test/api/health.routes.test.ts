import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { healthRouter } from '../../src/api/routes/health.routes';

describe('GET /health', () => {
  const app = express().use(healthRouter);

  it('returns 200 + ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
