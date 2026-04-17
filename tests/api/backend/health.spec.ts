import { test, expect } from '@playwright/test';

test.describe('backend health @smoke @api', () => {
  test('GET / returns 2xx', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({ status: expect.any(String) }));
  });
});
