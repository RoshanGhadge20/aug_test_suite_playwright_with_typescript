import { test } from '../../../fixtures/base.fixture';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold FD+";
const DESCRIPTION =
  "Users who hold a Gold FD+ (fixed deposit) product.";

test.describe('TC_UserWiseSip_021 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.skip(true, 'Steps pending');

    let mobile = '';

    await test.step('TC_UserWiseSip_021_1 | TODO: build this persona\'s journey', async () => {
      // Steps to be added
    });

    await test.step('TC_UserWiseSip_021_2 | Print the segment mobile number', async () => {
      logSegment('TC_UserWiseSip_021', USER_TYPE, DESCRIPTION, mobile);
    });
  });
});
