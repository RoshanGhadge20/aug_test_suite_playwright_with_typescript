import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Applied for Loans";
const DESCRIPTION =
  "User Applied for loans.";

test.describe('TC_GoalWiseSip_037 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_GoalWiseSip_037_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_GoalWiseSip_037_2 | Print the segment mobile number', async () => {
      logSegment('TC_GoalWiseSip_037', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
