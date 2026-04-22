import { test, expect } from '../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../utils/data/customer-excel-data';

let planName = '';
const dataset = getSipFlowsDataset();
const sipStartAfterDays = Number(dataset.SIPStartAfterDays || 5);

test.describe('customer SIP flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('TC_001 - Create Gold SIP Weekly with Add New Bank and Payment', async ({
    page,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    addNewBankPage,
    dashboardPage,
  }) => {
    test.setTimeout(180_000);

    await test.step('Navigate to SIP Gold and Create SIP Weekly', async () => {
      await buyMetalPage.hoverOnProductsAndClickDigitalGold();
      await buyMetalPage.clickOnCreateSIP();
      await buyMetalPage.selectWeeklyFrequency();
      await buyMetalPage.enterAmount(dataset.SIPEmandateAmount);
      await buyMetalPage.selectInvestmentDay(dataset.SIPInvestmentDay);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buyMetalPage.enterUniquePlanName();
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
    });

    await test.step('Verify SIP summary page and values', async () => {
      const investingAmount = Number(await buySummaryPage.getInvestingAmountSIP());
      expect(investingAmount).toBe(Number(dataset.SIPEmandateAmount));
      expect(await buySummaryPage.isEditVisible()).toBe(true);
      expect(await buySummaryPage.getFrequencyText()).toBe(dataset.SIPDurationWeekly);
      expect(await buySummaryPage.getInvestmentPurposeText()).toBe(planName);

      const metalType = (await buySummaryPage.getMetalTypeText(dataset.GoldLabel)).toLowerCase();
      expect(metalType).toBe(dataset.metal.toLowerCase());

      const sipStartDate = await buySummaryPage.getSipStartDate();
      const expectedDate = new Date(Date.now() + sipStartAfterDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      expect(sipStartDate).toBe(expectedDate);

      const amountPerWeek = Number(await buySummaryPage.getAmountPerWeek());
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
      await buyMetalPage.enterStartDatePlusDays(sipStartAfterDays);
      await buyMetalPage.clickOnCreateSIP();
      planName = await buySummaryPage.getInvestmentPurposeText();
      await buySummaryPage.clickProceedToPay();
    });

    await test.step('Add New Bank', async () => {
      await paymentPage.clickEmandate();
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
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
      await paymentPage.clickContactContinue();
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.getPriceSummaryEmandate();
      await paymentPage.clickAadhaarEmandate();
      await paymentPage.clickAuthenticate();
      await paymentPage.completeEmandateFlow();
    });

    await test.step('Validate SIP details on Dashboard', async () => {
      await dashboardPage.clickViewAll();
      const sipName = await dashboardPage.getSipNameByText(planName);
      expect(sipName.toLowerCase()).toBe(planName.toLowerCase());
      expect(await dashboardPage.validateAmountIsZero(planName)).toBeTruthy();
      expect(await dashboardPage.getWeeklyAmount()).toBe(Number(dataset.SIPEmandateAmount));
      expect(await dashboardPage.getStatusText(planName)).toBe(dataset.SIPStatus);
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
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
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
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
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
      amount: dataset.SIPMonthlyAmount,
      frequency: dataset.SIPMonthlyFrequency,
      metal: dataset.SIPMonthlyGoldMetal,
      planPrefix: dataset.SIPMonthlyPlanPrefix,
    };

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
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
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
      expect(await dashboardPage.getMonthlyAmount()).toBe(Number(sipMonthlyData.amount));
      expect(await dashboardPage.getStatusText(planName)).toBe(dataset.SIPStatus);
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
      await paymentPage.clickOnBankByCodeEmandate('KKBK');
      await paymentPage.enterPhoneNumber(dataset.ContactNumber);
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
      expect(await dashboardPage.getMonthlyAmount()).toBe(Number(sipMonthlyUpiData.amount));
      expect(await dashboardPage.getStatusText(planName)).toBe(dataset.SIPStatus);
    });
  });
});
