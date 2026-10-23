import { test, expect } from '../../../fixtures/base.fixture';
import { generateUnregisteredMobile } from '../test-data/registration-data';

test.use({ storageState: { cookies: [], origins: [] } });

// Waits out the real ~60s OTP countdown — tagged @slow so it can be excluded from fast runs
// via --grep-invert @slow.
test.describe('TC_Registration_005 @regression @customer @registration @slow', () => {
  test('SMS resend is hidden until the OTP countdown expires, then restarts the timer', async ({
    page,
    customerLogin,
  }) => {
    test.setTimeout(120_000);
    const mobile = generateUnregisteredMobile();
    await customerLogin.open();
    await customerLogin.enterMobileNumber(mobile);
    await customerLogin.continueToOtp();

    await test.step('Resend button is hidden while the countdown is running', async () => {
      await expect(customerLogin.otpCountdownText()).toBeVisible();
      await expect(customerLogin.otpResendSmsButton()).toBeHidden();
    });

    await test.step('Resend button appears once the countdown reaches zero', async () => {
      await expect(customerLogin.otpResendSmsButton()).toBeVisible({ timeout: 65_000 });
    });

    await test.step('Clicking SMS resend restarts the countdown and hides the resend button again', async () => {
      await customerLogin.otpResendSmsButton().click();
      await expect(customerLogin.otpCountdownText()).toBeVisible({ timeout: 10_000 });
      await expect(customerLogin.otpResendSmsButton()).toBeHidden();
    });
  });
});
