import { test, expect } from '../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../utils/data/customer-excel-data';

let planName = '';
const dataset = getSipFlowsDataset();
const sipStartAfterDays = Number(dataset.SIPStartAfterDays || 5);
const recreateSipStartAfterDays = 5;
let selectedSipStartDate = '';

test.describe('customer SIP flows @customer-flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('TC_001 - Create Gold SIP Weekly with Add New Bank and Payment done through emandate', async ({
    page,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    await test.step('Print TC_001 input values', async () => {
      const tc001Inputs = {
        SIPEmandateAmount: dataset.SIPEmandateAmount,
        SIPInvestmentDay: dataset.SIPInvestmentDay,
        SIPRecreateInvestmentDay: dataset.SIPRecreateInvestmentDay,
        SIPStartAfterDays: sipStartAfterDays,
        SIPDurationWeekly: dataset.SIPDurationWeekly,
        SIPStatus: dataset.SIPStatus,
        GoldLabel: dataset.GoldLabel,
        metal: dataset.metal,
        BankName: dataset.BankName,
        EmandateBankName: dataset.EmandateBankName,
        AccountHolderName: dataset.AccountHolderName,
        AccountNumber: dataset.AccountNumber,
        IFSCCode: dataset.IFSCCode,
        AccountType: dataset.AccountType,
        ContactNumber: dataset.ContactNumber,
      };
      console.log(`[TC_001 INPUTS] ${JSON.stringify(tc001Inputs, null, 2)}`);
    });

    await test.step('Navigate to SIP Gold and Create SIP Weekly', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalGold();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectWeeklyFrequency();
      await buyMetalPage.enterAmount(dataset.SIPEmandateAmount);
      await buyMetalPage.selectInvestmentDay(dataset.SIPInvestmentDay);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName();
      selectedSipStartDate = await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Verify SIP summary page and values', async () => {
      const investingAmount = Number(await buySummaryPage.getInvestingAmountSIP());
      console.log(
        `[TC_001 VALIDATION] investingAmount actual=${investingAmount} expected=${Number(dataset.SIPEmandateAmount)}`
      );
      expect(investingAmount).toBe(Number(dataset.SIPEmandateAmount));
      const isEditVisible = await buySummaryPage.isEditVisible();
      console.log(`[TC_001 VALIDATION] editVisible actual=${isEditVisible} expected=true`);
      expect(isEditVisible).toBe(true);
      const frequencyText = await buySummaryPage.getFrequencyText();
      console.log(`[TC_001 VALIDATION] frequency actual=${frequencyText} expected=${dataset.SIPDurationWeekly}`);
      expect(frequencyText).toBe(dataset.SIPDurationWeekly);
      const investmentPurposeText = await buySummaryPage.getInvestmentPurposeText();
      console.log(`[TC_001 VALIDATION] investmentPurpose actual=${investmentPurposeText} expected=${planName}`);
      expect(investmentPurposeText).toBe(planName);

      const metalType = (await buySummaryPage.getMetalTypeText(dataset.GoldLabel)).toLowerCase();
      console.log(`[TC_001 VALIDATION] metalType actual=${metalType} expected=${dataset.metal.toLowerCase()}`);
      expect(metalType).toBe(dataset.metal.toLowerCase());

      const sipStartDate = await buySummaryPage.getSipStartDate();
      const [day, month, year] = selectedSipStartDate.split('/');
      const expectedDate = `${year}-${month}-${day}`;
      console.log(`[TC_001 VALIDATION] sipStartDate actual=${sipStartDate} expected=${expectedDate}`);
      expect(sipStartDate).toBe(expectedDate);

      const amountPerWeek = Number(await buySummaryPage.getAmountPerWeek());
      console.log(
        `[TC_001 VALIDATION] amountPerWeek actual=${amountPerWeek} expected=${Number(dataset.SIPEmandateAmount)}`
      );
      expect(amountPerWeek).toBe(Number(dataset.SIPEmandateAmount));
    });

    await test.step('Cancel flow', async () => {
      await buySummaryPage.clickCancel();
      await expect(page.getByText('Yes, Cancel', { exact: true })).toBeVisible();
      await expect(page.getByText('No, Complete Process', { exact: true })).toBeVisible();

      await buySummaryPage.clickNoCompleteProcess();
      await expect(page).toHaveURL(/summary/);

      await buySummaryPage.clickCancel();
      await buySummaryPage.clickYesCancel();
      await expect(page).toHaveURL(/digital-gold/);
    });

    await test.step('Re-create SIP and proceed to payment', async () => {
      await buyMetalPage.selectWeeklyFrequency();
      await buyMetalPage.enterAmount(dataset.SIPEmandateAmount);
      await buyMetalPage.selectInvestmentDay(dataset.SIPRecreateInvestmentDay);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName();
      await buyMetalPage.enterStartDatePlusDays(recreateSipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buySummaryPage.getInvestmentPurposeText();
      await buySummaryPage.clickProceedToPay();
    });

    await test.step('Add New Bank', async () => {
      await addNewBankPage.clickAddNewBank();
      await addNewBankPage.openBankDropdown();
      await addNewBankPage.selectBankOption(dataset.BankName);
      await addNewBankPage.enterBeneficiaryName(dataset.AccountHolderName);
      await addNewBankPage.enterAccountNumber(dataset.AccountNumber);
      await addNewBankPage.enterIFSCCode(dataset.IFSCCode);
      await addNewBankPage.openAccountTypeDropdown();
      await addNewBankPage.selectAccountType(dataset.AccountType);
      await addNewBankPage.clickAddNew();
    });

    await test.step('Payment Method', async () => {
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickOnBankByNameEmandate(dataset.EmandateBankName);
      await paymentPage.clickContactContinue();
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate SIP details on Dashboard', async () => {
      await dashboardPage.clickViewAll();
      const sipName = await dashboardPage.getSipNameByText(planName).catch(async () => {
        const fallback = await (dashboardPage as any).getWeeklySipName();
        return fallback;
      });
      console.log(
        `[TC_001 VALIDATION] sipName actual=${sipName.toLowerCase()} expected-contains=sip_plan_weekly`
      );
      expect(sipName.toLowerCase()).toContain('sip_plan_weekly');
      const amountIsZero = await dashboardPage.validateAmountIsZero(sipName);
      console.log(`[TC_001 VALIDATION] amountIsZero actual=${amountIsZero} expected=true`);
      expect(amountIsZero).toBeTruthy();
      const weeklyAmount = await dashboardPage.getWeeklyAmount();
      console.log(
        `[TC_001 VALIDATION] weeklyAmount actual=${weeklyAmount} expected=${Number(dataset.SIPEmandateAmount)}`
      );
      expect(weeklyAmount).toBe(Number(dataset.SIPEmandateAmount));
      const statusText = await dashboardPage.getStatusText(sipName);
      console.log(`[TC_001 VALIDATION] statusText actual=${statusText} expected=${dataset.SIPStatus}`);
      expect(statusText).toBe(dataset.SIPStatus);
    });
  });

  test('TC_002 - Create Silver SIP Weekly with Emandate and UPI', async ({
    page,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    const sipUpiEmandateData = {
      amount: dataset.SIPWeeklyAmount,
      investmentDay: dataset.SIPWeeklyInvestmentDay,
      frequency: dataset.SIPWeeklyFrequency,
      metal: dataset.SIPWeeklySilverMetal,
    };
    test.setTimeout(180_000);

    await test.step('Create weekly SIP for silver', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalSilver();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectWeeklyFrequency();
      await buyMetalPage.enterAmount(sipUpiEmandateData.amount);
      await buyMetalPage.selectInvestmentDay(sipUpiEmandateData.investmentDay);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName();
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Validate summary and proceed', async () => {
      expect(Number(await buySummaryPage.getInvestingAmountSIP())).toBe(Number(sipUpiEmandateData.amount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      expect(await buySummaryPage.getFrequencyText()).toBe(sipUpiEmandateData.frequency);
      expect(await buySummaryPage.getInvestmentPurposeText()).toBe(planName);
      expect((await buySummaryPage.getMetalTypeText(dataset.SilverLabel)).toLowerCase()).toBe(sipUpiEmandateData.metal.toLowerCase());
      expect(Number(await buySummaryPage.getAmountPerWeek())).toBe(Number(sipUpiEmandateData.amount));
      await buySummaryPage.clickProceedToPay();
    });

    await test.step('Payment option checks', async () => {
      const options = await paymentPage.verifyUpiAndEmandateOptionsVisible();
      expect(options.secureUpi).toBe(true);
      expect(options.emandate).toBe(true);
      const urlAfterClose = await paymentPage.clickCloseAndWaitForSummary();
      expect(urlAfterClose).toMatch(/summary/);
    });

    await test.step('Complete eMandate flow', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.clickEmandate();
      const hasExistingBank = await paymentPage.selectBankOrAddNew();
      if (!hasExistingBank) {
        await addNewBankPage.openBankDropdown();
        await addNewBankPage.selectBankOption(dataset.BankName);
        await addNewBankPage.enterBeneficiaryName(dataset.AccountHolderName);
        await addNewBankPage.enterAccountNumber(dataset.AccountNumber);
        await addNewBankPage.enterIFSCCode(dataset.IFSCCode);
        await addNewBankPage.openAccountTypeDropdown();
        await addNewBankPage.selectAccountType(dataset.AccountType);
        await addNewBankPage.clickAddNew();
      }
      await paymentPage.clickPayButton();
    //  await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickOnBankByNameEmandate(dataset.EmandateBankName);
      await paymentPage.clickContactContinue();
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate on dashboard', async () => {
      await dashboardPage.clickViewAll();
      expect((await dashboardPage.getSipNameByText(planName)).toLowerCase()).toBe(planName.toLowerCase());
      expect(await dashboardPage.validateAmountIsZero(planName)).toBeTruthy();
      expect(await dashboardPage.getWeeklyAmount()).toBe(Number(sipUpiEmandateData.amount));
      expect(await dashboardPage.getStatusText(planName)).toBe(dataset.SIPStatus);
    });
  });

  test('TC_003 - Create Gold SIP Weekly with Emandate and UPI', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    const sipUpiEmandateData = {
      amount: dataset.SIPWeeklyAmount,
      investmentDay: dataset.SIPWeeklyInvestmentDay,
      frequency: dataset.SIPWeeklyFrequency,
      metal: dataset.metal,
    };
    test.setTimeout(180_000);

    await test.step('Create weekly SIP for gold', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalGold();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectWeeklyFrequency();
      await buyMetalPage.enterAmount(sipUpiEmandateData.amount);
      await buyMetalPage.selectInvestmentDay(sipUpiEmandateData.investmentDay);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName();
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Validate summary and proceed', async () => {
      expect(Number(await buySummaryPage.getInvestingAmountSIP())).toBe(Number(sipUpiEmandateData.amount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      expect(await buySummaryPage.getFrequencyText()).toBe(sipUpiEmandateData.frequency);
      expect(await buySummaryPage.getInvestmentPurposeText()).toBe(planName);
      expect((await buySummaryPage.getMetalTypeText(dataset.GoldLabel)).toLowerCase()).toBe(dataset.metal.toLowerCase());
      expect(Number(await buySummaryPage.getAmountPerWeek())).toBe(Number(sipUpiEmandateData.amount));
      await buySummaryPage.clickProceedToPay();
    });

    await test.step('Payment option checks and eMandate flow', async () => {
      const options = await paymentPage.verifyUpiAndEmandateOptionsVisible();
      expect(options.secureUpi).toBe(true);
      expect(options.emandate).toBe(true);

      const urlAfterClose = await paymentPage.clickCloseAndWaitForSummary();
      expect(urlAfterClose).toMatch(/summary/);

      await buySummaryPage.clickProceedToPay();
      await paymentPage.clickEmandate();
      const hasExistingBank = await paymentPage.selectBankOrAddNew();
      if (!hasExistingBank) {
        await addNewBankPage.openBankDropdown();
        await addNewBankPage.selectBankOption(dataset.BankName);
        await addNewBankPage.enterBeneficiaryName(dataset.AccountHolderName);
        await addNewBankPage.enterAccountNumber(dataset.AccountNumber);
        await addNewBankPage.enterIFSCCode(dataset.IFSCCode);
        await addNewBankPage.openAccountTypeDropdown();
        await addNewBankPage.selectAccountType(dataset.AccountType);
        await addNewBankPage.clickAddNew();
      }
      await paymentPage.clickPayButton();
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickOnBankByNameEmandate(dataset.EmandateBankName);
      await paymentPage.clickContactContinue();
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate on dashboard', async () => {
      await dashboardPage.clickViewAll();
      expect((await dashboardPage.getSipNameByText(planName)).toLowerCase()).toBe(planName.toLowerCase());
      expect(await dashboardPage.validateAmountIsZero(planName)).toBeTruthy();
      expect(await dashboardPage.getWeeklyAmount()).toBe(Number(sipUpiEmandateData.amount));
      expect(await dashboardPage.getStatusText(planName)).toBe(dataset.SIPStatus);
    });
  });

  test('TC_004 - Create Gold SIP Monthly with Emandate Payment', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    const sipMonthlyData = {
      amount: dataset.SIPEmandateAmount,
      frequency: dataset.SIPMonthlyFrequency,
      metal: dataset.SIPMonthlyGoldMetal,
      planPrefix: dataset.SIPMonthlyPlanPrefix,
    };
    test.setTimeout(180_000);

    await test.step('Print TC_004 input values', async () => {
      const tc004Inputs = {
        SIPEmandateAmount: sipMonthlyData.amount,
        SIPMonthlyFrequency: sipMonthlyData.frequency,
        SIPMonthlyGoldMetal: sipMonthlyData.metal,
        SIPMonthlyPlanPrefix: sipMonthlyData.planPrefix,
        SIPStartAfterDays: sipStartAfterDays,
        BankName: dataset.BankName,
        EmandateBankName: dataset.EmandateBankName,
        AccountHolderName: dataset.AccountHolderName,
        AccountNumber: dataset.AccountNumber,
        IFSCCode: dataset.IFSCCode,
        AccountType: dataset.AccountType,
        ContactNumber: dataset.ContactNumber,
        SIPStatus: dataset.SIPStatus,
      };
      console.log(`[TC_004 INPUTS] ${JSON.stringify(tc004Inputs, null, 2)}`);
    });

    await test.step('Create monthly SIP for gold', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalGold();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectMonthlyFrequency();
      await buyMetalPage.enterAmount(sipMonthlyData.amount);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName(sipMonthlyData.planPrefix);
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Validate monthly summary', async () => {
      expect(Number(await buySummaryPage.getInvestingAmountSIP())).toBe(Number(sipMonthlyData.amount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      expect(await buySummaryPage.getFrequencyText()).toBe(sipMonthlyData.frequency);
      expect(await buySummaryPage.getInvestmentPurposeText()).toBe(planName);
      expect((await buySummaryPage.getMetalTypeText(dataset.GoldLabel)).toLowerCase()).toBe(sipMonthlyData.metal.toLowerCase());
      expect(Number(await buySummaryPage.getAmountPerMonth())).toBe(Number(sipMonthlyData.amount));
    });

    await test.step('Complete monthly eMandate payment', async () => {
      await buySummaryPage.clickProceedToPay();;
      const hasExistingBank = await paymentPage.selectBankOrAddNew();
      if (!hasExistingBank) {
        await addNewBankPage.openBankDropdown();
        await addNewBankPage.selectBankOption(dataset.BankName);
        await addNewBankPage.enterBeneficiaryName(dataset.AccountHolderName);
        await addNewBankPage.enterAccountNumber(dataset.AccountNumber);
        await addNewBankPage.enterIFSCCode(dataset.IFSCCode);
        await addNewBankPage.openAccountTypeDropdown();
        await addNewBankPage.selectAccountType(dataset.AccountType);
        await addNewBankPage.clickAddNew();
      }
      await paymentPage.clickPayButton();
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickOnBankByNameEmandate(dataset.EmandateBankName);
      await paymentPage.clickContactContinue();
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate on dashboard', async () => {
      await dashboardPage.clickViewAll();
      const sipName = await dashboardPage.getSipNameByText(planName);
      console.log(
        `[TC_004 VALIDATION] sipName actual=${sipName.toLowerCase()} expected=${planName.toLowerCase()}`
      );
      expect(sipName.toLowerCase()).toBe(planName.toLowerCase());

      const amountIsZero = await dashboardPage.validateAmountIsZero(planName);
      console.log(`[TC_004 VALIDATION] amountIsZero actual=${amountIsZero} expected=true`);
      expect(amountIsZero).toBeTruthy();

      const monthlyAmount = await dashboardPage.getMonthlyAmount();
      console.log(
        `[TC_004 VALIDATION] monthlyAmount actual=${monthlyAmount} expected=${Number(sipMonthlyData.amount)}`
      );
      expect(monthlyAmount).toBe(Number(sipMonthlyData.amount));

      const statusText = await dashboardPage.getStatusText(planName);
      console.log(`[TC_004 VALIDATION] statusText actual=${statusText} expected=${dataset.SIPStatus}`);
      expect(statusText).toBe(dataset.SIPStatus);
    });
  });

  test('TC_005 - Create Silver SIP Monthly with Emandate and UPI', async ({
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    const sipMonthlyUpiData = {
      amount: dataset.SIPMonthlyAmount,
      frequency: dataset.SIPMonthlyFrequency,
      metal: dataset.SIPMonthlySilverMetal,
      planPrefix: dataset.SIPMonthlyPlanPrefix,
    };
    test.setTimeout(180_000);

    await test.step('Print TC_005 input values', async () => {
      const tc005Inputs = {
        SIPMonthlyAmount: sipMonthlyUpiData.amount,
        SIPMonthlyFrequency: sipMonthlyUpiData.frequency,
        SIPMonthlySilverMetal: sipMonthlyUpiData.metal,
        SIPMonthlyPlanPrefix: sipMonthlyUpiData.planPrefix,
        SIPStartAfterDays: sipStartAfterDays,
        BankName: dataset.BankName,
        EmandateBankName: dataset.EmandateBankName,
        AccountHolderName: dataset.AccountHolderName,
        AccountNumber: dataset.AccountNumber,
        IFSCCode: dataset.IFSCCode,
        AccountType: dataset.AccountType,
        ContactNumber: dataset.ContactNumber,
        SIPStatus: dataset.SIPStatus,
      };
      console.log(`[TC_005 INPUTS] ${JSON.stringify(tc005Inputs, null, 2)}`);
    });

    await test.step('Create monthly SIP for silver', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalSilver();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectMonthlyFrequency();
      await buyMetalPage.enterAmount(sipMonthlyUpiData.amount);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName(sipMonthlyUpiData.planPrefix);
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Validate summary and payment options', async () => {
      expect(Number(await buySummaryPage.getInvestingAmountSIP())).toBe(Number(sipMonthlyUpiData.amount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      expect(await buySummaryPage.getFrequencyText()).toBe(sipMonthlyUpiData.frequency);
      expect(await buySummaryPage.getInvestmentPurposeText()).toBe(planName);
      expect((await buySummaryPage.getMetalTypeText(dataset.SilverLabel)).toLowerCase()).toBe(sipMonthlyUpiData.metal.toLowerCase());
      expect(Number(await buySummaryPage.getAmountPerMonth())).toBe(Number(sipMonthlyUpiData.amount));
      await buySummaryPage.clickProceedToPay();

      const options = await paymentPage.verifyUpiAndEmandateOptionsVisible();
      expect(options.secureUpi).toBe(true);
      expect(options.emandate).toBe(true);
      const urlAfterClose = await paymentPage.clickCloseAndWaitForSummary();
      expect(urlAfterClose).toMatch(/summary/);
    });

    await test.step('Complete monthly eMandate payment', async () => {
      await buySummaryPage.clickProceedToPay();
      await paymentPage.clickEmandate();
      const hasExistingBank = await paymentPage.selectBankOrAddNew();
      if (!hasExistingBank) {
        await addNewBankPage.openBankDropdown();
        await addNewBankPage.selectBankOption(dataset.BankName);
        await addNewBankPage.enterBeneficiaryName(dataset.AccountHolderName);
        await addNewBankPage.enterAccountNumber(dataset.AccountNumber);
        await addNewBankPage.enterIFSCCode(dataset.IFSCCode);
        await addNewBankPage.openAccountTypeDropdown();
        await addNewBankPage.selectAccountType(dataset.AccountType);
        await addNewBankPage.clickAddNew();
      }
      await paymentPage.clickPayButton();
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickOnBankByNameEmandate(dataset.EmandateBankName);
      await paymentPage.clickContactContinue();
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate on dashboard', async () => {
      await dashboardPage.clickViewAll();
      const sipName = await dashboardPage.getSipNameByText(planName);
      console.log(
        `[TC_005 VALIDATION] sipName actual=${sipName.toLowerCase()} expected=${planName.toLowerCase()}`
      );
      expect(sipName.toLowerCase()).toBe(planName.toLowerCase());

      const amountIsZero = await dashboardPage.validateAmountIsZero(planName);
      console.log(`[TC_005 VALIDATION] amountIsZero actual=${amountIsZero} expected=true`);
      expect(amountIsZero).toBeTruthy();

      const monthlyAmount = await dashboardPage.getMonthlyAmount();
      console.log(
        `[TC_005 VALIDATION] monthlyAmount actual=${monthlyAmount} expected=${Number(sipMonthlyUpiData.amount)}`
      );
      expect(monthlyAmount).toBe(Number(sipMonthlyUpiData.amount));

      const statusText = await dashboardPage.getStatusText(planName);
      console.log(`[TC_005 VALIDATION] statusText actual=${statusText} expected=${dataset.SIPStatus}`);
      expect(statusText).toBe(dataset.SIPStatus);
    });
  });
});
