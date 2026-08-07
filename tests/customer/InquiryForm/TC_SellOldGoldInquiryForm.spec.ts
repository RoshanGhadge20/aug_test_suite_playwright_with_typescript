import { test, expect } from '../../../fixtures/base.fixture';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
} from '../test-data/registration-data';

test.describe('TC_SellOldGoldInquiryForm @regression @customer @gold-loan', () => {
  test('TC_SellOldGoldInquiryForm_001 | Submitting the Sell Old Gold enquiry form shows the confirmation message and can be closed', async ({
    sellOldGoldInquiryPage,
  }) => {
    await sellOldGoldInquiryPage.open();
    await sellOldGoldInquiryPage.submitEnquiry({ goldGrams: 5 });

    await expect(sellOldGoldInquiryPage.successMessageLocator()).toBeVisible({ timeout: 15_000 });
    await expect(sellOldGoldInquiryPage.successMessageLocator()).toContainText('Thank you for contacting us');

    await sellOldGoldInquiryPage.closeSuccessDialog();
    await expect(sellOldGoldInquiryPage.successMessageLocator()).toBeHidden({ timeout: 10_000 });
  });
});

// Own describe block with a cleared storage state — logs in as a brand-new customer (unique
// mobile) per run, instead of inheriting the shared authenticated `customer` session above.
test.describe('TC_SellOldGoldInquiryForm @regression @customer @gold-loan', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC_SellOldGoldInquiryForm_002 | Fresh login with a unique mobile number then submit the Sell Old Gold enquiry form', async ({
    customerLogin,
    sellOldGoldInquiryPage,
  }) => {
    const loginMobile = generateUnregisteredMobile();
    console.log('[TC_SellOldGoldInquiryForm_002] Login mobile number:', loginMobile);

    await customerLogin.registerOrLoginCustomer(loginMobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);

    await sellOldGoldInquiryPage.open();
    await sellOldGoldInquiryPage.submitEnquiry({ goldGrams: 5 });

    await expect(sellOldGoldInquiryPage.successMessageLocator()).toBeVisible({ timeout: 15_000 });
    await expect(sellOldGoldInquiryPage.successMessageLocator()).toContainText('Thank you for contacting us');

    await sellOldGoldInquiryPage.closeSuccessDialog();
    await expect(sellOldGoldInquiryPage.successMessageLocator()).toBeHidden({ timeout: 10_000 });
  });
});
