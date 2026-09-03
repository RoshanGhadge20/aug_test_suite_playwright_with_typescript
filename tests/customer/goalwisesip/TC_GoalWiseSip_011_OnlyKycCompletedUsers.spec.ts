import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Only KYC Completed Users";
const DESCRIPTION =
  "Users who have completed KYC but have not yet invested.";

test.describe('TC_GoalWiseSip_011 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_011_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_011_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_011', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
