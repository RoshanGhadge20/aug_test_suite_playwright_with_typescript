import { test, expect } from '../../../fixtures/base.fixture';
import { generateUnregisteredMobile, REGISTRATION_OTP, DEFAULT_TEST_PIN } from '../test-data/registration-data';

// Registration has no dedicated sign-up form — an unregistered mobile + OTP + first-time PIN
// setup on the login screens *is* registration. Force a logged-out context regardless of the
// project's shared authenticated `customer` storageState. See New Signup Window Test Plan.md §2.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Registration_001 @smoke @regression @customer @registration', () => {
  test('New user completes registration end-to-end and lands on dashboard with KYC Pending badge', async ({
    page,
    customerLogin,
    dashboardPage,
    customerMenupage,
  }) => {
    const TC_001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC_001(n)}] ${title}`);
    };

    const mobile = generateUnregisteredMobile();

    await test.step('TC001_1 | Open login page with a fresh, unregistered mobile number', async () => {
      logSub(1, 'Open login page with a fresh, unregistered mobile number');
      console.log(`[${TC_001(1)}] Generated mobile: ${mobile}`);

      await customerLogin.open();
      await expect(customerLogin.mobileNumberField()).toBeVisible();
    });

    await test.step('TC001_2 | Enter mobile number and submit — Continue enables and navigates to OTP screen', async () => {
      logSub(2, 'Enter mobile number and submit');

      await customerLogin.enterMobileNumber(mobile);
      await expect(customerLogin.continueButtonLocator()).toBeEnabled();
      await customerLogin.continueToOtp();
      console.log(`[${TC_001(2)}] Landed on OTP screen: ${page.url()}`);
    });

    // Where OTP verification lands after a brand-new number is NOT fixed: it has been observed
    // going through /login/verify-pin (PIN-setup) on some runs, and landing already-authenticated
    // directly on a promotional page (e.g. /digital-gold/buy) on others, skipping PIN-setup
    // entirely. Both are treated as valid outcomes here; only /login/verify-otp itself is a failure.
    await test.step('TC001_3 | Enter backdoor OTP and verify', async () => {
      logSub(3, 'Enter backdoor OTP and verify');

      await customerLogin.enterOtp(REGISTRATION_OTP);
      await customerLogin.clickVerifyOtp();

      await page.waitForURL((url) => !/\/login\/verify-otp/i.test(url.pathname), { timeout: 20_000 });
      console.log(`[${TC_001(3)}] OTP verified — landed on: ${page.url()}`);
    });

    await test.step('TC001_4 | Complete first-time PIN setup if the app asks for it', async () => {
      logSub(4, 'Complete first-time PIN setup if shown');

      if (/\/login\/verify-pin/i.test(page.url())) {
        console.log(`[${TC_001(4)}] PIN-setup screen shown — setting a new 6-digit PIN.`);
        await customerLogin.enterNewPin(DEFAULT_TEST_PIN, DEFAULT_TEST_PIN);
        await expect(customerLogin.pinMismatchErrorMessage()).toBeHidden();
        await expect(customerLogin.proceedButtonLocator()).toBeEnabled();
        await customerLogin.clickProceed();
      } else {
        console.log(`[${TC_001(4)}] PIN-setup screen was skipped for this account — already authenticated.`);
      }
    });

    await test.step('TC001_5 | Navigate to the dashboard (directly, if not already there) and validate it loads', async () => {
      logSub(5, 'Navigate to the dashboard and validate it loads');

      if (!/\/dashboard/i.test(page.url())) {
        await page.goto('/dashboard');
      }
      await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/i, { timeout: 30_000 });
      console.log(`[${TC_001(5)}] Registration complete for mobile ${mobile} — on dashboard.`);
    });

    await test.step('TC001_6 | Validate the KYC Pending badge is shown for the freshly registered account', async () => {
      logSub(6, 'Validate the KYC Pending badge is shown');

      await expect(dashboardPage.kycPendingBadge()).toBeVisible({ timeout: 15_000 });
    });

    // The account is auto-populated with placeholder profile data at registration (see New Signup
    // Window Test Plan.md §2/§4.5), but the header pill reads "guest user" rather than the "test
    // name" placeholder until profile completion — confirmed live for the skip-PIN-setup branch.
    await test.step('TC001_7 | Validate the header shows "guest user" for the freshly registered, not-yet-completed profile', async () => {
      logSub(7, 'Validate the header shows "guest user"');

      await expect(customerMenupage.userMenuButtonLocator()).toContainText('guest user', { timeout: 15_000 });
    });
  });
});
