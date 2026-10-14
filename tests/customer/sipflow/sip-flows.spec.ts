import { test } from '../../../fixtures/base.fixture';
import {
  getSipFlowsDataset,
  parseSipFrequencyType,
  parseSipMetalType,
} from '../../../utils/data/customer-excel-data';

const dataset = getSipFlowsDataset();
const sipStartAfterDays = Number(dataset.SIPStartAfterDays || 5);
const recreateSipStartAfterDays = 5;

const bankDetails = {
  bankName: dataset.BankName,
  accountHolderName: dataset.AccountHolderName,
  accountNumber: dataset.AccountNumber,
  ifscCode: dataset.IFSCCode,
  accountType: dataset.AccountType,
};

// Dashboard SIP card shows the plan amount with western grouping, e.g. "SIP: ₹100,000/weekly".
const sipDashboardAmount = (amount: string): string => Number(amount).toLocaleString('en-US');
const sipDashboardStatus = dataset.SIPStatus;

test.describe('customer SIP flows @customer-flows', () => {
  // test.beforeEach(async ({ page, dashboardPage }) => {
  //   await page.goto('/dashboard');
  //   await dashboardPage.waitForDashboardPortfolioSection();
  // });

  test('TC_001 - Create Gold SIP Weekly with Add New Bank and Payment done through emandate', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    const tc001Data = {
      metal: dataset.SIPMetal,
      frequency: dataset.SIPFrequency,
      amount: dataset.SIPEmandateAmount,
      investmentDay: dataset.SIPInvestmentDay,
      recreateInvestmentDay: dataset.SIPRecreateInvestmentDay,
      frequencyLabel: dataset.SIPDurationWeekly,
      metalLabel: dataset.SIPMetal === 'gold' ? dataset.GoldLabel : dataset.SilverLabel,
      metalName: dataset.metal,
      planPrefix: `Sip_plan_${dataset.SIPFrequency}`,
    };

    let planName = '';
    let selectedSipStartDate = '';
    let recreatedPlanName = '';

    await test.step('createSip', async () => {
      const result = await buyMetalPage.createSip({
        metal: tc001Data.metal,
        frequency: tc001Data.frequency,
        amount: tc001Data.amount,
        investmentDay: tc001Data.investmentDay,
        startAfterDays: sipStartAfterDays,
        planPrefix: tc001Data.planPrefix,
      });
      planName = result.planName;
      selectedSipStartDate = result.startDate;
    });

    await test.step('validateSipSummary', async () => {
      await buySummaryPage.validateSipSummary({
        amount: tc001Data.amount,
        frequency: tc001Data.frequencyLabel,
        planName,
        metalLabel: tc001Data.metalLabel,
        metal: tc001Data.metalName,
        frequencyType: tc001Data.frequency,
        selectedSipStartDate,
      });
    });

    await test.step('cancelSipFlow', async () => {
      await buySummaryPage.cancelSipFlow();
    });

    await test.step('recreateSip', async () => {
      await buyMetalPage.createSip({
        metal: tc001Data.metal,
        frequency: tc001Data.frequency,
        amount: tc001Data.amount,
        investmentDay: tc001Data.recreateInvestmentDay,
        startAfterDays: recreateSipStartAfterDays,
        planPrefix: tc001Data.planPrefix,
      });
    });

    await test.step('confirmRecreateAndProceed', async () => {
      recreatedPlanName = await buySummaryPage.confirmRecreateAndProceed(tc001Data.frequencyLabel);
    });

    await test.step('addBankDetails', async () => {
      await addNewBankPage.addBankDetails(bankDetails);
    });

    await test.step('completeEmandatePayment', async () => {
      await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
    });

    await test.step('validateSipOnDashboard', async () => {
      await dashboardPage.clickViewAll();
      await dashboardPage.validateSipDetailsOnDashboard(
        recreatedPlanName,
        sipDashboardAmount(tc001Data.amount),
        sipDashboardStatus,
        tc001Data.frequency,
      );
    });
  });

  test('TC_002 - Create Silver SIP Weekly with Emandate and UPI', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    const tc002Data = {
      metal: parseSipMetalType(dataset.SIPWeeklySilverMetal),
      frequency: parseSipFrequencyType(dataset.SIPWeeklyFrequency),
      amount: dataset.SIPWeeklyAmount,
      investmentDay: dataset.SIPWeeklyInvestmentDay,
      frequencyLabel: dataset.SIPWeeklyFrequency,
      metalLabel: dataset.SilverLabel,
      metalName: dataset.SIPWeeklySilverMetal,
      planPrefix: 'Sip_plan_weekly',
    };

    let planName = '';

    await test.step('createSip', async () => {
      const result = await buyMetalPage.createSip({
        metal: tc002Data.metal,
        frequency: tc002Data.frequency,
        amount: tc002Data.amount,
        investmentDay: tc002Data.investmentDay,
        startAfterDays: sipStartAfterDays,
        planPrefix: tc002Data.planPrefix,
      });
      planName = result.planName;
    });

    await test.step('validateSipSummaryAndProceed', async () => {
      await buySummaryPage.validateSipSummaryAndProceed({
        amount: tc002Data.amount,
        frequency: tc002Data.frequencyLabel,
        planName,
        metalLabel: tc002Data.metalLabel,
        metal: tc002Data.metalName,
        frequencyType: tc002Data.frequency,
      });
    });

    await test.step('assertUpiAndEmandateVisibleAndCloseToSummary', async () => {
      await paymentPage.assertUpiAndEmandateVisibleAndCloseToSummary();
    });

    await test.step('completeEmandateWithBankSetup', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.completeEmandateWithBankSetup(addNewBankPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('validateSipOnDashboard', async () => {
      await dashboardPage.clickViewAll();
      await dashboardPage.validateSipDetailsOnDashboard(
        planName,
        sipDashboardAmount(tc002Data.amount),
        sipDashboardStatus,
        tc002Data.frequency,
      );
    });
  });

  test('TC_003 - Create Gold SIP Weekly with Emandate and UPI', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    const tc003Data = {
      metal: parseSipMetalType(dataset.SIPWeeklyGoldMetal),
      frequency: parseSipFrequencyType(dataset.SIPWeeklyFrequency),
      amount: dataset.SIPWeeklyAmount,
      investmentDay: dataset.SIPWeeklyInvestmentDay,
      frequencyLabel: dataset.SIPWeeklyFrequency,
      metalLabel: dataset.GoldLabel,
      metalName: dataset.SIPWeeklyGoldMetal,
      planPrefix: 'Sip_plan_weekly',
    };

    let planName = '';

    await test.step('createSip', async () => {
      const result = await buyMetalPage.createSip({
        metal: tc003Data.metal,
        frequency: tc003Data.frequency,
        amount: tc003Data.amount,
        investmentDay: tc003Data.investmentDay,
        startAfterDays: sipStartAfterDays,
        planPrefix: tc003Data.planPrefix,
      });
      planName = result.planName;
    });

    await test.step('validateSipSummaryAndProceed', async () => {
      await buySummaryPage.validateSipSummaryAndProceed({
        amount: tc003Data.amount,
        frequency: tc003Data.frequencyLabel,
        planName,
        metalLabel: tc003Data.metalLabel,
        metal: tc003Data.metalName,
        frequencyType: tc003Data.frequency,
      });
    });

    await test.step('assertUpiAndEmandateVisibleAndCloseToSummary', async () => {
      await paymentPage.assertUpiAndEmandateVisibleAndCloseToSummary();
    });

    await test.step('completeEmandateWithBankSetup', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.completeEmandateWithBankSetup(addNewBankPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('validateSipOnDashboard', async () => {
      await dashboardPage.clickViewAll();
      await dashboardPage.validateSipDetailsOnDashboard(
        planName,
        sipDashboardAmount(tc003Data.amount),
        sipDashboardStatus,
        tc003Data.frequency,
      );
    });
  });

  test('TC_004 - Create Gold SIP Monthly with Emandate Payment', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    const tc004Data = {
      metal: parseSipMetalType(dataset.SIPMonthlyGoldMetal),
      frequency: parseSipFrequencyType(dataset.SIPMonthlyFrequency),
      amount: dataset.SIPEmandateAmount,
      frequencyLabel: dataset.SIPMonthlyFrequency,
      metalLabel: dataset.GoldLabel,
      metalName: dataset.SIPMonthlyGoldMetal,
      planPrefix: dataset.SIPMonthlyPlanPrefix,
    };

    let planName = '';

    await test.step('createSip', async () => {
      const result = await buyMetalPage.createSip({
        metal: tc004Data.metal,
        frequency: tc004Data.frequency,
        amount: tc004Data.amount,
        startAfterDays: sipStartAfterDays,
        planPrefix: tc004Data.planPrefix,
      });
      planName = result.planName;
    });

    await test.step('validateSipSummary', async () => {
      await buySummaryPage.validateSipSummary({
        amount: tc004Data.amount,
        frequency: tc004Data.frequencyLabel,
        planName,
        metalLabel: tc004Data.metalLabel,
        metal: tc004Data.metalName,
        frequencyType: tc004Data.frequency,
      });
    });

    await test.step('completeEmandateWithBankSetup', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.completeEmandateWithBankSetup(addNewBankPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
      });
    });

    await test.step('validateSipOnDashboard', async () => {
      await dashboardPage.clickViewAll();
      await dashboardPage.validateSipDetailsOnDashboard(
        planName,
        sipDashboardAmount(tc004Data.amount),
        sipDashboardStatus,
        tc004Data.frequency,
      );
    });
  });

  test('TC_005 - Create Silver SIP Monthly with Emandate and UPI', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    const tc005SipStartDate = (() => {
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(target.getDate() + sipStartAfterDays);
      if ([29, 30, 31].includes(target.getDate())) {
        return new Date(target.getFullYear(), target.getMonth() + 1, 1);
      }
      return target;
    })();

    const pad = (n: number): string => String(n).padStart(2, '0');
    console.log(
      `[TC_005] SIP start date (TC005 rule): ${pad(tc005SipStartDate.getDate())}/${pad(tc005SipStartDate.getMonth() + 1)}/${tc005SipStartDate.getFullYear()}`,
    );

    const tc005Data = {
      metal: parseSipMetalType(dataset.SIPMonthlySilverMetal),
      frequency: parseSipFrequencyType(dataset.SIPMonthlyFrequency),
      amount: dataset.SIPMonthlyAmount,
      frequencyLabel: dataset.SIPMonthlyFrequency,
      metalLabel: dataset.SilverLabel,
      metalName: dataset.SIPMonthlySilverMetal,
      planPrefix: dataset.SIPMonthlyPlanPrefix,
      startDateOverride: tc005SipStartDate,
    };

    let planName = '';

    await test.step('createSip', async () => {
      const result = await buyMetalPage.createSip({
        metal: tc005Data.metal,
        frequency: tc005Data.frequency,
        amount: tc005Data.amount,
        startAfterDays: sipStartAfterDays,
        planPrefix: tc005Data.planPrefix,
        startDateOverride: tc005Data.startDateOverride,
      });
      planName = result.planName;
    });

    await test.step('validateSipSummaryAndProceed', async () => {
      await buySummaryPage.validateSipSummaryAndProceed({
        amount: tc005Data.amount,
        frequency: tc005Data.frequencyLabel,
        planName,
        metalLabel: tc005Data.metalLabel,
        metal: tc005Data.metalName,
        frequencyType: tc005Data.frequency,
      });
    });

    await test.step('assertUpiAndEmandateVisibleAndCloseToSummary', async () => {
      await paymentPage.assertUpiAndEmandateVisibleAndCloseToSummary();
    });

    await test.step('completeEmandateWithBankSetup', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.completeEmandateWithBankSetup(addNewBankPage, {
        contactNumber: dataset.ContactNumber,
        emandateBankName: dataset.EmandateBankName,
        bankDetails,
        useEmandateTab: true,
      });
    });

    await test.step('validateSipOnDashboard', async () => {
      await dashboardPage.clickViewAll();
      await dashboardPage.validateSipDetailsOnDashboard(
        planName,
        sipDashboardAmount(tc005Data.amount),
        sipDashboardStatus,
        tc005Data.frequency,
      );
    });
  });
});
