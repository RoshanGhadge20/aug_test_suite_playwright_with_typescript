import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer withdrawal', () => {
  test('withdrawal from Gold Vault and transfer to bank account', async ({ page, dashboardPage, withdrawalPage }) => {
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let currentUrl = '';
    let goldVault = 0;
    let sellingPrice = 0;
    let validQty = 0;
    let invalidQty = 0;

    await test.step('Get and validate portfolio values', async () => {
      await page.goto('/dashboard');

      portfolioValue = await dashboardPage.getPortfolioValueNumber();
      console.log('Total Portfolio Value (Rs):', portfolioValue);

      totalGoldBeforePurchase = await dashboardPage.getTotalGoldValue();
      console.log('Total Gold (g):', totalGoldBeforePurchase);
      expect(totalGoldBeforePurchase).toBeGreaterThan(0);

      totalSilverBeforePurchase = await dashboardPage.getTotalSilverValue();
      console.log('Total Silver (g):', totalSilverBeforePurchase);

      goldFD = await dashboardPage.getGoldFDValue();
      console.log('Gold FD+ Value:', goldFD);
      expect(goldFD).not.toBe('');
    });

    await test.step('Verify Cancel and Proceed buttons are visible', async () => {
      await dashboardPage.clickWithdrawInvestment();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
    });

    await test.step('Capture current URL', async () => {
      currentUrl = page.url();
    });

    await test.step('Click Cancel button', async () => {
      await withdrawalPage.clickCancel();
    });

    await test.step('Verify same URL after clicking Cancel', async () => {
      await expect(page).toHaveURL(currentUrl);
    });

    await test.step('Click Proceed and verify navigation', async () => {
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.clickProceed();
      await expect(page).not.toHaveURL(currentUrl);
    });

    await test.step('Deposit flow', async () => {
      await withdrawalPage.clickDeposit();
      await withdrawalPage.clickDepositProceed();
    });

    await test.step('Validate investment details with values', async () => {
      const totalInvestment = await withdrawalPage.getTotalInvestmentValue();
      console.log('Total Investment:', totalInvestment);

      const totalGold = await withdrawalPage.getTotalGoldValue();
      console.log('Total Investment Gold:', totalGold);

      const totalSilver = await withdrawalPage.getTotalSilverValue();
      console.log('Total Investment Silver:', totalSilver);

      goldVault = await withdrawalPage.getGoldVaultValue();
      console.log('Total Investment Gold Vault:', goldVault);

      await withdrawalPage.clickVaultProceed('Gold Vault');
    });

    await test.step('Verify withdrawal details', async () => {
      const withdrawing = await withdrawalPage.getWithdrawingValue();
      console.log('Withdrawing value before quantity:', withdrawing);

      const remaining = await withdrawalPage.getRemainingValue();
      console.log('Remaining value before quantity:', remaining);

      sellingPrice = await withdrawalPage.getSellingPrice();
      console.log('Selling Price:', sellingPrice);
    });

    await test.step('Enter quantity greater than total gold vault amount and validate error', async () => {
      invalidQty = Number((goldVault + 0.01).toFixed(4));
      await withdrawalPage.enterQuantity(invalidQty);
      console.log('Entered invalid quantity:', invalidQty);
      const errorText = await withdrawalPage.getQuantityErrorText();
      expect(errorText).not.toBe('');
    });

    await test.step('Verify Proceed button is disabled for invalid quantity', async () => {
      const isDisabled = await withdrawalPage.isProceedButtonDisabled();
      expect(isDisabled).toBe(true);
    });

    await test.step('Enter quantity less than gold vault and validate Proceed enabled', async () => {
      if (goldVault <= 0.01) {
        throw new Error(`Gold vault value is too low for withdrawal test: ${goldVault}`);
      }
      validQty = Number((goldVault - 0.01).toFixed(4));
      await withdrawalPage.enterQuantity(validQty);
      console.log('Entered valid quantity:', validQty);

      const isEnabled = await withdrawalPage.isProceedButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    await test.step('Validate withdrawing and remaining after valid quantity', async () => {
      await withdrawalPage.enterQuantity(validQty);

      const withdrawingValue = await withdrawalPage.getWithdrawingValue();
      const remainingValue = await withdrawalPage.getRemainingValue();

      console.log('Entered:', validQty);
      console.log('Withdrawing:', withdrawingValue);
      console.log('Remaining:', remainingValue);

      expect(withdrawingValue).toBeCloseTo(validQty, 2);
      const expectedRemaining = goldVault - validQty;
      expect(remainingValue).toBeCloseTo(expectedRemaining, 2);

      await Promise.all([
        page.waitForURL('**/withdraw/account-details'),
        withdrawalPage.clickProceed(),
      ]);
      console.log('Proceed button clicked');
    });

    await test.step('Validate timer on account details page', async () => {
      expect(await withdrawalPage.isTimerVisible()).toBe(true);

      const time1 = await withdrawalPage.getTimerText();
      console.log('Initial timer text:', time1);
      expect(time1).toMatch(/^\d{1,2}:\d{2}$/);

      await withdrawalPage.waitForTimerChange(time1);
      const time2 = await withdrawalPage.getTimerText();
      console.log('Before:', time1);
      console.log('After:', time2);

      const sec1 = withdrawalPage.convertToSeconds(time1);
      const sec2 = withdrawalPage.convertToSeconds(time2);
      expect(sec2).toBeLessThan(sec1);
    });

    await test.step('Validate account details, bank selection, and amount calculation', async () => {
      const goldValue = await withdrawalPage.getGoldValueFromDetails();
      const amount = await withdrawalPage.getAmountFromAccountDetails();
      const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();

      console.log('Gold:', goldValue);
      console.log('Amount:', amount);
      console.log('Total:', totalAmount);
      console.log('Selling price:', sellingPrice);

      const expectedAmount = goldValue * sellingPrice;
      expect(totalAmount).toBeCloseTo(expectedAmount, 2);
      expect(amount).toBeCloseTo(expectedAmount, 2);

      await withdrawalPage.selectBankAccount();
      const totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
      console.log('Total Withdraw Amount:', totalAmountWithdraw);
      expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);

      await withdrawalPage.clickProceedToWithdraw();
    });
  });
});
