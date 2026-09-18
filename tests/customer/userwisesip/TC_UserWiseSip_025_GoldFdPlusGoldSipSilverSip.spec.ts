import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+ + Gold SIP + Silver SIP";
const DESCRIPTION =
  "Users with Gold FD+, a gold SIP, and a silver SIP.";

test.describe('TC_UserWiseSip_025 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_UserWiseSip_025_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_UserWiseSip_025_2 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_025', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
