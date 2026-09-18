import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { buyMetalOneTime } from '../../../flows/customer/buy-metal.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold SIP + Silver SIP + Gold Onetime + Silver Onetime';
const DESCRIPTION = 'Users holding a gold SIP, silver SIP, one-time gold, and one-time silver.';

// Gold SIP + Silver SIP + Gold Onetime + Silver Onetime.
test.describe('TC_UserWiseSip_029 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    myProfilePage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
  }) => {
    test.setTimeout(240_000);

    const dataset = getSipFlowsDataset();
    const goldMetal = parseSipMetalType(dataset.SIPMonthlyGoldMetal);
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
    let goldSipPlanName = '';
    let silverSipPlanName = '';
    let goldOneTimeQuantity = 0;
    let goldOneTimePaid = 0;
    let silverOneTimeQuantity = 0;
    let silverOneTimePaid = 0;

    await test.step('TC_UserWiseSip_029_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_029_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip029');
    });

    await test.step('TC_UserWiseSip_029_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'userwisesip029');
    });

    await test.step('TC_UserWiseSip_029_4 | TC1 — Create a monthly gold SIP', async () => {
      // Same createSip/Emandate pattern as TC_UserWiseSip_013.
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

    await test.step('TC_UserWiseSip_029_5 | TC2 — Create a monthly silver SIP', async () => {
      // Same createSip/Emandate pattern as TC_UserWiseSip_016.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal: silverMetal,
        frequency,
        amount: dataset.SIPMonthlyAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      silverSipPlanName = result.planName;

      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('TC_UserWiseSip_029_6 | TC3 — Purchase gold one-time', async () => {
      // Same as TC_UserWiseSip_003 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const result = await buyMetalOneTime(page, 'gold');
      goldOneTimeQuantity = result.quantity;
      goldOneTimePaid = result.paidAmount;
    });

    await test.step('TC_UserWiseSip_029_7 | TC4 — Purchase silver one-time', async () => {
      // Same as TC_UserWiseSip_017 — buyMetalOneTime (flows/customer/buy-metal.flow.ts).
      const result = await buyMetalOneTime(page, 'silver');
      silverOneTimeQuantity = result.quantity;
      silverOneTimePaid = result.paidAmount;
    });

    await test.step('TC_UserWiseSip_029_8 | Print the segment mobile number', async () => {
      // Both SIPs created above only become "Active" after the platform's SIP debit cron runs
      // each one's first installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_UserWiseSip_029',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `gold SIP "${goldSipPlanName}" + silver SIP "${silverSipPlanName}" (Active only after cron runs); bought ${goldOneTimeQuantity}g gold (paid ${goldOneTimePaid}) and ${silverOneTimeQuantity}g silver (paid ${silverOneTimePaid}) one-time`,
      );
    });
  });
});
