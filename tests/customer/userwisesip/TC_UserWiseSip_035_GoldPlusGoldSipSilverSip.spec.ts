import { test } from '../../../fixtures/base.fixture';
import { registerNewUser } from '../../../flows/customer/registration.flow';
import { completeKycWithSharedPan } from '../../../flows/customer/kyc.flow';
import { completeProfileEmailAndGender } from '../../../flows/customer/profile-completion.flow';
import { createSipRetryingProfileBounce, paySipWithNewBankEmandate } from '../../../flows/customer/sip-emandate.flow';
import { subscribeToGoldPlusWithEmi } from '../../../flows/customer/gold-plus.flow';
import {
  getBuyMetalDataset,
  getSipFlowsDataset,
  parseSipMetalType,
  parseSipFrequencyType,
} from '../../../utils/data/customer-excel-data';
import { logSegment } from './userwisesip.helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const USER_TYPE = "Gold Plus + Gold SIP + Silver SIP";
const DESCRIPTION =
  "Gold Plus users with both a gold SIP and a silver SIP.";

test.describe('TC_UserWiseSip_035 @regression @customer @userwisesip', () => {
  test(`${USER_TYPE} — ${DESCRIPTION}`, async ({
    page,
    myProfilePage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
  }) => {
    test.setTimeout(240_000);

    const buyMetalDataset = getBuyMetalDataset();
    const sipDataset = getSipFlowsDataset();
    const silverMetal = parseSipMetalType(sipDataset.SIPMonthlySilverMetal);
    const goldMetal = parseSipMetalType(sipDataset.SIPMonthlyGoldMetal);
    const frequency = parseSipFrequencyType(sipDataset.SIPMonthlyFrequency);
    const bankDetails = {
      bankName: sipDataset.BankName,
      accountHolderName: sipDataset.AccountHolderName,
      accountNumber: sipDataset.AccountNumber,
      ifscCode: sipDataset.IFSCCode,
      accountType: sipDataset.AccountType,
    };

    let mobile = '';
    let silverPlanName = '';
    let goldPlanName = '';

    await test.step('TC_UserWiseSip_035_1 | Register with a unique, unregistered mobile number', async () => {
      ({ mobile } = await registerNewUser(page));
    });

    await test.step('TC_UserWiseSip_035_2 | Complete KYC for the new customer', async () => {
      await completeKycWithSharedPan(page, 'userwisesip035');
    });

    await test.step('TC_UserWiseSip_035_3 | Add and verify an email on My Profile', async () => {
      // KYC never touches the My Profile record — SIP creation redirects to /my-profile instead
      // of the buy page until email is verified + Gender is set (see profile-completion.flow.ts).
      await completeProfileEmailAndGender(page, myProfilePage, 'userwisesip035');
    });

    await test.step('TC_UserWiseSip_035_4 | Subscribe to Gold Plus (10gm, 3-month EMI, netbanking)', async () => {
      // Same transient post-KYC redirect as TC_032/033/034 — settle before driving Gold Plus.
      await page.waitForTimeout(3_000);
      await subscribeToGoldPlusWithEmi(page, {
        weightTab: '10 g',
        emiTenure: '3 months',
        contactNumber: buyMetalDataset.contactNumber,
        bankName: buyMetalDataset.netbankingBankName,
      });
    });

    await test.step('TC_UserWiseSip_035_5 | Create a monthly silver SIP', async () => {
      // Same createSip/Emandate pattern as TC_016 (silver), run against the Gold Plus account
      // from step 3.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal: silverMetal,
        frequency,
        amount: sipDataset.SIPMonthlyAmount,
        startAfterDays: Number(sipDataset.SIPStartAfterDays || 5),
        planPrefix: sipDataset.SIPMonthlyPlanPrefix,
      });
      silverPlanName = result.planName;
    });

    await test.step('TC_UserWiseSip_035_6 | Complete silver SIP setup payment via Emandate', async () => {
      // This account is always freshly registered, so it never has a saved bank — see
      // sip-emandate.flow.ts for why this bypasses completeEmandateWithBankSetup().
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: sipDataset.ContactNumber,
        emandateBankName: sipDataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('TC_UserWiseSip_035_7 | Create a monthly gold SIP', async () => {
      // Same createSip/Emandate pattern as TC_013 (gold). createSip navigates fresh to the buy
      // page each call, so this is safe to run right after the silver SIP above.
      const result = await createSipRetryingProfileBounce(page, buyMetalPage, {
        metal: goldMetal,
        frequency,
        amount: sipDataset.SIPEmandateAmount,
        startAfterDays: Number(sipDataset.SIPStartAfterDays || 5),
        planPrefix: sipDataset.SIPMonthlyPlanPrefix,
      });
      goldPlanName = result.planName;
    });

    await test.step('TC_UserWiseSip_035_8 | Complete gold SIP setup payment via Emandate', async () => {
      await paySipWithNewBankEmandate(buySummaryPage, addNewBankPage, paymentPage, {
        contactNumber: sipDataset.ContactNumber,
        emandateBankName: sipDataset.EmandateBankName,
        bankDetails,
      });
    });

    await test.step('TC_UserWiseSip_035_9 | Validate the Gold Plus order in My Orders — Shop tab', async () => {
      // My Orders defaults to the BUY tab (confirmed live in TC_032) — the Gold Plus order shows
      // under the SHOP tab.
      await page.goto('/my-orders');
      await page.waitForLoadState('domcontentloaded');
      await page.getByText('SHOP', { exact: true }).click();
      await page.getByText(/Gold Plus/i).first().waitFor({ state: 'visible', timeout: 20_000 });
    });

    await test.step('TC_UserWiseSip_035_10 | Print the segment mobile number', async () => {
      // As in TC_013/TC_016, each SIP plan is only created + e-mandate authorized here —
      // "Active" status flips only after the platform's SIP debit cron runs the first
      // scheduled installment for that plan.
      logSegment(
        'TC_UserWiseSip_035',
        USER_TYPE,
        DESCRIPTION,
        mobile,
        `subscribed to Gold Plus (10gm, 3-month EMI), created monthly silver SIP plan "${silverPlanName}" and monthly gold SIP plan "${goldPlanName}" — both SIPs become Active only after the debit cron runs their first installment`,
      );
    });
  });
});
