import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold SIP + Silver Onetime';
const DESCRIPTION = 'Users with a gold SIP and one-time silver purchases.';

// Gold SIP + Silver Onetime.
test.describe('TC_GoalWiseSip_030 @regression @customer @goalwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    myProfilePage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
  }) => {
    test.setTimeout(180_000);

    const dataset = getSipFlowsDataset();
    const goldMetal = parseSipMetalType(dataset.SIPMonthlyGoldMetal);
    const frequency = parseSipFrequencyType(dataset.SIPMonthlyFrequency);
    const bankDetails = {
      bankName: dataset.BankName,
      accountHolderName: dataset.AccountHolderName,
      accountNumber: dataset.AccountNumber,
      ifscCode: dataset.IFSCCode,
      accountType: dataset.AccountType,
    };

    let mobile = '';
    let goldSipPlanName = '';
    let silverOneTimeQuantity = 0;
    let silverOneTimePaid = 0;

    await test.step('TC_GoalWiseSip_030_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_030_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip030');
    });

    await test.step('TC_GoalWiseSip_030_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'goalwisesip030');
    });

    await test.step('TC_GoalWiseSip_030_4 | TC1 — Create a monthly gold SIP', async () => {
      // Same createSip/Emandate pattern as TC_GoalWiseSip_013.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal: goldMetal,
        frequency,
        amount: dataset.SIPEmandateAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      goldSipPlanName = result.planName;

      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
      });
    });

    await test.step('TC_GoalWiseSip_030_5 | TC2 — Purchase silver one-time', async () => {
      // Same as TC_GoalWiseSip_017 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const result = await buyMetalOneTime(page, 'silver');
      silverOneTimeQuantity = result.quantity;
      silverOneTimePaid = result.paidAmount;
    });

    await test.step('TC_GoalWiseSip_030_6 | Print the segment mobile number', async () => {
      // The SIP created above only becomes "Active" after the platform's SIP debit cron runs the
      // first installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_GoalWiseSip_030',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `created gold SIP plan "${goldSipPlanName}" (Active only after the SIP debit cron runs) and bought ${silverOneTimeQuantity}g silver one-time (paid ${silverOneTimePaid})`,
      );
    });
  });
});
