import { test, expect } from '../../../fixtures/base.fixture';
import { TestDataFactory } from '../../../utils/data/test-data.factory';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
} from '../test-data/registration-data';

test.describe('TC_GoldLoanInquiryForm @regression @customer @gold-loan', () => {
  test('TC_GoldLoanInquiryForm_001 | Submitting the Gold Loan enquiry form with valid details shows the success confirmation', async ({
    goldLoanInquiryPage,
  }) => {
    // A fresh, random mobile every run — the backend rejects/behaves differently on a repeat
    // enquiry from the same number.
    const mobile = TestDataFactory.phone();

    await goldLoanInquiryPage.open();
    await goldLoanInquiryPage.submitEnquiry({
      name: 'Automation Test User',
      mobile,
      city: 'Mumbai',
    });

    await expect(goldLoanInquiryPage.successHeadingLocator()).toBeVisible({ timeout: 15_000 });
  });
});

// Own describe block with a cleared storage state — logs in as a brand-new customer (unique
// mobile) per run, instead of inheriting the shared authenticated `customer` session above.
test.describe('TC_GoldLoanInquiryForm @regression @customer @gold-loan', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC_GoldLoanInquiryForm_002 | Fresh login with a unique mobile number then submit the Gold Loan enquiry form', async ({
    customerLogin,
    goldLoanInquiryPage,
  }) => {
    const loginMobile = generateUnregisteredMobile();
    console.log('[TC_GoldLoanInquiryForm_002] Login mobile number:', loginMobile);

    await customerLogin.registerOrLoginCustomer(loginMobile, REGISTRATION_OTP, DEFAULT_TEST_PIN);

    const enquiryMobile = TestDataFactory.phone();
    await goldLoanInquiryPage.open();
    await goldLoanInquiryPage.submitEnquiry({
      name: 'Automation Test User',
      mobile: enquiryMobile,
      city: 'Mumbai',
    });

    await expect(goldLoanInquiryPage.successHeadingLocator()).toBeVisible({ timeout: 15_000 });
  });
});
