import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './goalwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Silver SIP + Onetime';
const DESCRIPTION = 'Users who hold both a silver SIP and one-time silver purchases.';

// Silver SIP + Onetime: Users who hold both a silver SIP and one-time silver purchases.
test.describe('TC_GoalWiseSip_017 @regression @customer @goalwisesip', () => {
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
    const metal = parseSipMetalType(dataset.SIPMonthlySilverMetal);
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
    let oneTimeQuantity = 0;
    let oneTimePaidAmount = 0;

    await test.step('TC_GoalWiseSip_017_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_GoalWiseSip_017_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'goalwisesip017');
    });

    await test.step('TC_GoalWiseSip_017_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'goalwisesip017');
    });

    await test.step('TC_GoalWiseSip_017_4 | TC17_1 — Purchase silver one-time', async () => {
      // Same as TC_GoalWiseSip_003/014 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const result = await buyMetalOneTime(page, 'silver');
      oneTimeQuantity = result.quantity;
      oneTimePaidAmount = result.paidAmount;
    });

    await test.step('TC_GoalWiseSip_017_5 | TC17_2 — Create a monthly silver SIP', async () => {
      // Same createSip/Emandate pattern as TC_GoalWiseSip_016.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal,
        frequency,
        amount: dataset.SIPMonthlyAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      planName = result.planName;
    });

    await test.step('TC_GoalWiseSip_017_6 | Complete SIP setup payment via Emandate', async () => {
      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('TC_GoalWiseSip_017_7 | Print the segment mobile number', async () => {
      // The SIP created above only becomes "Active" after the platform's SIP debit cron runs the
      // first installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_GoalWiseSip_017',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `bought ${oneTimeQuantity}g silver one-time (paid ${oneTimePaidAmount}) and created monthly silver SIP plan "${planName}" (Active only after the SIP debit cron runs)`,
      );
    });
  });
});
