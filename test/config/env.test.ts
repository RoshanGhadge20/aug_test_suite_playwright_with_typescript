import { describe, it, expect, beforeEach } from 'vitest';
import { loadEnv } from '../../config/env';

describe('loadEnv', () => {
  const valid = {
    BASE_URL_ADMIN: 'http://a', BASE_URL_CUSTOMER: 'http://c',
    BASE_URL_BUSINESS: 'http://b', BASE_URL_NEW_ADMIN: 'http://n',
    ADMIN_USER_EMAIL: 'a@x', ADMIN_USER_PASSWORD: 'p',
    CUSTOMER_USER_EMAIL: 'c@x', CUSTOMER_USER_PASSWORD: 'p',
    BUSINESS_USER_EMAIL: 'b@x', BUSINESS_USER_PASSWORD: 'p',
    NEW_ADMIN_USER_EMAIL: 'n@x', NEW_ADMIN_USER_PASSWORD: 'p',
    ENV: 'dev', HEADLESS: 'true',
    API_PORT: '3000', API_KEY: 'secretXYZ', LOG_LEVEL: 'info',
  };

  it('parses a valid env object', () => {
    const result = loadEnv(valid);
    expect(result.BASE_URL_ADMIN).toBe('http://a');
    expect(result.API_PORT).toBe(3000);
    expect(result.HEADLESS).toBe(true);
  });

  it('throws when a required variable is missing', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.API_KEY;
    expect(() => loadEnv(missing)).toThrow(/API_KEY/);
  });

  it('rejects invalid ENV value', () => {
    expect(() => loadEnv({ ...valid, ENV: 'mars' })).toThrow();
  });
});
