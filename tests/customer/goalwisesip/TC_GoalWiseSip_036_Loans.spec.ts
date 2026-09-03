import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Loans";
const DESCRIPTION =
  "User with Active Loans or Applied for loans.";

test.describe('TC_GoalWiseSip_036 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_036_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_036_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_036', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
