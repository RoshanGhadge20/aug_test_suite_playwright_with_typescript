import { test, expect } from '../../../fixtures/base.fixture';
import { generateUnregisteredMobile } from '../test-data/registration-data';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('TC_Registration_007 @regression @customer @registration', () => {
  test('Back button on the OTP screen returns to mobile entry', async ({ page, customerLogin }) => {
    const mobile = generateUnregisteredMobile();
    await customerLogin.open();
    await customerLogin.enterMobileNumber(mobile);
    await customerLogin.continueToOtp();

    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'Go Back' }).click();

    await expect(page).toHaveURL(/\/login(?:\/?$|\?)/i, { timeout: 10_000 });
    await expect(customerLogin.mobileNumberField()).toBeVisible();
  });
});
