import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../../src/api/services/run-manager.service';

describe('RunManager', () => {
  let mgr: RunManager;
  beforeEach(() => { mgr = new RunManager({ maxConcurrent: 2 }); });

  it('creates a run with unique id, queued status, resolvedEnv', () => {
    const r = mgr.create({ projects: ['admin'] }, 'test');
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.status).toBe('queued');
    expect(r.resolvedEnv).toBe('test');
    expect(r.artifactDir.endsWith(r.id)).toBe(true);
  });

  it('stores different resolvedEnv per run', () => {
    const a = mgr.create({}, 'test');
    const b = mgr.create({}, 'uat');
    expect(mgr.get(a.id)?.resolvedEnv).toBe('test');
    expect(mgr.get(b.id)?.resolvedEnv).toBe('uat');
  });

  it('gets run by id', () => {
    const r = mgr.create({}, 'test');
    expect(mgr.get(r.id)?.id).toBe(r.id);
    expect(mgr.get('nope')).toBeUndefined();
  });

  it('updates status and finishedAt', () => {
    const r = mgr.create({}, 'test');
    mgr.updateStatus(r.id, 'running');
    expect(mgr.get(r.id)?.status).toBe('running');
    mgr.markFinished(r.id, 0);
    expect(mgr.get(r.id)?.status).toBe('passed');
    expect(mgr.get(r.id)?.finishedAt).toBeDefined();
  });

  it('exit code !=0 maps to failed', () => {
    const r = mgr.create({}, 'test');
    mgr.markFinished(r.id, 1);
    expect(mgr.get(r.id)?.status).toBe('failed');
  });

  it('enforces maxConcurrent', () => {
    mgr.updateStatus(mgr.create({}, 'test').id, 'running');
    mgr.updateStatus(mgr.create({}, 'test').id, 'running');
    expect(mgr.runningCount()).toBe(2);
    expect(mgr.canStartAnother()).toBe(false);
  });

  it('lists runs newest-first', async () => {
    const a = mgr.create({}, 'test');
    await new Promise((r) => setTimeout(r, 2));
    const b = mgr.create({}, 'uat');
    const list = mgr.list();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });
});
