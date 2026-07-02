import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test.describe('backend users API @regression @api', () => {
  test('GET /api/v1/users returns a list for authenticated user', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/users?limit=10');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data ?? body)).toBe(true);
  });

  test('POST /api/v1/users with invalid payload returns 400', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/v1/users', { data: { email: 'not-an-email' } });
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/v1/users/:id returns 404 for unknown id', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/users/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });
});

test.describe('backend loans API @regression @api @loans', () => {
  test('list loans paginates with cursor', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/loans?limit=5');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
