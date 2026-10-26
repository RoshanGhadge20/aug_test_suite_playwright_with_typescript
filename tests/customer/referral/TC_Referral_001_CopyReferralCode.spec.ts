import { test, expect } from '../../../fixtures/base.fixture';
import { existingKycVerifiedCustomerCreds } from '../test-data/registration-data';
import { refreshCustomerStorageState } from '../helpers/customer-session.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Referral_001 @regression @customer @referral', () => {
  // Logs in as the main customer, which kills the shared auth-setup session — re-save it.
  test.afterEach(async ({ browser }) => refreshCustomerStorageState(browser));

  test('Copying the referral code from My Profile shows a copy-success message', async ({
    page,
    customerLogin,
    myProfilePage,
  }) => {
    const { mobile, pin } = existingKycVerifiedCustomerCreds();

    await test.step('TC_Referral_001_1 | Log in with the shared customer account', async () => {
      await customerLogin.login(mobile, pin);
      await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/i);
    });

    await test.step('TC_Referral_001_2 | Navigate to My Profile', async () => {
      await myProfilePage.open();
    });

    await test.step('TC_Referral_001_3 | Scroll up to reveal the referral code section', async () => {
      await myProfilePage.scrollToTop();
    });

    await test.step('TC_Referral_001_4 | Copy the referral code', async () => {
      // navigator.clipboard.writeText() requires this permission to be granted explicitly in Chromium.
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      const referralCode = await myProfilePage.getReferralCode();
      console.log(`[TC_Referral_001_4] Referral code: ${referralCode}`);
      await myProfilePage.copyReferralCode();
    });

    await test.step('TC_Referral_001_5 | Validate the copy-success message is shown', async () => {
      const successMessage = myProfilePage.referralCopySuccessMessageLocator();
      await expect(successMessage).toBeVisible({ timeout: 10_000 });
      console.log(`[TC_Referral_001_5] Success message: ${await successMessage.textContent()}`);
    });
  });
});
