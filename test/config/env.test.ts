import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../config/env';

function buildEnvBlock(prefix: string): Record<string, string> {
  return {
    [`${prefix}_BASE_URL_ADMIN`]: `http://${prefix.toLowerCase()}-admin`,
    [`${prefix}_BASE_URL_CUSTOMER`]: `http://${prefix.toLowerCase()}-cust`,
    [`${prefix}_BASE_URL_BUSINESS`]: `http://${prefix.toLowerCase()}-biz`,
    [`${prefix}_BASE_URL_NEW_ADMIN`]: `http://${prefix.toLowerCase()}-nad`,
    [`${prefix}_BASE_URL_BACKEND`]: `http://${prefix.toLowerCase()}-back`,
    [`${prefix}_BASE_URL_EMI`]: `http://${prefix.toLowerCase()}-emi`,
    [`${prefix}_ADMIN_USER_EMAIL`]: 'a@x', [`${prefix}_ADMIN_USER_PASSWORD`]: 'p',
    [`${prefix}_CUSTOMER_USER_EMAIL`]: 'c@x', [`${prefix}_CUSTOMER_USER_PASSWORD`]: 'p',
    [`${prefix}_BUSINESS_USER_EMAIL`]: 'b@x', [`${prefix}_BUSINESS_USER_PASSWORD`]: 'p',
    [`${prefix}_NEW_ADMIN_USER_EMAIL`]: 'n@x', [`${prefix}_NEW_ADMIN_USER_PASSWORD`]: 'p',
    [`${prefix}_BACKEND_USER_EMAIL`]: 'bk@x', [`${prefix}_BACKEND_USER_PASSWORD`]: 'p',
    [`${prefix}_EMI_USER_EMAIL`]: 'em@x', [`${prefix}_EMI_USER_PASSWORD`]: 'p',
  };
}

const valid = {
  ...buildEnvBlock('TEST'),
  ...buildEnvBlock('UAT'),
  DEFAULT_ENV: 'test',
  HEADLESS: 'true',
  API_PORT: '3000',
  API_KEY: 'secretXYZ',
  LOG_LEVEL: 'info',
};

describe('loadEnv (multi-env)', () => {
  it('parses both environment blocks', () => {
    const cfg = loadEnv(valid);
    expect(cfg.TEST_BASE_URL_ADMIN).toBe('http://test-admin');
    expect(cfg.UAT_BASE_URL_ADMIN).toBe('http://uat-admin');
    expect(cfg.DEFAULT_ENV).toBe('test');
  });

  it('rejects invalid DEFAULT_ENV', () => {
    expect(() => loadEnv({ ...valid, DEFAULT_ENV: 'mars' })).toThrow();
  });

  it('rejects production as DEFAULT_ENV', () => {
    expect(() => loadEnv({ ...valid, DEFAULT_ENV: 'production' })).toThrow();
  });

  it('fails when a UAT url is missing', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.UAT_BASE_URL_ADMIN;
    expect(() => loadEnv(missing)).toThrow(/UAT_BASE_URL_ADMIN/);
  });
});
