import { test, expect } from '../../fixtures/base.fixture';

test.describe('new-admin settings @regression @new-admin', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/');
    const settingsLink = page.getByRole('link', { name: /settings|configuration/i });
    await settingsLink.first().click();
    await expect(page).toHaveURL(/settings|config/i);
  });

  test('role management is reachable from settings', async ({ page }) => {
    await page.goto('/settings');
    const rolesLink = page.getByRole('link', { name: /roles|permissions/i });
    await expect(rolesLink.first()).toBeVisible();
  });
});
