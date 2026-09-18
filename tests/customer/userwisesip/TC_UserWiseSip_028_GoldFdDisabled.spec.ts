import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD Disabled";
const DESCRIPTION =
  "Users for whom Gold FD+ is disabled or unavailable (ineligible or opted out).";

test.describe('TC_UserWiseSip_028 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_UserWiseSip_028_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_UserWiseSip_028_2 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_028', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
