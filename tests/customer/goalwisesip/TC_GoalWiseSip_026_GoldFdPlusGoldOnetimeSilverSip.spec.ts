import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Gold Onetime + Silver SIP";
const DESCRIPTION =
  "Users with Gold FD+, one-time gold purchases, and a silver SIP.";

test.describe('TC_GoalWiseSip_026 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_026_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_026_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_026', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
