import { describe, it, expect } from 'vitest';
import { buildPlaywrightArgs } from '../../src/api/services/playwright-executor.service';

describe('buildPlaywrightArgs', () => {
  it('uses test as default command', () => {
    expect(buildPlaywrightArgs({})).toEqual(['test']);
  });

  it('adds --project flags', () => {
    const args = buildPlaywrightArgs({ projects: ['admin', 'customer'] });
    expect(args).toContain('--project=admin');
    expect(args).toContain('--project=customer');
  });

  it('adds --grep and --grep-invert', () => {
    const args = buildPlaywrightArgs({ grep: '@smoke', grepInvert: '@flaky' });
    expect(args).toContain('--grep=@smoke');
    expect(args).toContain('--grep-invert=@flaky');
  });

  it('adds --workers and --retries', () => {
    const args = buildPlaywrightArgs({ workers: 4, retries: 2 });
    expect(args).toContain('--workers=4');
    expect(args).toContain('--retries=2');
  });

  it('adds spec file args at end', () => {
    const args = buildPlaywrightArgs({ specFiles: ['tests/admin/login.spec.ts'] });
    expect(args[args.length - 1]).toBe('tests/admin/login.spec.ts');
  });

  it('rejects spec files with path traversal', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['../../etc/passwd'] })).toThrow(/traversal/);
  });

  it('rejects spec files with absolute path', () => {
    expect(() => buildPlaywrightArgs({ specFiles: ['/etc/passwd'] })).toThrow();
  });
});
