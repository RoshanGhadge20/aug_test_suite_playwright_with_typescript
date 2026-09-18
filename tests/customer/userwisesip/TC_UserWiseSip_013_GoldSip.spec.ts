import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { getSipFlowsDataset, parseSipMetalType, parseSipFrequencyType } from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = 'Gold - SIP';
const DESCRIPTION = 'Users who have an active gold SIP.';

// Gold - SIP: Users who have an active gold SIP.
test.describe('TC_UserWiseSip_013 @regression @customer @userwisesip', () => {
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

    await test.step('TC_UserWiseSip_013_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_013_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip013');
      // Same transient post-KYC redirect noted in gold-plus.flow.ts — proceeding immediately can
      // bounce mid-flow even though KYC just completed. Settle before touching My Profile/SIP.
      await page.waitForTimeout(3_000);
    });

    await test.step('TC_UserWiseSip_013_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record (see profile-completion.flow.ts) — SIP creation
      // redirects to /my-profile instead of the buy page until email is verified + Gender is set.
      await completeProfileEmailAndGender(page, myProfilePage, 'userwisesip013');
    });

    await test.step('TC_UserWiseSip_013_4 | Create a monthly gold SIP', async () => {
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal,
        frequency,
        amount: dataset.SIPEmandateAmount,
        startAfterDays: Number(dataset.SIPStartAfterDays || 5),
        planPrefix: dataset.SIPMonthlyPlanPrefix,
      });
      planName = result.planName;
    });

    await test.step('TC_UserWiseSip_013_5 | Complete SIP setup payment via Emandate', async () => {
      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
      });
    });

    await test.step('TC_UserWiseSip_013_6 | Print the segment mobile number', async () => {
      // This only gets the SIP plan created and the e-mandate authorized — it isn't "Active"
      // yet. That status flips only after the platform's SIP debit cron actually runs the first
      // scheduled installment (or you wait for that date); nothing in this test can force it.
      logSegment(
        'TC_UserWiseSip_013',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `created monthly gold SIP plan "${planName}" — becomes Active only after the SIP debit cron runs the first installment (or you wait for the scheduled date); not forced by this test`,
      );
    });
  });
});
