import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Non KYC Users";
const DESCRIPTION =
  "Users who have not completed KYC verification.";

// Non KYC Users: Users who have not completed KYC verification.
test.describe('TC_GoalWiseSip_008 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_GoalWiseSip_008_1 | Register with a unique, unregistered mobile number and stop (no KYC)', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_008_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_008', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
