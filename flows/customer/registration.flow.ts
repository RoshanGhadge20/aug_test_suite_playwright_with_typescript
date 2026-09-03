import type { Page } from '@playwright/test';
import { CustomerLoginPage } from '../../pages/customer/login.page';
import {
  generateUnregisteredMobile,
  REGISTRATION_OTP,
  DEFAULT_TEST_PIN,
} from '../../tests/customer/test-data/registration-data';

export interface NewUserRegistrationResult {
  mobile: string;
}

/**
 * Registers a brand-new customer via mobile + backdoor OTP, completing first-time PIN setup
 * if the app prompts for it. Where OTP verification lands afterward is not fixed (dashboard,
 * a promo page, or PIN-setup — see TC_Registration_001); this only guarantees PIN setup is
 * handled when shown, not a specific landing page.
 */
export async function registerNewUser(
  page: Page,
  mobile: string = generateUnregisteredMobile(),
): Promise<NewUserRegistrationResult> {
  const customerLogin = new CustomerLoginPage(page);

  await customerLogin.open();
  await customerLogin.enterMobileNumber(mobile);
  await customerLogin.clickContinue();
  await page.waitForURL(/\/login\/verify-otp/i, { timeout: 20_000 });

  await customerLogin.enterOtp(REGISTRATION_OTP);
  await customerLogin.clickVerifyOtp();
  await page.waitForURL((url) => !/\/login\/verify-otp/i.test(url.pathname), { timeout: 20_000 });

  if (/\/login\/verify-pin/i.test(page.url())) {
    await customerLogin.enterNewPin(DEFAULT_TEST_PIN, DEFAULT_TEST_PIN);
    await customerLogin.clickProceed();
  }

  return { mobile };
}
