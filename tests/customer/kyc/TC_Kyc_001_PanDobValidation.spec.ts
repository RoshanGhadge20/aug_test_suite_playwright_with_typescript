import { test, expect } from '../../../fixtures/base.fixture';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
  INVALID_FORMAT_PAN,
  generateValidFormatPan,
  adultDobYearsAgo,
} from '../test-data/registration-data';
import { logValidation } from '../helpers/customer-alt-user.helpers';
import { TestDataFactory } from '../../../utils/data/test-data.factory';

// KYC requires a live logged-in session. Register a fresh account per run rather than reuse the
// shared `customer` storageState — that account may already be KYC-verified from other suites,
// which would show a different screen than the "KYC Pending" state documented in the test plan.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Kyc_001 @regression @customer @kyc', () => {
  test.beforeEach(async ({ customerLogin, kycDigiKycPage }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);
    await kycDigiKycPage.open();
  });

  test('TC_Kyc_001_001 | Blank PAN and DOB submit shows both required-field errors', async ({ kycDigiKycPage }) => {
    // Verify now carries a real `disabled` attribute until the whole form is valid (confirmed
    // live 2026-09-01), so it can no longer be clicked to force validation display the way
    // New Signup Window Test Plan.md §4.6 originally documented — blur each field instead;
    // required errors render on blur independent of Verify's state.
    await kycDigiKycPage.clearPan();
    await kycDigiKycPage.clearDob();
    await kycDigiKycPage.blurActiveField();

    await expect(kycDigiKycPage.panRequiredErrorLocator()).toBeVisible();
    logValidation('TC_Kyc_001 PAN required error visible', await kycDigiKycPage.panRequiredErrorLocator().isVisible(), true);

    // The DOB field has no dedicated "required" message (confirmed live 2026-09-01, and
    // reconfirmed manually) — a blank DOB fails the age validator instead, surfacing "Please
    // enter an age of 18 years or above". `dobRequiredErrorLocator()` points at that message.
    await expect(kycDigiKycPage.dobRequiredErrorLocator()).toBeVisible();
    logValidation('TC_Kyc_001 DOB age/required error visible', await kycDigiKycPage.dobRequiredErrorLocator().isVisible(), true);
  });

  test('TC_Kyc_001_002 | Invalid PAN format shows the format error', async ({ kycDigiKycPage }) => {
    // Same as TC_Kyc_001_001: Verify stays disabled with an invalid PAN, so blur the field
    // directly rather than routing through the (unclickable) Verify button.
    await kycDigiKycPage.enterPan(INVALID_FORMAT_PAN);
    await kycDigiKycPage.blurActiveField();

    await expect(kycDigiKycPage.panInvalidErrorLocator()).toBeVisible();
    logValidation('TC_Kyc_001 PAN invalid-format error visible', await kycDigiKycPage.panInvalidErrorLocator().isVisible(), true);
  });

  test('TC_Kyc_001_003 | Valid-format PAN and a valid adult DOB clear all errors and enable Verify', async ({ kycDigiKycPage }) => {
    await kycDigiKycPage.enterPan(generateValidFormatPan());
    await kycDigiKycPage.setDateOfBirth(adultDobYearsAgo(25));
    // Confirmed live 2026-09-01: Email is also a required field on this form (State/City already
    // come pre-filled with valid defaults, so they don't need explicit selection) — Verify stays
    // disabled without it, same finding TC_Kyc_002 already accounts for.
    await kycDigiKycPage.enterEmail(TestDataFactory.email('kyc001-003'));

    await expect(kycDigiKycPage.panRequiredErrorLocator()).toBeHidden();
    logValidation('TC_Kyc_001 PAN required error hidden', await kycDigiKycPage.panRequiredErrorLocator().isHidden(), true);

    await expect(kycDigiKycPage.dobRequiredErrorLocator()).toBeHidden();
    logValidation('TC_Kyc_001 DOB required error hidden', await kycDigiKycPage.dobRequiredErrorLocator().isHidden(), true);

    await expect(kycDigiKycPage.verifyButtonLocator()).toBeEnabled();
    logValidation('TC_Kyc_001 Verify button enabled', await kycDigiKycPage.verifyButtonLocator().isEnabled(), true);
  });
});
