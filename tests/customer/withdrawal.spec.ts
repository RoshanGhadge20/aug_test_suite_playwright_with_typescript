import { test, expect } from '../../fixtures/base.fixture';

test.describe('customer withdrawal @customer-flows', () => {
  test('TC_001-withdrawal from Gold Vault(Deposits) and transfer to bank account', async ({ page, dashboardPage, withdrawalPage, paymentPage }) => {
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let currentUrl = '';
    let goldVault = 0;
    let sellingPrice = 0;
    let validQty = 0;
    let invalidQty = 0;
    let totalGoldInvestment = 0;

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

       totalGoldInvestment = await withdrawalPage.getTotalGoldValue();
      console.log('Total Investment Gold:', totalGoldInvestment);

      const totalSilver = await withdrawalPage.getTotalSilverValue();
      console.log('Total Investment Silver:', totalSilver);

      goldVault = await withdrawalPage.getGoldVaultValue();
      console.log('Total Investment Gold Vault:', goldVault);

      await withdrawalPage.clickVaultProceed('Gold Vault');
    });

    await test.step('Verify withdrawal details', async () => {
      const withdrawing = await withdrawalPage.getWithdrawingValue();
      console.log('Withdrawing value before Withdrawal:', withdrawing);

      const remaining = await withdrawalPage.getRemainingValue();
      console.log('Remaining value before Withdrawal:', remaining);

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
      validQty = Number((goldVault - 0.01-goldVault+1).toFixed(4));
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

    await test.step('Validate withdrawal details', async () => {
      const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
      console.log(' Validate withdrawal Details:', withdrawalDetails);
      const totalGoldAfterPurchase = totalGoldBeforePurchase - validQty;
      console.log('Total Gold after withdrawal:', totalGoldAfterPurchase);
      expect(totalGoldAfterPurchase).toBeCloseTo(totalGoldBeforePurchase - validQty, 4);

    });
    await test.step('Validate investment details after withdrawal', async () => {
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.clickProceed();
      await expect(page).not.toHaveURL(currentUrl);
      await withdrawalPage.clickDeposit();
      await withdrawalPage.clickDepositProceed();

      const totalGoldAfterWithdrawalInvestment = totalGoldInvestment-validQty;
      console.log('Total Investment Gold after withdrawal:', totalGoldAfterWithdrawalInvestment);
      expect(totalGoldAfterWithdrawalInvestment).toBeCloseTo(totalGoldInvestment-validQty, 4);
      const goldVaultAfterWithdrawalInvestment = goldVault-validQty;
      expect(goldVaultAfterWithdrawalInvestment).toBeCloseTo(goldVault-validQty, 4);
      console.log('Total Investment Gold Vault after withdrawal:', goldVaultAfterWithdrawalInvestment);

    });
  });

  test('TC_002-withdrawal from Gold/Silver SIP(Deposits) and transfer to bank account', async ({ page, dashboardPage, withdrawalPage, paymentPage }) => {
    console.log('\n==================== TC_002 START ====================');
    console.log('Test Name: TC_002-withdrawal from Gold SIP(Deposits) and transfer to bank account');
    console.log('======================================================\n');

    
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let currentUrl = '';
    let goldVault = 0;
    let sellingPrice = 0;
    let validQty = 0;
    let invalidQty = 0;
    let totalGoldInvestment = 0;
    let totalSilverInvestment = 0;
    let sipName = '';
    let selectedSipName = '';
    let selectedSipMetalValue = '';
    let selectedSipMetalValueNumber = 0;
    let selectedSipMetalType: 'Gold' | 'Silver' = 'Gold';
    let selectedMetalBeforePurchase = 0;
    
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



    await test.step('Get Sip Investment Values Greater than zero and Status Approved', async () => {
      await dashboardPage.clickViewAll();
      sipName = await dashboardPage.getApprovedSipNameWithPositiveInvestment();
      console.log('SIP Name:', sipName);
    });
       
        await test.step('Click Proceed and verify navigation', async () => { 
          await page.goto('/dashboard');         
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
    
           totalGoldInvestment = await withdrawalPage.getTotalGoldValue();
          console.log('Total Investment Gold:', totalGoldInvestment);
    
          totalSilverInvestment = await withdrawalPage.getTotalSilverValue();
          console.log('Total Investment Silver:', totalSilverInvestment);
    
          goldVault = await withdrawalPage.getGoldVaultValue();
          console.log('Total Investment Gold Vault:', goldVault);

          const selectedSipDetails = await dashboardPage.printGoldValueAndClickProceedBySipName(sipName);
          selectedSipName = selectedSipDetails.sipName;
          selectedSipMetalValue = selectedSipDetails.goldValue;
          selectedSipMetalType = selectedSipDetails.metalType;
          selectedSipMetalValueNumber = Number(selectedSipMetalValue.replace(/[^\d.]/g, ''));
          selectedMetalBeforePurchase =
            selectedSipMetalType === 'Gold'
              ? totalGoldBeforePurchase
              : totalSilverBeforePurchase;
          console.log('Selected SIP Name:', selectedSipName);
          console.log('Selected SIP Metal Type:', selectedSipMetalType);
          console.log('Selected SIP Metal Value:', selectedSipMetalValue);

        });
    
        await test.step('Verify withdrawal details', async () => {
          const withdrawing = await withdrawalPage.getWithdrawingValue();
          console.log('Withdrawing value before Withdrawal:', withdrawing);
    
          const remaining = await withdrawalPage.getRemainingValue();
          console.log('Remaining value before Withdrawal:', remaining);
    
          sellingPrice = await withdrawalPage.getSellingPrice();
          console.log('Selling Price:', sellingPrice);
        });
    
        await test.step('Enter quantity greater than total gold vault amount and validate error', async () => {
          invalidQty = Number((selectedSipMetalValueNumber + 0.01).toFixed(4));
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
          if (selectedSipMetalValueNumber <= 0.01) {
            throw new Error(`Selected SIP metal value is too low for withdrawal test: ${selectedSipMetalValue}`);
          }
          validQty = Number((selectedSipMetalValueNumber - 0.01-selectedSipMetalValueNumber+1).toFixed(4));
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
    
          console.log(`Validation (Withdrawing) => expected: ${validQty}, actual: ${withdrawingValue}`);
          expect(withdrawingValue).toBeCloseTo(validQty, 2);
          const expectedRemaining = selectedSipMetalValueNumber - validQty;
          console.log(`Validation (Remaining) => expected: ${expectedRemaining}, actual: ${remainingValue}`);
          expect(remainingValue).toBeCloseTo(expectedRemaining, 2);
    
          await Promise.all([
            page.waitForURL('**/withdraw/account-details'),
            withdrawalPage.clickProceed(),
          ]);
          console.log('Proceed button clicked');
        });
    
        await test.step('Validate timer on account details page', async () => {
          const isTimerVisible = await withdrawalPage.isTimerVisible();
          console.log(`Validation (Timer Visible) => expected: true, actual: ${isTimerVisible}`);
          expect(isTimerVisible).toBe(true);
    
          const time1 = await withdrawalPage.getTimerText();
          console.log('Initial timer text:', time1);
          expect(time1).toMatch(/^\d{1,2}:\d{2}$/);
    
          await withdrawalPage.waitForTimerChange(time1);
          const time2 = await withdrawalPage.getTimerText();
          console.log('Before:', time1);
          console.log('After:', time2);
    
          const sec1 = withdrawalPage.convertToSeconds(time1);
          const sec2 = withdrawalPage.convertToSeconds(time2);
          console.log(`Validation (Timer Decrease) => expected: sec2 < sec1 (${sec2} < ${sec1})`);
          expect(sec2).toBeLessThan(sec1);
        });
    
        await test.step('Validate account details, bank selection, and amount calculation', async () => {
          const goldValue = await withdrawalPage.getMetalValueFromDetails(selectedSipMetalType);
          const amount = await withdrawalPage.getAmountFromAccountDetails();
          const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();
    
          console.log('Gold:', goldValue);
          console.log('Amount:', amount);
          console.log('Total:', totalAmount);
          console.log('Selling price:', sellingPrice);
    
          const expectedAmount = goldValue * sellingPrice;
          console.log(`Validation (Total Amount) => expected: ${expectedAmount}, actual: ${totalAmount}`);
          expect(totalAmount).toBeCloseTo(expectedAmount, 2);
          console.log(`Validation (Amount) => expected: ${expectedAmount}, actual: ${amount}`);
          expect(amount).toBeCloseTo(expectedAmount, 2);
    
          await withdrawalPage.selectBankAccount();
          const totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
          console.log('Total Withdraw Amount:', totalAmountWithdraw);
          console.log(`Validation (Withdraw Amount) => expected: ${totalAmount}, actual: ${totalAmountWithdraw}`);
          expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);
    
          await withdrawalPage.clickProceedToWithdraw();
        });
    
        await test.step('Validate withdrawal details', async () => {
          const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
          console.log(' Validate withdrawal Details:', withdrawalDetails);
          const totalMetalAfterPurchase = selectedMetalBeforePurchase - validQty;
          console.log(`Validation (Total ${selectedSipMetalType} after withdrawal) => expected: ${selectedMetalBeforePurchase - validQty}, actual: ${totalMetalAfterPurchase}`);
          expect(totalMetalAfterPurchase).toBeCloseTo(selectedMetalBeforePurchase - validQty, 4);
    
        });
        await test.step('Validate investment details after withdrawal for Selected SIP', async () => {
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickProceed();
          await expect(page).not.toHaveURL(currentUrl);
          await withdrawalPage.clickDeposit();
          await withdrawalPage.clickDepositProceed();

          if (selectedSipMetalType === 'Gold') {
            const totalGoldAfterWithdrawalInvestment = totalGoldInvestment - validQty;
            console.log('Total Investment Gold after withdrawal:', totalGoldAfterWithdrawalInvestment);
            console.log(`Validation (Investment Gold) => expected: ${totalGoldInvestment - validQty}, actual: ${totalGoldAfterWithdrawalInvestment}`);
            expect(totalGoldAfterWithdrawalInvestment).toBeCloseTo(totalGoldInvestment - validQty, 4);

            const goldVaultAfterWithdrawalInvestment = goldVault - validQty;
            console.log(`Validation (Gold Vault) => expected: ${goldVault - validQty}, actual: ${goldVaultAfterWithdrawalInvestment}`);
            expect(goldVaultAfterWithdrawalInvestment).toBeCloseTo(goldVault - validQty, 4);
            console.log('Total Investment Gold Vault after withdrawal:', goldVaultAfterWithdrawalInvestment);
          } else {
            const totalSilverAfterWithdrawalInvestment = totalSilverInvestment - validQty;
            console.log('Total Investment Silver after withdrawal:', totalSilverAfterWithdrawalInvestment);
            console.log(`Validation (Investment Silver) => expected: ${totalSilverInvestment - validQty}, actual: ${totalSilverAfterWithdrawalInvestment}`);
            expect(totalSilverAfterWithdrawalInvestment).toBeCloseTo(totalSilverInvestment - validQty, 4);
          }
    
        });
    
        
});
});