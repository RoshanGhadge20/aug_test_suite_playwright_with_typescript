import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer @smoke', () => {
  test('lands on account/home after storageState is loaded', async ({ page }) => {
   // await page.goto('/');
//console.log(await page.context().cookies());
    await page.goto('/dashboard');
    // Avoid `networkidle` here — dashboards usually keep requests open (analytics, APIs, websockets),
    // so Playwright may wait far longer than the UI needs. Wait for the UI you care about instead.
    const withdrawBtn = page.getByRole('button', { name: /^withdraw$/i });
    await expect(withdrawBtn).toBeVisible({ timeout: 20000 });
    await withdrawBtn.click();
  });
});
