import { test, expect } from '@playwright/test';

test.describe('lgd health @smoke @api', () => {
  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
  });
});
