import { test, expect } from '../../../fixtures/base.fixture';
import { generateUnregisteredMobile, REGISTRATION_OTP, WRONG_OTP } from '../test-data/registration-data';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Registration_004 @regression @customer @registration', () => {
  test('TC_Registration_004_001 | Wrong OTP shows an inline error and does not navigate away', async ({ page, customerLogin }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.open();
    await customerLogin.enterMobileNumber(mobile);
    await customerLogin.continueToOtp();

    await customerLogin.enterOtp(WRONG_OTP);
    await customerLogin.clickVerifyOtp();

    await expect(customerLogin.otpErrorMessage()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login\/verify-otp/i);
  });

  test('TC_Registration_004_002 | Correct backdoor OTP proceeds past OTP verification', async ({ page, customerLogin }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.open();
    await customerLogin.enterMobileNumber(mobile);
    await customerLogin.continueToOtp();

    await customerLogin.enterOtp(REGISTRATION_OTP);
    await customerLogin.clickVerifyOtp();

    await expect(page).not.toHaveURL(/\/login\/verify-otp/i, { timeout: 20_000 });
  });
});
