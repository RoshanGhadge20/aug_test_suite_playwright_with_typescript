import * as fs from 'fs';
import * as path from 'path';
import { test } from '../../../fixtures/base.fixture';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { CustomerLoginPage } from '../../../pages/customer/login.page';
import { generateUnregisteredMobile, REGISTRATION_OTP } from '../test-data/registration-data';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import { PENDING_WITHDRAWAL_STATE_PATH, TEST_PIN } from './tc010-pending-withdrawal';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'User with Zero Investment';
const DESCRIPTION =
  'Users whose current balance is zero — invested earlier but fully sold / withdrawn.';
const INVESTMENT_AMOUNT = '500';

// User with Zero Investment (Part A — register, KYC, buy): Users whose current balance is zero —
// invested earlier but fully sold / withdrawn. Split from the withdrawal half (see
// TC_GoalWiseSip_038_UserWithZeroInvestment_WithdrawAfterSettlement.spec.ts) because a freshly
// bought gold amount isn't always immediately withdrawable here (confirmed live: the Gold Vault
// intermittently shows 0g right after buying) — TC038 is numbered to run after all other
// goalwisesip TCs, and also waits out any remaining time itself, so the purchase has settled by
// the time it attempts the withdrawal.
test.describe('TC_GoalWiseSip_010 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
  }) => {
    test.setTimeout(180_000);

    let mobile = '';

    await test.step('TC_GoalWiseSip_010_1 | Register with a unique, unregistered mobile number', async () => {
      // registerOrLoginCustomer (pages/customer/login.page.ts) already drives mobile -> OTP ->
      // (PIN setup, if shown) -> dashboard in one proven call (see TC_Registration_002) — using
      // it here with the local TEST_PIN instead of duplicating that sequence by hand.
      mobile = generateUnregisteredMobile();
      const customerLogin = new CustomerLoginPage(page);
      await customerLogin.registerOrLoginCustomer(mobile, REGISTRATION_OTP, TEST_PIN);
    });

    await test.step('TC_GoalWiseSip_010_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip010');
    });

    await test.step('TC_GoalWiseSip_010_3 | Purchase gold one-time for ₹500', async () => {
      // Same as buyMetalOneTime (flows/customer/buy-metal.flow.ts), but with a fixed ₹500
      // amount instead of the dataset's default oneTimeGoldAmount — inlined here rather than
      // changing the shared flow's signature, per feedback_goalwisesip_isolated_edits.
      const dataset = getBuyMetalDataset();

      await buyMetalPage.placeOneTimeOrder('gold', INVESTMENT_AMOUNT);
      await buySummaryPage.validateOneTimeSummaryAndPayNow(INVESTMENT_AMOUNT);

      await paymentPage.completeNetbankingBuyNowPayment(
        dataset.contactNumber,
        Number(INVESTMENT_AMOUNT),
        dataset.netbankingBankName,
      );
    });

    await test.step('TC_GoalWiseSip_010_4 | Hand off to TC_GoalWiseSip_038 for the withdrawal half', async () => {
      fs.mkdirSync(path.dirname(PENDING_WITHDRAWAL_STATE_PATH), { recursive: true });
      fs.writeFileSync(
        PENDING_WITHDRAWAL_STATE_PATH,
        JSON.stringify({ mobile, purchasedAt: Date.now() }, null, 2),
      );
      console.log(
        `[TC_GoalWiseSip_010] Registered + KYC'd + bought ₹500 gold for ${mobile}. ` +
          'TC_GoalWiseSip_038 will log out, wait for settlement, and withdraw the full balance.',
      );
    });
  });
});
