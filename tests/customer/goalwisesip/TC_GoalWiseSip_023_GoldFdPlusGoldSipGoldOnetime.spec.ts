import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Gold SIP + Gold Onetime";
const DESCRIPTION =
  "Users holding Gold FD+, a gold SIP, and one-time gold purchases.";

test.describe('TC_GoalWiseSip_023 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_023_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_023_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_023', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
