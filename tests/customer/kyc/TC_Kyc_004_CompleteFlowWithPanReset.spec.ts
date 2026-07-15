import { test, expect } from '../../../fixtures/base.fixture';
import {
  ALREADY_REGISTERED_PAN,
  ALREADY_REGISTERED_PAN_DOB,
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
} from '../test-data/registration-data';
import { removeEkycRecord } from '../../../utils/api/ekyc-api';
import { logValidation } from '../helpers/customer-alt-user.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Kyc_004 @regression @customer @kyc', () => {
  test('TC_Kyc_004 | Reset e-KYC via API then complete the KYC form through KARZA verification', async ({
    customerLogin,
    kycDigiKycPage,
    page,
  }) => {
    console.log('[TC_Kyc_004] Starting e-KYC PAN reset...');
    await removeEkycRecord({
      identityProofNumber: null,
      panCardNumber: ALREADY_REGISTERED_PAN,
    });
    console.log('[TC_Kyc_004] e-KYC PAN reset completed.');

    console.log('[TC_Kyc_004] Starting KYC UI flow...');
    // The reset targets the shared account's PAN record; the KYC flow itself runs on a fresh,
    // randomly-registered customer so the form is always reachable/editable regardless of the
    // reset's effect on the shared account.
    const mobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);
    await kycDigiKycPage.open();

    await kycDigiKycPage.enterPan(ALREADY_REGISTERED_PAN);
    await kycDigiKycPage.setDateOfBirth(ALREADY_REGISTERED_PAN_DOB);

    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_004 KARZA modal heading visible', await kycDigiKycPage.karzaModalHeadingLocator().isVisible(), true);

    // The API reset above freed ALREADY_REGISTERED_PAN's e-KYC record, so clicking "Proceed for
    // PAN Verification" here runs through KARZA's (mocked, in UAT) verification instead of
    // short-circuiting with "PAN Card already exists!" — confirmed live 2026-07-08. See
    // KycDigiKycPage.clickProceedForPanVerification().
    await kycDigiKycPage.clickProceedForPanVerification();
    await expect(kycDigiKycPage.verifiedModalHeadingLocator()).toBeVisible({ timeout: 20_000 });
    logValidation(
      'TC_Kyc_004 "All Set! Verified!" KARZA success modal visible',
      await kycDigiKycPage.verifiedModalHeadingLocator().isVisible(),
      true,
    );

    await kycDigiKycPage.acknowledgeVerifiedModal();
    await expect(page).toHaveURL(/\/digital-gold\/buy/i, { timeout: 10_000 });
    logValidation('TC_Kyc_004 redirected to Buy Digital Gold after KYC completion', page.url(), '/digital-gold/buy');

    console.log('[TC_Kyc_004] KYC UI flow completed.');
  });
});
