import { test, expect } from '../../../fixtures/base.fixture';
import { generateUnregisteredMobile, REGISTRATION_OTP, DEFAULT_TEST_PIN } from '../test-data/registration-data';
import { logValidation } from '../helpers/customer-alt-user.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Kyc_003 @regression @customer @kyc', () => {
  test.beforeEach(async ({ customerLogin, customerMenupage, page, kycDigiKycPage }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);

    // Navigate via the dashboard user menu (not KycDigiKycPage.open()'s direct goto) so browser
    // history matches how a real user reaches this screen — Dashboard -> Kyc menu item ->
    // /kyc/digi-kyc — which is what the back-navigation test below needs to reproduce the
    // originally-documented /kyc -> /kyc/digi-kyc history relationship. A direct goto skips that
    // intermediate history entry, so goBack() would land on /dashboard instead (confirmed live).
    //
    // This navigation can also hit the same post-registration "grace window" bounce-back as
    // /login and /kyc/digi-kyc's own direct goto (see New Signup Window Test Plan.md §26 item 14)
    // — retry a few times rather than trusting a single click.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await customerMenupage.openKyc();
      await page.waitForURL(/\/kyc\/digi-kyc/i, { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(1_500);
      if (/\/kyc\/digi-kyc/i.test(page.url())) break;
      await page.goto('/dashboard');
    }
    await expect(page).toHaveURL(/\/kyc\/digi-kyc/i, { timeout: 5_000 });
    await expect(kycDigiKycPage.panNumberField()).toBeVisible();
  });

  test('TC_Kyc_003_001 | Reloading the KYC form keeps the session intact', async ({ page, kycDigiKycPage }) => {
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/kyc\/digi-kyc/i);
    logValidation('TC_Kyc_003 URL after reload', page.url(), '/kyc/digi-kyc');

    await expect(kycDigiKycPage.panNumberField()).toBeVisible();
    logValidation('TC_Kyc_003 PAN field visible after reload', await kycDigiKycPage.panNumberField().isVisible(), true);
  });

  test('TC_Kyc_003_002 | Browser back-navigation from the KYC form keeps the session intact', async ({ page, kycDigiKycPage }) => {
    await page.goBack();

    // `/kyc` resolves to the same content as `/kyc/digi-kyc` — no separate hub page exists.
    await expect(page).toHaveURL(/\/kyc(?:\/digi-kyc)?\/?$/i);
    logValidation('TC_Kyc_003 URL after back navigation', page.url(), '/kyc or /kyc/digi-kyc');

    await expect(kycDigiKycPage.panNumberField()).toBeVisible();
    logValidation('TC_Kyc_003 PAN field visible after back navigation', await kycDigiKycPage.panNumberField().isVisible(), true);
  });
});
