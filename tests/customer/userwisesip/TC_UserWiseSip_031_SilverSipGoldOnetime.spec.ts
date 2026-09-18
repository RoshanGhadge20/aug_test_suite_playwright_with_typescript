import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Silver SIP + Gold Onetime';
const DESCRIPTION = 'Users with a silver SIP and one-time gold purchases.';

// Silver SIP + Gold Onetime.
test.describe('TC_UserWiseSip_031 @regression @customer @userwisesip', () => {
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
    const silverMetal = parseSipMetalType(dataset.SIPMonthlySilverMetal);
    const frequency = parseSipFrequencyType(dataset.SIPMonthlyFrequency);
    const bankDetails = {
      bankName: dataset.BankName,
      accountHolderName: dataset.AccountHolderName,
      accountNumber: dataset.AccountNumber,
      ifscCode: dataset.IFSCCode,
      accountType: dataset.AccountType,
    };

    let mobile = '';
    let silverSipPlanName = '';
    let goldOneTimeQuantity = 0;
    let goldOneTimePaid = 0;

    await test.step('TC_UserWiseSip_031_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_031_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip031');
    });

    await test.step('TC_UserWiseSip_031_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'userwisesip031');
    });

    await test.step('TC_UserWiseSip_031_4 | TC1 — Create a monthly silver SIP', async () => {
      // Same createSip/Emandate pattern as TC_UserWiseSip_016.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal: silverMetal,
        frequency,
        amount: dataset.SIPMonthlyAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      silverSipPlanName = result.planName;

      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('TC_UserWiseSip_031_5 | TC2 — Purchase gold one-time', async () => {
      // Same as TC_UserWiseSip_003 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const result = await buyMetalOneTime(page, 'gold');
      goldOneTimeQuantity = result.quantity;
      goldOneTimePaid = result.paidAmount;
    });

    await test.step('TC_UserWiseSip_031_6 | Print the segment mobile number', async () => {
      // The SIP created above only becomes "Active" after the platform's SIP debit cron runs the
      // first installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_UserWiseSip_031',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `created silver SIP plan "${silverSipPlanName}" (Active only after the SIP debit cron runs) and bought ${goldOneTimeQuantity}g gold one-time (paid ${goldOneTimePaid})`,
      );
    });
  });
});
