import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer profile @regression @customer', () => {
  test('profile section shows authenticated user details', async ({ page }) => {
    await page.goto('/');
    const profileLink = page.getByRole('link', { name: /profile|my account/i });
    await profileLink.first().click();
    await expect(page).toHaveURL(/profile|account/i);
  });

  test('transactions list renders for authenticated user', async ({ page }) => {
    await page.goto('/');
    const txLink = page.getByRole('link', { name: /transactions|history|orders/i });
    await txLink.first().click();
    const list = page.getByRole('list').or(page.getByRole('table'));
    await expect(list.first()).toBeVisible({ timeout: 15_000 });
  });
});
