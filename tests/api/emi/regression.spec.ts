import { apiTest as test, expect } from '../../../fixtures/api.fixture';

test.describe('emi schedule API @regression @api @emi', () => {
  test('GET /api/v1/schedules returns list for authenticated user', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/schedules');
    expect(res.ok()).toBeTruthy();
  });

  test('rejects invalid loan id', async ({ authedRequest }) => {
    const res = await authedRequest.get('/api/v1/schedules/not-a-uuid');
    expect([400, 404]).toContain(res.status());
  });
});
