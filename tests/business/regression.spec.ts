import { test, expect } from '../../fixtures/base.fixture';

test.describe('business agent workflow @regression @business', () => {
  test('dashboard surfaces agent metrics', async ({ page }) => {
    await page.goto('/');
    const metricsRegion = page.getByRole('region', { name: /metrics|stats|summary/i });
    await expect(metricsRegion.first()).toBeVisible();
  });

  test('can open lead creation form', async ({ page }) => {
    await page.goto('/');
    const newLeadBtn = page.getByRole('button', { name: /new lead|create lead|add lead/i });
    await newLeadBtn.first().click();
    const form = page.getByRole('form').or(page.getByRole('dialog'));
    await expect(form.first()).toBeVisible();
  });
});
