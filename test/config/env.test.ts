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
    [`${prefix}_ADMIN_USER_MOBILE`]: '9000000001', [`${prefix}_ADMIN_USER_OTP`]: '1234',
    [`${prefix}_CUSTOMER_USER_MOBILE`]: '9000000002', [`${prefix}_CUSTOMER_USER_OTP`]: '1234',
    [`${prefix}_BUSINESS_USER_MOBILE`]: '9000000003', [`${prefix}_BUSINESS_USER_OTP`]: '1234',
    [`${prefix}_NEW_ADMIN_USER_MOBILE`]: '9000000004', [`${prefix}_NEW_ADMIN_USER_OTP`]: '1234',
    [`${prefix}_BACKEND_USER_MOBILE`]: '9000000005', [`${prefix}_BACKEND_USER_OTP`]: '1234',
    [`${prefix}_EMI_USER_MOBILE`]: '9000000006', [`${prefix}_EMI_USER_OTP`]: '1234',
    [`${prefix}_ADMIN_APPRAISER_MOBILE`]: '9000000011',
    [`${prefix}_ADMIN_BM_MOBILE`]: '9000000012',
    [`${prefix}_ADMIN_OPS_MOBILE`]: '9000000013',
    [`${prefix}_ADMIN_PARTNER_MOBILE`]: '9000000014',
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
    expect(cfg.TEST_ADMIN_USER_MOBILE).toBe('9000000001');
    expect(cfg.TEST_ADMIN_USER_OTP).toBe('1234');
    expect(cfg.UAT_BASE_URL_ADMIN).toBe('http://uat-admin');
    expect(cfg.DEFAULT_ENV).toBe('test');
  });

  it('rejects invalid DEFAULT_ENV', () => {
    expect(() => loadEnv({ ...valid, DEFAULT_ENV: 'mars' })).toThrow();
  });

  it('rejects production as DEFAULT_ENV', () => {
    expect(() => loadEnv({ ...valid, DEFAULT_ENV: 'production' })).toThrow();
  });

  // Only the targeted env's block is required (the other env's block is optional).
  it('fails when a UAT url is missing and UAT is the targeted env', () => {
    const missing = { ...valid, DEFAULT_ENV: 'uat' } as Record<string, string>;
    delete missing.UAT_BASE_URL_ADMIN;
    expect(() => loadEnv(missing)).toThrow(/UAT_BASE_URL_ADMIN/);
  });

  it('fails when a TEST role mobile is missing and TEST is the targeted env', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.TEST_ADMIN_APPRAISER_MOBILE;
    expect(() => loadEnv(missing)).toThrow(/TEST_ADMIN_APPRAISER_MOBILE/);
  });

  it('does not require the inactive env block', () => {
    const missing = { ...valid } as Record<string, string>;
    delete missing.UAT_BASE_URL_ADMIN;
    expect(() => loadEnv(missing)).not.toThrow();
  });
});
