import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Onetime";
const DESCRIPTION =
  "Users with a Gold FD+ plus one-time gold purchases.";

test.describe('TC_GoalWiseSip_022 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_022_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_022_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_022', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
