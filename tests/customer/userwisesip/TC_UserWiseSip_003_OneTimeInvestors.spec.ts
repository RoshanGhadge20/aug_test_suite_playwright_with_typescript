import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'One Time Investors';
const DESCRIPTION = 'Users who have made a single investment and have no recurring SIP set up.';

// One Time Investors: Users who have made a single investment and have no recurring SIP set up.
test.describe('TC_UserWiseSip_003 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_UserWiseSip_003_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_003_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip003');
    });

    await test.step('TC_UserWiseSip_003_3 | Purchase gold one-time (single investment, no SIP)', async () => {
      const { quantity, paidAmount } = await buyMetalOneTime(page, 'gold');
      logSegment('TC_UserWiseSip_003', USER_TYPE, DESCRIPTION, mobile, `bought ${quantity}g gold, paid ${paidAmount}`);
    });
  });
});
