import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold SIP + Onetime';
const DESCRIPTION = 'Users who hold both a gold SIP and one-time gold purchases.';

// Gold SIP + Onetime: Users who hold both a gold SIP and one-time gold purchases.
test.describe('TC_GoalWiseSip_014 @regression @customer @goalwisesip', () => {
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
    const metal = parseSipMetalType(dataset.SIPMonthlyGoldMetal);
    const frequency = parseSipFrequencyType(dataset.SIPMonthlyFrequency);
    const bankDetails = {
      bankName: dataset.BankName,
      accountHolderName: dataset.AccountHolderName,
      accountNumber: dataset.AccountNumber,
      ifscCode: dataset.IFSCCode,
      accountType: dataset.AccountType,
    };

    let mobile = '';
    let planName = '';

    await test.step('TC_GoalWiseSip_014_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_014_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip014');
    });

    await test.step('TC_GoalWiseSip_014_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'goalwisesip014');
    });

    await test.step('TC_GoalWiseSip_014_4 | Create a gold SIP', async () => {
      // Same createSip/Emandate pattern as TC_GoalWiseSip_013 and TC_004 in
      // tests/customer/sipflow/sip-flows.spec.ts ("Create Gold SIP Monthly with Emandate Payment").
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal,
        frequency,
        amount: dataset.SIPEmandateAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      planName = result.planName;
    });

    await test.step('TC_GoalWiseSip_014_5 | Complete SIP setup payment via Emandate', async () => {
      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
      });
    });

    await test.step('TC_GoalWiseSip_014_6 | Purchase gold one-time (single investment on top of the SIP)', async () => {
      // Same as TC_GoalWiseSip_003 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const { quantity, paidAmount } = await buyMetalOneTime(page, 'gold');

      // SIP created above becomes "Active" only after the platform's SIP debit cron runs the
      // first installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_GoalWiseSip_014',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `created gold SIP plan "${planName}" (Active only after the SIP debit cron runs) and bought ${quantity}g gold one-time, paid ${paidAmount}`,
      );
    });
  });
});
