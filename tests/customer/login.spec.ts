import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer @smoke', () => {
  test('lands on account/home after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home|account/i, { timeout: 15_000 });
  });
});
