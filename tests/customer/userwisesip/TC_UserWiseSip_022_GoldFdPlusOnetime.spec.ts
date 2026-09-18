import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Onetime";
const DESCRIPTION =
  "Users with a Gold FD+ plus one-time gold purchases.";

test.describe('TC_UserWiseSip_022 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_UserWiseSip_022_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_UserWiseSip_022_2 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_022', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
