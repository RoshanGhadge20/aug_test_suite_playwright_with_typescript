import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Users with 50K Investment';
const DESCRIPTION = 'Users whose investment is at or above ₹50,000.';
const INVESTMENT_AMOUNT = '50000';

// Users with 50K Investment: Users whose investment is at or above ₹50,000.
test.describe('TC_UserWiseSip_007 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({ page, buyMetalPage, buySummaryPage, paymentPage }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_UserWiseSip_007_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_007_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip007');
    });

    await test.step('TC_UserWiseSip_007_3 | Purchase gold one-time for ₹50,000 (at-or-above 50K investment)', async () => {
      // Same as buyMetalOneTime (flows/customer/buy-metal.flow.ts), but with a fixed ₹50,000
      // amount instead of the dataset's default oneTimeGoldAmount — inlined here rather than
      // changing the shared flow's signature, per feedback_goalwisesip_isolated_edits.
      const dataset = getBuyMetalDataset();

      await buyMetalPage.placeOneTimeOrder('gold', INVESTMENT_AMOUNT);
      const summary = await buySummaryPage.validateOneTimeSummaryAndPayNow(INVESTMENT_AMOUNT);

      const paidAmount = await paymentPage.completeNetbankingBuyNowPayment(
        dataset.contactNumber,
        Number(INVESTMENT_AMOUNT),
        dataset.netbankingBankName,
      );

      logSegment(
        'TC_UserWiseSip_007',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `bought ${summary.quantity}g gold, paid ${paidAmount}`,
      );
    });
  });
});
