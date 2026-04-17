import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test.describe('lgd scoring API @regression @api @lgd', () => {
  test('GET /api/v1/scores returns list', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/scores');
    expect(res.ok()).toBeTruthy();
  });

  test('POST /api/v1/scores rejects missing required fields', async ({ authedRequest }) => {
    const res = await authedRequest.post('/api/v1/scores', { data: {} });
    expect([400, 422]).toContain(res.status());
  });
});
