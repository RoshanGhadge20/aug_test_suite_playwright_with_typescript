import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "SIP Paused Users";
const DESCRIPTION =
  "Users who set up a SIP but have currently paused it.";

test.describe('TC_GoalWiseSip_005 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_005_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_005_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_005', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
