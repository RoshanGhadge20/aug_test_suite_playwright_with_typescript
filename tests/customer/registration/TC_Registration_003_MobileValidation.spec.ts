import { test, expect } from '../../../fixtures/base.fixture';
import { INVALID_MOBILE_SHORT, INVALID_MOBILE_BAD_PREFIX } from '../test-data/registration-data';

test.use({ storageState: { cookies: [], origins: [] } });

// The mobile-number field validates silently — no inline error text is ever shown here,
// only the Continue button's disabled state (see New Signup Window Test Plan.md §4.2/§8).
test.describe('TC_Registration_003 @regression @customer @registration', () => {
  test.beforeEach(async ({ customerLogin }) => {
    await customerLogin.open();
  });

  test('TC_Registration_003_001 | Blank mobile number keeps Continue disabled', async ({ customerLogin }) => {
    await expect(customerLogin.continueButtonLocator()).toBeDisabled();
  });

  test('TC_Registration_003_002 | Short mobile number keeps Continue disabled', async ({ customerLogin }) => {
    await customerLogin.enterMobileNumber(INVALID_MOBILE_SHORT);
    await expect(customerLogin.continueButtonLocator()).toBeDisabled();
  });

  test('TC_Registration_003_003 | Mobile number with an invalid leading digit keeps Continue disabled', async ({ customerLogin }) => {
    await customerLogin.enterMobileNumber(INVALID_MOBILE_BAD_PREFIX);
    await expect(customerLogin.continueButtonLocator()).toBeDisabled();
  });
});
