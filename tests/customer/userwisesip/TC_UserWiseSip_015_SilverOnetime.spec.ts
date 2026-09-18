import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Silver - Onetime';
const DESCRIPTION = 'Users who have made one-time (spot) silver purchases.';

// Silver - Onetime: Users who have made one-time (spot) silver purchases.
test.describe('TC_UserWiseSip_015 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_UserWiseSip_015_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_015_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip015');
    });

    await test.step('TC_UserWiseSip_015_3 | Purchase silver one-time (single investment, no SIP)', async () => {
      // Same digital-silver buy-now pattern as TC_UserWiseSip_003 (gold) and the "onetime" leg of
      // TC_017/030/031 — not a shop/jewellery coin purchase.
      const { quantity, paidAmount } = await buyMetalOneTime(page, 'silver');
      logSegment('TC_UserWiseSip_015', USER_TYPE, DESCRIPTION, mobile, `bought ${quantity}g silver, paid ${paidAmount}`);
    });
  });
});
