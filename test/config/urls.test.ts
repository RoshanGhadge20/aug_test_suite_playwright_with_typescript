import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function setEnv(prefix: string) {
  for (const key of [
    'BASE_URL_ADMIN', 'BASE_URL_CUSTOMER', 'BASE_URL_BUSINESS', 'BASE_URL_NEW_ADMIN',
    'BASE_URL_BACKEND', 'BASE_URL_EMI',
  ]) process.env[`${prefix}_${key}`] = `http://${prefix.toLowerCase()}-${key.toLowerCase()}`;
  for (const who of ['ADMIN', 'CUSTOMER', 'BUSINESS', 'NEW_ADMIN', 'BACKEND', 'EMI']) {
    process.env[`${prefix}_${who}_USER_EMAIL`] = `${prefix.toLowerCase()}-${who.toLowerCase()}@x`;
    process.env[`${prefix}_${who}_USER_PASSWORD`] = 'p';
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

  it('apiAuthConfig returns env-specific credentials', async () => {
    const mod = await import('../../config/urls');
    expect(mod.apiAuthConfig('api-backend', 'uat').email).toBe('uat-backend@x');
    expect(mod.apiAuthConfig('api-backend', 'test').email).toBe('test-backend@x');
  });
});
