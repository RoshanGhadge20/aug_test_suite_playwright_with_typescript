import { test, expect } from '../../../fixtures/base.fixture';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  existingKycVerifiedCustomerCreds,
  ALREADY_REGISTERED_PAN,
  ALREADY_REGISTERED_PAN_DOB,
} from '../test-data/registration-data';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { removeEkycRecord } from '../../../utils/api/ekyc-api';
import { TestDataFactory } from '../../../utils/data/test-data.factory';

const dataset = getSipFlowsDataset();
const sipData = {
  metal: parseSipMetalType(dataset.SIPWeeklyGoldMetal),
  frequency: parseSipFrequencyType(dataset.SIPWeeklyFrequency),
  amount: dataset.SIPWeeklyAmount,
  investmentDay: dataset.SIPWeeklyInvestmentDay,
  frequencyLabel: dataset.SIPWeeklyFrequency,
  metalLabel: dataset.GoldLabel,
  metalName: dataset.SIPWeeklyGoldMetal,
  startAfterDays: Number(dataset.SIPStartAfterDays || 5),
};
const bankDetails = {
  bankName: dataset.BankName,
  accountHolderName: dataset.AccountHolderName,
  accountNumber: dataset.AccountNumber,
  ifscCode: dataset.IFSCCode,
  accountType: dataset.AccountType,
};

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Referral_003 @regression @customer @referral', () => {
  test('A referred friend starting a SIP credits the referrer\'s Pending / Total Earned amounts', async ({
    page,
    customerLogin,
    myProfilePage,
    kycDigiKycPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
  }) => {
    test.setTimeout(180_000);

    const { mobile: defaultMobile, pin: defaultPin } = existingKycVerifiedCustomerCreds();
    let referralCode = '';
    let oldPending = 0;
    let oldTotalEarned = 0;

    await test.step('TC_Referral_003_1 | Log in as the default customer and read old Pending/Total Earned + referral code', async () => {
      // navigator.clipboard.writeText()/readText() require this permission to be granted explicitly in Chromium.
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await customerLogin.login(defaultMobile, defaultPin);
      await myProfilePage.open();
      await myProfilePage.scrollToTop();

      oldPending = await myProfilePage.getPendingReferralAmount();
      oldTotalEarned = await myProfilePage.getTotalEarnedAmount();
      console.log(`[TC_Referral_003_1] Old Pending: ${oldPending}, old Total Earned: ${oldTotalEarned}`);

      await myProfilePage.copyReferralCode();
      referralCode = await page.evaluate(() => (navigator as any).clipboard.readText());
      console.log(`[TC_Referral_003_1] Referral code to apply: ${referralCode}`);
      expect(referralCode.length).toBeGreaterThan(0);
    });

    await test.step('TC_Referral_003_2 | Log out and register a new customer applying the referral code', async () => {
      await customerLogin.logoutAndReturnToMobileEntry();

      const newMobile = generateUnregisteredMobile();
      console.log(`[TC_Referral_003_2] New unique mobile: ${newMobile}`);

      await customerLogin.enterMobileNumber(newMobile);
      await customerLogin.clickContinue();
      await page.waitForURL(/\/login\/verify-otp/i, { timeout: 20_000 });

      await customerLogin.openReferralCodeEntry();
      await customerLogin.enterReferralCode(referralCode);
      await expect(customerLogin.referralCodeAppliedMessageLocator()).toBeVisible({ timeout: 10_000 });

      await customerLogin.enterOtp(REGISTRATION_OTP);
      await customerLogin.clickVerifyOtp();
      await expect(customerLogin.referralSuccessModalHeadingLocator()).toBeVisible({ timeout: 15_000 });
      await customerLogin.proceedButtonLocator().click();

      await page.waitForURL(/\/digital-gold\/buy/i, { timeout: 20_000 });
      console.log(`[TC_Referral_003_2] Landed on: ${page.url()}`);
    });

    await test.step('TC_Referral_003_3 | Complete KYC for the new customer (required before a real SIP payment)', async () => {
      // A brand-new signup can create/pay for a SIP only after KYC — same technique as
      // TC_Kyc_004: free the shared ALREADY_REGISTERED_PAN via the e-KYC reset API, then run it
      // through the in-app KARZA-mocked verification instead of the "PAN Card already exists!"
      // short-circuit.
      await removeEkycRecord({ identityProofNumber: null, panCardNumber: ALREADY_REGISTERED_PAN });

      await kycDigiKycPage.open();
      await kycDigiKycPage.enterPan(ALREADY_REGISTERED_PAN);
      await kycDigiKycPage.setDateOfBirth(ALREADY_REGISTERED_PAN_DOB);
      await kycDigiKycPage.enterEmail(TestDataFactory.email('referral003'));
      await kycDigiKycPage.clickVerify();

      await expect(kycDigiKycPage.karzaModalHeadingLocator()).toBeVisible({ timeout: 10_000 });
      await kycDigiKycPage.clickProceedForPanVerification();

      // The KARZA mock verification endpoint occasionally answers with a transient
      // "Verification Error! ... ERROR 429 TOO MANY REQUESTS" dialog offering a "Try Again"
      // button — confirmed live. Retry through it rather than failing outright.
      const verificationErrorTryAgain = page.getByRole('button', { name: 'Try Again' });
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        const verified = await kycDigiKycPage
          .verifiedModalHeadingLocator()
          .isVisible({ timeout: 8_000 })
          .catch(() => false);
        if (verified) break;

        const rateLimited = await verificationErrorTryAgain.isVisible({ timeout: 2_000 }).catch(() => false);
        if (!rateLimited) break;

        const backoffMs = 15_000 * attempt;
        console.log(`[TC_Referral_003_3] Verification 429 hit — waiting ${backoffMs}ms then retrying (attempt ${attempt}).`);
        await page.waitForTimeout(backoffMs);
        await verificationErrorTryAgain.click();
      }

      await expect(kycDigiKycPage.verifiedModalHeadingLocator()).toBeVisible({ timeout: 20_000 });
      await kycDigiKycPage.acknowledgeVerifiedModal();

      await expect(page).toHaveURL(/\/digital-gold\/buy/i, { timeout: 10_000 });
      console.log('[TC_Referral_003_3] KYC completed — landed back on /digital-gold/buy.');
    });

    let planName = '';

    await test.step('TC_Referral_003_4 | Create a weekly gold SIP as the new (referred) customer', async () => {
      // Confirmed live: immediately after KYC, a brand-new account's first navigation into the
      // buy/SIP form intermittently bounces to /my-profile instead (a race in the app's own
      // post-KYC redirect, not something the other SIP specs hit — they all run against the
      // long-lived default account, never a just-KYC'd one). Retry once via a fresh /digital-gold/buy
      // navigation rather than patching the shared buyMetalPage retry logic.
      try {
        const result = await buyMetalPage.createSip({
          metal: sipData.metal,
          frequency: sipData.frequency,
          amount: sipData.amount,
          investmentDay: sipData.investmentDay,
          startAfterDays: sipData.startAfterDays,
          planPrefix: 'Sip_plan_referral',
        });
        planName = result.planName;
      } catch (err) {
        console.log(`[TC_Referral_003_4] First createSip attempt failed (${(err as Error).message.slice(0, 200)}) — retrying once.`);
        await page.goto('/digital-gold/buy');
        await page.waitForLoadState('domcontentloaded');
        const result = await buyMetalPage.createSip({
          metal: sipData.metal,
          frequency: sipData.frequency,
          amount: sipData.amount,
          investmentDay: sipData.investmentDay,
          startAfterDays: sipData.startAfterDays,
          planPrefix: 'Sip_plan_referral',
        });
        planName = result.planName;
      }
      console.log(`[TC_Referral_003_4] Created SIP plan: ${planName}`);
    });

    await test.step('TC_Referral_003_5 | Complete the SIP payment via eMandate + new bank account', async () => {
      await buySummaryPage.validateSipSummaryAndProceed({
        amount: sipData.amount,
        frequency: sipData.frequencyLabel,
        planName,
        metalLabel: sipData.metalLabel,
        metal: sipData.metalName,
        frequencyType: sipData.frequency,
      });

      await paymentPage.assertUpiAndEmandateVisibleAndCloseToSummary();

      await buySummaryPage.clickProceedToPay();
      await paymentPage.clickEmandate();

      // This brand-new customer has no saved bank accounts. `completeEmandateWithBankSetup()` /
      // `selectBankOrAddNew()` (used by the other SIP specs, always against the shared default
      // account which already has a saved bank) counts `div[class*="bg-teal-aliceblue"]` cards to
      // decide add-new vs pick-existing — confirmed live that the dialog's "Customer doesn't have
      // any Bank Account added..." info banner matches that same CSS class, is miscounted as a
      // real card, and hangs waiting for a radio button that doesn't exist inside it. Rather than
      // touch that shared method (used by other regression specs), click "Add New" directly here.
      const bankDialog = page.getByRole('dialog', { name: /choose bank account/i });
      await bankDialog.waitFor({ state: 'visible', timeout: 20_000 });
      await bankDialog.getByText('Add New', { exact: false }).click();

      await addNewBankPage.fillAndSubmitBankForm(bankDetails);
      // Since 2026-10 submitting a new bank opens the Razorpay eMandate popup directly (no
      // separate Pay click); a Pay click then just times out behind the loading overlay.
      const razorpayOpened = await page
        .locator('iframe[src*="razorpay"]')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true, () => false);
      if (!razorpayOpened) {
        await paymentPage.clickPayButton();
      }
      await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
    });

    await test.step('TC_Referral_003_6 | Log back in as the default customer and validate Pending/Total Earned increased', async () => {
      await customerLogin.logoutAndReturnToMobileEntry();
      await customerLogin.loginWithExistingPin(defaultMobile, defaultPin);

      await myProfilePage.open();
      await myProfilePage.scrollToTop();

      const newPending = await myProfilePage.getPendingReferralAmount();
      const newTotalEarned = await myProfilePage.getTotalEarnedAmount();
      console.log(
        `[TC_Referral_003_6] New Pending: ${newPending} (was ${oldPending}), ` +
        `new Total Earned: ${newTotalEarned} (was ${oldTotalEarned})`,
      );

      expect(newPending).toBeGreaterThanOrEqual(oldPending);
      expect(newTotalEarned).toBeGreaterThanOrEqual(oldTotalEarned);
      expect(newPending > oldPending || newTotalEarned > oldTotalEarned).toBe(true);
    });
  });
});
