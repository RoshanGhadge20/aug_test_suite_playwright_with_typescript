import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Silver SIP + Gold Onetime";
const DESCRIPTION =
  "Users with Gold FD+, a silver SIP, and one-time gold purchases. (Possible duplicate of the row above — confirm.)";

test.describe('TC_GoalWiseSip_027 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_027_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_027_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_027', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
