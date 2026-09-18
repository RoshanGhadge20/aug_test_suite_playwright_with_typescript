import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Inactive (Doormat) Users";
const DESCRIPTION =
  "Users who were once active but have had no transaction or engagement for an extended period.";

test.describe('TC_UserWiseSip_004 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_UserWiseSip_004_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_UserWiseSip_004_2 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_004', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
