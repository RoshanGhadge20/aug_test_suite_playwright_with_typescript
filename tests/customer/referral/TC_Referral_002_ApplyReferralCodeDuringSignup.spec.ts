import { test, expect } from '../../../fixtures/base.fixture';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
  existingKycVerifiedCustomerCreds,
} from '../test-data/registration-data';
import { refreshCustomerStorageState } from '../helpers/customer-session.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Referral_002 @regression @customer @referral', () => {
  // Logs in as the main customer, which kills the shared auth-setup session — re-save it.
  test.afterEach(async ({ browser }) => refreshCustomerStorageState(browser));

  test('A new signup applying the referral code increments the referrer\'s total referral count', async ({
    page,
    customerLogin,
    myProfilePage,
  }) => {
    const { mobile: defaultMobile, pin: defaultPin } = existingKycVerifiedCustomerCreds();
    let referralCode = '';
    let oldReferralCount = 0;

    await test.step('TC_Referral_002_1 | Log in as the default customer and read the old referral count + code', async () => {
      // navigator.clipboard.writeText()/readText() require this permission to be granted explicitly in Chromium.
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await customerLogin.login(defaultMobile, defaultPin);
      await myProfilePage.open();
      await myProfilePage.scrollToTop();

      oldReferralCount = await myProfilePage.getTotalReferralCount();
      console.log(`[TC_Referral_002_1] Old total referral count: ${oldReferralCount}`);

      await myProfilePage.copyReferralCode();
      referralCode = await page.evaluate(() => (navigator as any).clipboard.readText());
      console.log(`[TC_Referral_002_1] Referral code to apply: ${referralCode}`);
      expect(referralCode.length).toBeGreaterThan(0);
    });

    await test.step('TC_Referral_002_2 | Log out and register a new customer with a unique mobile number', async () => {
      await customerLogin.logoutAndReturnToMobileEntry();

      const newMobile = generateUnregisteredMobile();
      console.log(`[TC_Referral_002_2] New unique mobile: ${newMobile}`);

      await customerLogin.enterMobileNumber(newMobile);
      await customerLogin.continueToOtp();
    });

    await test.step('TC_Referral_002_3 | Open the referral-code entry and apply the copied code', async () => {
      await customerLogin.openReferralCodeEntry();
      await customerLogin.enterReferralCode(referralCode);

      await expect(customerLogin.referralCodeAppliedMessageLocator()).toBeVisible({ timeout: 10_000 });
      console.log('[TC_Referral_002_3] Referral code applied message shown.');
    });

    await test.step('TC_Referral_002_4 | Verify OTP and confirm the referral-success modal, then proceed', async () => {
      await customerLogin.enterOtp(REGISTRATION_OTP);
      await customerLogin.clickVerifyOtp();

      await expect(customerLogin.referralSuccessModalHeadingLocator()).toBeVisible({ timeout: 15_000 });
      console.log('[TC_Referral_002_4] Referral success modal shown.');

      await customerLogin.proceedButtonLocator().click();
    });

    await test.step('TC_Referral_002_5 | Validate landing on the digital-gold buy page', async () => {
      await page.waitForURL(/\/digital-gold\/buy/i, { timeout: 20_000 });
      await expect(page).toHaveURL(/\/digital-gold\/buy/i);
      console.log(`[TC_Referral_002_5] Landed on: ${page.url()}`);
    });

    await test.step('TC_Referral_002_6 | Log back in as the default customer and validate the referral count incremented', async () => {
      await customerLogin.logoutAndReturnToMobileEntry();
      await customerLogin.loginWithExistingPin(defaultMobile, defaultPin);

      await myProfilePage.open();
      await myProfilePage.scrollToTop();

      const newReferralCount = await myProfilePage.getTotalReferralCount();
      console.log(`[TC_Referral_002_6] New total referral count: ${newReferralCount} (old was ${oldReferralCount})`);
      expect(newReferralCount).toBe(oldReferralCount + 1);
    });
  });
});
