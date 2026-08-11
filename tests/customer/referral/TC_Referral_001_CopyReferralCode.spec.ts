import { test, expect } from '../../../fixtures/base.fixture';
import { existingKycVerifiedCustomerCreds } from '../test-data/registration-data';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Referral_001 @regression @customer @referral', () => {
  test('Copying the referral code from My Profile shows a copy-success message', async ({
    page,
    customerLogin,
    customerMenupage,
    myProfilePage,
  }) => {
    const { mobile, pin } = existingKycVerifiedCustomerCreds();

    await test.step('TC_Referral_001_1 | Log in with the shared customer account', async () => {
      await customerLogin.login(mobile, pin);
      await expect(page).toHaveURL(/\/dashboard(?:\/|$|\?)/i);
    });

    await test.step('TC_Referral_001_2 | Navigate to My Profile', async () => {
      await customerMenupage.openProfile();
      await page.waitForURL(/\/my-profile/i, { timeout: 15_000 });
    });

    await test.step('TC_Referral_001_3 | Scroll up to reveal the referral code section', async () => {
      await myProfilePage.scrollToTop();
    });

    await test.step('TC_Referral_001_4 | Copy the referral code', async () => {
      const referralCode = await myProfilePage.getReferralCode();
      console.log(`[TC_Referral_001_4] Referral code: ${referralCode}`);
      await myProfilePage.copyReferralCode();
    });

    await test.step('TC_Referral_001_5 | Validate the copy-success message is shown', async () => {
      await expect(myProfilePage.referralCopySuccessMessageLocator()).toBeVisible({ timeout: 10_000 });
    });
  });
});
