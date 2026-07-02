import { describe, it, expect } from 'vitest';
import { createLogger } from '../../utils/logger/logger';

describe('createLogger', () => {
  it('creates a logger with info/error/warn/debug methods', () => {
    const logger = createLogger({ level: 'info', name: 'test' });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('masks sensitive fields in logged metadata', () => {
    const logger = createLogger({ level: 'debug', name: 'test' });
    const masked = logger.maskSensitive({ email: 'a@b.com', password: 'pw', apiKey: 'x', nested: { token: 't' } });
    expect(masked.email).toBe('a@b.com');
    expect(masked.password).toBe('***');
    expect(masked.apiKey).toBe('***');
    expect((masked.nested as { token: string }).token).toBe('***');
  });
});
