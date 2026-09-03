import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "User has No Investment";
const DESCRIPTION =
  "Users who have never made any investment.";

test.describe('TC_GoalWiseSip_009 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_009_1 | Note: same journey as TC_GoalWiseSip_002', async () => {
      console.log('[TC_GoalWiseSip_009] TC_GoalWiseSip_002 and TC_GoalWiseSip_009 are the same (register + KYC, no further activity).');
    });

    await test.step('TC_GoalWiseSip_009_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_009', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
