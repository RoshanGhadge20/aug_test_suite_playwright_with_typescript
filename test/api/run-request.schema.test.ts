import { describe, it, expect } from 'vitest';
import { RunRequestSchema } from '../../src/api/schemas/run-request.schema';

describe('RunRequestSchema', () => {
  it('accepts empty body with defaults', () => {
    const parsed = RunRequestSchema.parse({});
    expect(parsed.workers).toBeUndefined();
  });

  it('accepts valid projects list', () => {
    const parsed = RunRequestSchema.parse({ projects: ['admin', 'customer'] });
    expect(parsed.projects).toEqual(['admin', 'customer']);
  });

  it('rejects unknown project name', () => {
    expect(() => RunRequestSchema.parse({ projects: ['hacker'] })).toThrow();
  });

  it('rejects negative workers', () => {
    expect(() => RunRequestSchema.parse({ workers: -1 })).toThrow();
  });

  it('rejects non-string grep', () => {
    expect(() => RunRequestSchema.parse({ grep: 123 })).toThrow();
  });

  it('accepts api service projects', () => {
    const parsed = RunRequestSchema.parse({ projects: ['api-backend', 'api-emi', 'api-lgd'] });
    expect(parsed.projects).toEqual(['api-backend', 'api-emi', 'api-lgd']);
  });

  it('accepts mix of ui and api projects', () => {
    const parsed = RunRequestSchema.parse({ projects: ['admin', 'api-backend'] });
    expect(parsed.projects).toHaveLength(2);
  });
});
