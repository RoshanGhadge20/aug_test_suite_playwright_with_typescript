import { test, expect } from '../../../fixtures/base.fixture';
import { logActualExpected } from '../../../utils/test/test-case-logger';

/**
 * Send Shagun — entry points and route guards. No data is created.
 * Two entry points confirmed live (UAT 2026-10-14):
 *   PRODUCTS mega-menu → "Send Shagun"  → /digi-gold-transfer/send/occasion
 *   Profile dropdown   → "Digital Shagun" → /digi-gold-transfer/my-shagun
 */
const urlPath = (url: string) => {
  const u = new URL(url);
  return `${u.pathname}${u.search}`;
};

test.describe('TC_SendShagun_Navigation @smoke @regression @customer @shagun', () => {
  test('TC_SHAGUN_001 | Products menu → Send Shagun opens the Occasion step', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_001';
    await page.goto('/dashboard');
    await sendShagunPage.openViaProductsMenu();

    await expect(page).toHaveURL(/\/digi-gold-transfer\/send\/occasion$/);
    logActualExpected(TC, 'URL', urlPath(page.url()), '/digi-gold-transfer/send/occasion');

    const heading = await sendShagunPage.currentStepHeading();
    logActualExpected(TC, 'Step heading', heading, 'What is the special day?');
    expect(heading).toBe('What is the special day?');

    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
    for (const step of ['Create Your Gift', 'Share Your Gift', 'They Receive the Gold']) {
      await expect(page.getByText(step, { exact: true })).toBeVisible();
      logActualExpected(TC, 'How it works step visible', step, step);
    }
  });

  test('TC_SHAGUN_002 | Profile menu → Digital Shagun opens My Shagun dashboard', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_002';
    await page.goto('/dashboard');
    await sendShagunPage.openMyShagunViaProfileMenu();

    await expect(page).toHaveURL(/\/digi-gold-transfer\/my-shagun$/);
    logActualExpected(TC, 'URL', urlPath(page.url()), '/digi-gold-transfer/my-shagun');
    await expect(sendShagunPage.giftedTab()).toBeVisible();
    await expect(sendShagunPage.receivedTab()).toBeVisible();
    logActualExpected(TC, 'Tabs visible', 'GIFTED SHAGUN, RECEIVED SHAGUN', 'GIFTED SHAGUN, RECEIVED SHAGUN');
  });

  test('TC_SHAGUN_003 | /digi-gold-transfer redirects to the Occasion step', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_003';
    await page.goto('/digi-gold-transfer');
    await sendShagunPage.waitForOccasionStep();
    await expect(page).toHaveURL(/\/digi-gold-transfer\/send\/occasion$/);
    logActualExpected(TC, 'Redirected URL', urlPath(page.url()), '/digi-gold-transfer/send/occasion');
  });

  test('TC_SHAGUN_004 | Deep-linking to a mid-wizard step without state returns to Occasion', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_004';
    for (const step of ['amount', 'review']) {
      await page.goto(`/digi-gold-transfer/send/${step}`);
      await sendShagunPage.waitForOccasionStep();
      await expect(page, `deep link to /send/${step}`).toHaveURL(/\/digi-gold-transfer\/send\/occasion$/);
      logActualExpected(TC, `Deep link /send/${step} → URL`, urlPath(page.url()), '/digi-gold-transfer/send/occasion');
    }
  });

  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC_SHAGUN_005 | Logged-out user is sent to login with redirectTo', async ({ page }) => {
      const TC = 'TC_SHAGUN_005';
      await page.goto('/digi-gold-transfer/send/occasion');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdigi-gold-transfer%2Fsend%2Foccasion/, { timeout: 30_000 });
      logActualExpected(TC, 'Redirected URL', urlPath(page.url()), '/login?redirectTo=%2Fdigi-gold-transfer%2Fsend%2Foccasion');
    });
  });
});
