import { test, expect } from '../../fixtures/base.fixture';

test.describe('admin @smoke', () => {
  test('lands on dashboard after storageState is loaded', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/dashboard|home/i, { timeout: 15_000 });
  });

  test('header shows authenticated user menu', async ({ page }) => {
    await page.goto('/');
    const userMenu = page.getByRole('button', { name: /profile|account|logout/i });
    await expect(userMenu.first()).toBeVisible();
  });
});
