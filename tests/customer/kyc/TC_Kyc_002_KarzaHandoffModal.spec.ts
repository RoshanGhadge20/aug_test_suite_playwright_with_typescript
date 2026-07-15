import { test, expect } from '../../../fixtures/base.fixture';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
  generateValidFormatPan,
  adultDobYearsAgo,
  ALREADY_REGISTERED_PAN,
  ALREADY_REGISTERED_PAN_DOB,
} from '../test-data/registration-data';
import { logValidation } from '../helpers/customer-alt-user.helpers';
import { removeEkycRecord } from '../../../utils/api/ekyc-api';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Kyc_002 @regression @customer @kyc', () => {
  test.beforeEach(async ({ customerLogin, kycDigiKycPage }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);
    await kycDigiKycPage.open();
    await kycDigiKycPage.enterPan(generateValidFormatPan());
    await kycDigiKycPage.setDateOfBirth(adultDobYearsAgo(25));
  });

  test('TC_Kyc_002_001 | Verify with valid data opens the KARZA hand-off modal without firing a network call', async ({
    page,
    kycDigiKycPage,
  }) => {
    const requestUrlsDuringClick: string[] = [];
    const onRequest = (req: { url: () => string }) => requestUrlsDuringClick.push(req.url());
    page.on('request', onRequest);

    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_002 KARZA modal heading visible', await kycDigiKycPage.karzaModalHeadingLocator().isVisible(), true);

    page.off('request', onRequest);
    // Client-side-only modal — confirmed no request fires until "Proceed for PAN Verification"
    // is clicked, which this suite never does (see karzaProceedButtonLocator() below).
    const karzaRequestCount = requestUrlsDuringClick.filter((url) => /verify|karza/i.test(url)).length;
    logValidation('TC_Kyc_002 KARZA/verify network requests during click', karzaRequestCount, 0);
    expect(karzaRequestCount).toBe(0);
  });

  test('TC_Kyc_002_002 | Cancel on the KARZA modal returns to the KYC form with fields intact', async ({ kycDigiKycPage }) => {
    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_002 KARZA modal heading visible', await kycDigiKycPage.karzaModalHeadingLocator().isVisible(), true);

    await kycDigiKycPage.cancelKarzaModal();

    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeHidden();
    logValidation('TC_Kyc_002 KARZA modal heading hidden after cancel', await kycDigiKycPage.karzaModalHeadingLocator().isHidden(), true);

    await expect(kycDigiKycPage.panNumberField()).not.toHaveValue('');
    logValidation('TC_Kyc_002 PAN field retains value after cancel', await kycDigiKycPage.panNumberField().inputValue(), '(non-empty)');
  });

  test('TC_Kyc_002_003 | "Proceed for PAN Verification" exists but is never clicked (external redirect boundary)', async ({
    kycDigiKycPage,
  }) => {
    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_002 KARZA modal heading visible', await kycDigiKycPage.karzaModalHeadingLocator().isVisible(), true);

    // Existence/visibility assertion only. Clicking this button leaves the app under test via an
    // external redirect (KARZA) — out of automation scope per New Signup Window Test Plan.md §1/§4.6.
    await expect(kycDigiKycPage.karzaProceedButtonLocator()).toBeVisible();
    logValidation('TC_Kyc_002 KARZA proceed button visible (never clicked)', await kycDigiKycPage.karzaProceedButtonLocator().isVisible(), true);
    await kycDigiKycPage.cancelKarzaModal();
  });

});

// Separate describe block: a fresh account, navigated to the KYC form via the dashboard user-menu
// (guest-user icon -> Kyc) rather than a direct goto — the reported repro for the duplicate-PAN
// error specifically goes through the menu, not a direct URL.
test.describe('TC_Kyc_002 @regression @customer @kyc', () => {
  test.beforeEach(async ({ page, customerLogin, customerMenupage, kycDigiKycPage }) => {
    test.setTimeout(120_000);

    // ALREADY_REGISTERED_PAN only triggers the duplicate-PAN error if it's genuinely linked to
    // some account. Rather than assume that pre-exists in this shared UAT environment — fragile,
    // since e.g. TC_Kyc_004 explicitly frees it via removeEkycRecord() — (re-)establish it here:
    // free the record, then complete a full KARZA verification against a disposable customer so
    // the PAN is guaranteed to be "already registered" again before the real test customer tries it.
    console.log('[TC_Kyc_002_004 setup] Ensuring ALREADY_REGISTERED_PAN is linked to an account...');
    await removeEkycRecord({ identityProofNumber: null, panCardNumber: ALREADY_REGISTERED_PAN });

    const setupMobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(setupMobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);
    await kycDigiKycPage.open();
    await kycDigiKycPage.enterPan(ALREADY_REGISTERED_PAN);
    await kycDigiKycPage.setDateOfBirth(ALREADY_REGISTERED_PAN_DOB);
    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    await kycDigiKycPage.clickProceedForPanVerification();
    await expect(kycDigiKycPage.verifiedModalHeadingLocator()).toBeVisible({ timeout: 20_000 });
    await kycDigiKycPage.acknowledgeVerifiedModal();
    await expect(page).toHaveURL(/\/digital-gold\/buy/i, { timeout: 10_000 });
    console.log('[TC_Kyc_002_004 setup] ALREADY_REGISTERED_PAN linked. Switching to the real test customer...');

    // Now the actual test customer, navigated to the KYC form via the dashboard user-menu (guest-
    // user icon -> Kyc) rather than a direct goto — the reported repro for the duplicate-PAN error
    // specifically goes through the menu, not a direct URL.
    // logoutAndReturnToMobileEntry (not a plain storage clear) — right after the setup account's
    // registerOrLoginCustomer() above, /login has been confirmed live to bounce straight back to
    // /dashboard on a clear majority of attempts; this retries against a deadline instead.
    await customerLogin.logoutAndReturnToMobileEntry();
    const mobile = generateUnregisteredMobile();
    await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);

    // Same bounce-back retry as TC_Kyc_003 — navigating right after registration can land on a
    // promotional page instead of the KYC form (see New Signup Window Test Plan.md §26 item 14).
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

  test('TC_Kyc_002_004 | Already-registered PAN shows "PAN Card already exists!" after Proceed on the KARZA modal', async ({
    page,
    kycDigiKycPage,
  }) => {
    await kycDigiKycPage.enterPan(ALREADY_REGISTERED_PAN);
    await kycDigiKycPage.setDateOfBirth(ALREADY_REGISTERED_PAN_DOB);

    await kycDigiKycPage.clickVerify();
    await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_002 KARZA modal heading visible', await kycDigiKycPage.karzaModalHeadingLocator().isVisible(), true);

    // Confirmed live (2026-07-06): the duplicate-PAN check only fires after Proceed, not at
    // Verify. The beforeEach above just (re-)linked this PAN to a disposable account, so it
    // short-circuits with an inline error and never leaves the app — safe to click here only
    // because of that (see KycDigiKycPage.clickProceedForPanVerification()).
    await kycDigiKycPage.clickProceedForPanVerification();

    await expect(kycDigiKycPage.panAlreadyExistsErrorLocator()).toBeVisible({ timeout: 10_000 });
    logValidation('TC_Kyc_002 PAN-already-exists error visible', await kycDigiKycPage.panAlreadyExistsErrorLocator().isVisible(), true);

    await expect(page).toHaveURL(/\/kyc\/digi-kyc/i);
    logValidation('TC_Kyc_002 stayed on /kyc/digi-kyc (no external redirect)', page.url(), '/kyc/digi-kyc');
  });
});
