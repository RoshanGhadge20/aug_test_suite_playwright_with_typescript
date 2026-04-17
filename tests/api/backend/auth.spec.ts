import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test.describe('backend auth @smoke @api', () => {
  test('authenticated /api/v1/me returns current user', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/me');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('rejects missing bearer', async ({ request }) => {
    const res = await request.get('/api/v1/me');
    expect(res.status()).toBe(401);
  });
});
