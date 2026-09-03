import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'New Users';
const DESCRIPTION =
  "Users who registered recently and haven't yet completed meaningful activity (within a defined recent window).";

// New Users: Users who registered recently and haven't yet completed meaningful activity (within a defined recent window).
test.describe('TC_GoalWiseSip_002 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.setTimeout(120_000);

    let mobile = '';

    await test.step('TC_GoalWiseSip_002_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_002_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip002');
    });

    await test.step('TC_GoalWiseSip_002_3 | Do nothing further — print the New User\'s mobile number', async () => {
      logSegment('TC_GoalWiseSip_002', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
