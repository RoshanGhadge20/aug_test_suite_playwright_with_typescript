import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../../src/api/services/run-manager.service';

describe('RunManager', () => {
  let mgr: RunManager;
  beforeEach(() => { mgr = new RunManager({ maxConcurrent: 2 }); });

  it('creates a run with unique id and queued status', () => {
    const r = mgr.create({ projects: ['admin'] });
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.status).toBe('queued');
    expect(r.artifactDir.endsWith(r.id)).toBe(true);
  });

  it('gets run by id', () => {
    const r = mgr.create({});
    expect(mgr.get(r.id)?.id).toBe(r.id);
    expect(mgr.get('nope')).toBeUndefined();
  });

  it('updates status and finishedAt', () => {
    const r = mgr.create({});
    mgr.updateStatus(r.id, 'running');
    expect(mgr.get(r.id)?.status).toBe('running');
    mgr.markFinished(r.id, 0);
    expect(mgr.get(r.id)?.status).toBe('passed');
    expect(mgr.get(r.id)?.finishedAt).toBeDefined();
    expect(mgr.get(r.id)?.exitCode).toBe(0);
  });

  it('exit code !=0 maps to failed', () => {
    const r = mgr.create({});
    mgr.markFinished(r.id, 1);
    expect(mgr.get(r.id)?.status).toBe('failed');
  });

  it('enforces maxConcurrent', () => {
    mgr.create({}); mgr.updateStatus(mgr.create({}).id, 'running');
    mgr.updateStatus(mgr.create({}).id, 'running');
    expect(mgr.runningCount()).toBe(2);
    expect(mgr.canStartAnother()).toBe(false);
  });

  it('lists runs newest-first', async () => {
    const a = mgr.create({});
    await new Promise(r => setTimeout(r, 2));
    const b = mgr.create({});
    const list = mgr.list();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });
});
