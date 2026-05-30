import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function setEnv(prefix: string) {
  for (const key of [
    'BASE_URL_ADMIN', 'BASE_URL_CUSTOMER', 'BASE_URL_BUSINESS', 'BASE_URL_NEW_ADMIN',
    'BASE_URL_BACKEND', 'BASE_URL_EMI',
  ]) process.env[`${prefix}_${key}`] = `http://${prefix.toLowerCase()}-${key.toLowerCase()}`;
  for (const who of ['ADMIN', 'CUSTOMER', 'BUSINESS', 'NEW_ADMIN', 'BACKEND', 'EMI']) {
    process.env[`${prefix}_${who}_USER_MOBILE`] = `${prefix.toLowerCase()}-${who.toLowerCase()}-mobile`;
    process.env[`${prefix}_${who}_USER_OTP`] = '1234';
  }
  for (const role of ['APPRAISER', 'BM', 'OPS', 'PARTNER']) {
    process.env[`${prefix}_ADMIN_${role}_MOBILE`] = '9000000001';
    process.env[`${prefix}_ADMIN_${role}_OTP`] = '1234';
  }
}

beforeAll(() => {
  setEnv('TEST'); setEnv('UAT');
  process.env.DEFAULT_ENV = 'test';
  process.env.API_KEY = 'secretXYZ';
});

afterAll(() => {
  for (const k of Object.keys(process.env)) if (!(k in ORIGINAL_ENV)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('urls (env-aware)', () => {
  it('panelUrl returns the test URL when TARGET_ENV=test', async () => {
    process.env.TARGET_ENV = 'test';
    const mod = await import('../../config/urls');
    expect(mod.panelUrl('admin')).toBe('http://test-base_url_admin');
  });

  it('panelUrl switches on explicit env param', async () => {
    const mod = await import('../../config/urls');
    expect(mod.panelUrl('admin', 'uat')).toBe('http://uat-base_url_admin');
  });

  it('panelCreds returns mobile+otp per env', async () => {
    const mod = await import('../../config/urls');
    expect(mod.panelCreds('admin', 'test')).toEqual({ mobile: 'test-admin-mobile', otp: '1234' });
    expect(mod.panelCreds('admin', 'uat')).toEqual({ mobile: 'uat-admin-mobile', otp: '1234' });
  });

  it('apiAuthConfig returns env-specific credentials + OTP endpoints', async () => {
    const mod = await import('../../config/urls');
    const cfg = mod.apiAuthConfig('api-backend', 'uat');
    expect(cfg.mobile).toBe('uat-backend-mobile');
    expect(cfg.otp).toBe('1234');
    expect(cfg.sendOtpPath).toBe('/api/v1/auth/send-otp');
    expect(cfg.verifyOtpPath).toBe('/api/v1/auth/verify-otp');
  });

  it('digitalGoldRatesUrl uses api-backend base for active env', async () => {
    process.env.TARGET_ENV = 'test';
    const mod = await import('../../config/urls');
    expect(mod.digitalGoldRatesUrl('test')).toBe('http://test-base_url_backend/api/digital-gold/rates');
    expect(mod.digitalGoldRatesUrl('uat')).toBe('http://uat-base_url_backend/api/digital-gold/rates');
  });

  it('adminRoleCreds returns mobile+otp for a role/env', async () => {
    const mod = await import('../../config/urls');
    const c = mod.adminRoleCreds('ops', 'test');
    expect(c).toHaveProperty('mobile');
    expect(c).toHaveProperty('otp');
  });
});
