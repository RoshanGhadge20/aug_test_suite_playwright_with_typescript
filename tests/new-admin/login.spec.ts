import { test, expect } from '../../fixtures/base.fixture';

test.describe('new-admin @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
  });
});
