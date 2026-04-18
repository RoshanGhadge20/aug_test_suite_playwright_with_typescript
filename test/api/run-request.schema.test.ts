import { describe, it, expect } from 'vitest';
import { RunRequestSchema } from '../../src/api/schemas/run-request.schema';

describe('RunRequestSchema', () => {
  it('accepts empty body', () => {
    expect(RunRequestSchema.parse({})).toEqual({});
  });

  it('accepts test/uat env values', () => {
    for (const e of ['test', 'uat'] as const) {
      expect(RunRequestSchema.parse({ env: e }).env).toBe(e);
    }
  });

  it('rejects production / dev / staging env values', () => {
    expect(() => RunRequestSchema.parse({ env: 'production' })).toThrow();
    expect(() => RunRequestSchema.parse({ env: 'dev' })).toThrow();
    expect(() => RunRequestSchema.parse({ env: 'staging' })).toThrow();
  });

  it('accepts api service projects', () => {
    const p = RunRequestSchema.parse({ projects: ['api-backend', 'api-emi', 'api-lgd'] });
    expect(p.projects).toEqual(['api-backend', 'api-emi', 'api-lgd']);
  });

  it('accepts mixed projects + env', () => {
    const p = RunRequestSchema.parse({ projects: ['admin', 'api-backend'], env: 'uat' });
    expect(p.projects).toHaveLength(2);
    expect(p.env).toBe('uat');
  });

  it('rejects unknown project', () => {
    expect(() => RunRequestSchema.parse({ projects: ['hacker'] })).toThrow();
  });

  it('rejects negative workers', () => {
    expect(() => RunRequestSchema.parse({ workers: -1 })).toThrow();
  });
});
