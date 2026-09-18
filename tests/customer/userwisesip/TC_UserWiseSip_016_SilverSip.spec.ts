import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Silver - SIP';
const DESCRIPTION = 'Users who have an active silver SIP.';

// Silver - SIP: Users who have an active silver SIP.
test.describe('TC_UserWiseSip_016 @regression @customer @userwisesip', () => {
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

    await test.step('TC_UserWiseSip_016_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_016_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip016');
    });

    await test.step('TC_UserWiseSip_016_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'userwisesip016');
    });

    await test.step('TC_UserWiseSip_016_4 | Create a monthly silver SIP', async () => {
      // Same createSip/Emandate pattern as TC_UserWiseSip_013 (gold) and TC_005 in
      // tests/customer/sipflow/sip-flows.spec.ts ("Create Silver SIP Monthly with Emandate and UPI").
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal,
        frequency,
        amount: dataset.SIPMonthlyAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      planName = result.planName;
    });

    await test.step('TC_UserWiseSip_016_5 | Complete SIP setup payment via Emandate', async () => {
      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('TC_UserWiseSip_016_6 | Print the segment mobile number', async () => {
      // This only gets the SIP plan created and the e-mandate authorized — it isn't "Active" yet.
      // That status flips only after the platform's SIP debit cron actually runs the first
      // scheduled installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_UserWiseSip_016',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `created monthly silver SIP plan "${planName}" — becomes Active only after the SIP debit cron runs the first installment (or you wait for the scheduled date); not forced by this test`,
      );
    });
  });
});
