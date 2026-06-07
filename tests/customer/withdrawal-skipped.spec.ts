import { test, expect } from '../../fixtures/base.fixture';
import { getWithdrawalTc003Dataset, getWithdrawalTc004Dataset } from '../../utils/data/customer-excel-data';

const tc003Dataset = getWithdrawalTc003Dataset();
const tc004Dataset = getWithdrawalTc004Dataset();

test.describe('withdrawal-skipped @customer-flows', () => {
  test.skip('TC_001-withdrawal from Gold Vault(Deposits) and transfer to bank account @customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage, myOrderVerificationPage }) => {
    const TC001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC001(n)}] ${title}`);
    };

    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let currentUrl = '';
    let goldVault = 0;
    let sellingPrice = 0;
    let validQty = 0;
    let totalGoldInvestment = 0;
    let totalAmountWithdraw = 0;

    await test.step('TC001_1 | Get and validate portfolio values', async () => {
      logSub(1, 'Get and validate portfolio values');
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

    // await test.step('TC001_2 | Verify Cancel and Proceed buttons are visible', async () => {
    //   logSub(2, 'Verify Cancel and Proceed buttons are visible');
    //   await dashboardPage.clickWithdrawInvestment();
    //   await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    //   await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
    // });

    // await test.step('TC001_3 | Capture current URL', async () => {
    //   logSub(3, 'Capture current URL');
    //   currentUrl = page.url();
    // });

    // await test.step('TC001_4 | Click Cancel button', async () => {
    //   logSub(4, 'Click Cancel button');
    //   await withdrawalPage.clickCancel();
    // });

    // await test.step('TC001_5 | Verify same URL after clicking Cancel', async () => {
    //   logSub(5, 'Verify same URL after clicking Cancel');
    //   await expect(page).toHaveURL(currentUrl);
    // });

    await test.step('TC001_6 | verify two options are visible get cash and get coins and bars', async () => {
      logSub(6, 'verify two options are visible get cash and get coins and bars');
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.verifyGetCoinAndCashOptionVisible();
      await withdrawalPage.clickGetCashOption();
      await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
    });

    // await test.step('TC001_7 | Deposit flow', async () => {
    //   logSub(7, 'Deposit flow');
    //   await withdrawalPage.clickDeposit();
    //   await withdrawalPage.clickDepositProceed();
    // });

    await test.step('TC001_8 | get investment values gold', async () => {
      logSub(8, 'get investment values gold');
      await withdrawalPage.getTotalGoldValueInRsAndLog();

      totalGoldInvestment = await withdrawalPage.getTotalGoldValueInGramAndLog();
      console.log('Total Investment Gold:', totalGoldInvestment);

      const goldVaultSummary = await withdrawalPage.getGoldVaultValueInGramAndAmountInRsAndLog();
      goldVault = goldVaultSummary.goldVaultInGram;
      console.log('Total Investment Gold Vault:', goldVault);

      await withdrawalPage.clickVaultProceed('Gold Vault');
    });

    await test.step('TC001_9 | Verify withdrawal details', async () => {
      logSub(9, 'Verify withdrawal details');
      const withdrawing = await withdrawalPage.getWithdrawingValue();
      console.log('Withdrawing value before Withdrawal:', withdrawing);

      const remaining = await withdrawalPage.getRemainingValue();
      console.log('Remaining value before Withdrawal:', remaining);

      sellingPrice = await withdrawalPage.getSellingPrice();
      console.log('Selling Price:', sellingPrice);
    });

    await test.step('TC001_10 | Enter quantity less than gold vault and validate Proceed enabled', async () => {
      logSub(10, 'Enter valid quantity');
      if (goldVault <= 0.01) {
        throw new Error(`Gold vault value is too low for withdrawal test: ${goldVault}`);
      }
      validQty = Number(((goldVault+0.01)-goldVault).toFixed(4));
      await withdrawalPage.enterQuantity(validQty);
      console.log('Entered valid quantity:', validQty);

      const isEnabled = await withdrawalPage.isProceedButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    await test.step('TC001_11 | Validate withdrawing and remaining after valid quantity', async () => {
      logSub(11, 'Validate withdrawing and remaining');
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

    await test.step('TC001_12 | Validate timer on account details page', async () => {
      logSub(12, 'Validate timer on account details page');
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

    await test.step('TC001_13 | Validate account details, bank selection, and amount calculation', async () => {
      logSub(13, 'Validate account details and amount');
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
      totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
      console.log('Total Withdraw Amount:', totalAmountWithdraw);
      expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);

      await withdrawalPage.clickProceedToWithdraw();
    });

    await test.step('TC001_14 | Validate withdrawal details on dashboard', async () => {
      logSub(14, 'Validate withdrawal details on dashboard');
      const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
      console.log(' Validate withdrawal Details:', withdrawalDetails);
      const totalGoldAfterPurchase = totalGoldBeforePurchase - validQty;
      console.log('Total Gold after withdrawal:', totalGoldAfterPurchase);
      expect(totalGoldAfterPurchase).toBeCloseTo(totalGoldBeforePurchase - validQty, 4);

    });
    
    await test.step('TC001_15 | Validate order details for withdrawn item in My Orders > Sell', async () => {
      logSub(15, 'Validate My Orders sell card details');
      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.clickSellTab();
      await myOrderVerificationPage.waitForSellWithdrawalOrderRow(totalAmountWithdraw);

      const sellCard = await myOrderVerificationPage.getLatestSellOrderCardDetails();

      console.log('[TC001_15] Sell card Date:', sellCard.date);
      console.log('[TC001_15] Sell card Transaction ID:', sellCard.transactionId);
      console.log('[TC001_15] Sell card Narration:', sellCard.narration);
      console.log('[TC001_15] Sell card Amount:', sellCard.amountText);

      const currentDate = new Date().toLocaleDateString('en-GB');
      expect(sellCard.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(sellCard.date).toBe(currentDate);
      expect(sellCard.transactionId).not.toBe('');
      expect(sellCard.narration).toContain('Sold');
      expect(sellCard.narration).toContain(validQty.toFixed(4));
      expect(sellCard.amountValue).toBeCloseTo(totalAmountWithdraw, 1);
      await myOrderVerificationPage.clickViewStatusOnLatestOrderRow();

      const orderDetails = await myOrderVerificationPage.getViewStatusOrderDetails();
      console.log('[TC001_15] View Status Transaction ID:', orderDetails.transactionId);
      console.log('[TC001_15] View Status Narration:', orderDetails.narration);
      console.log('[TC001_15] View Status Rate per 1 gm:', orderDetails.ratePerGm);
      console.log('[TC001_15] View Status Amount:', orderDetails.amount);
      console.log('[TC001_15] View Status Total Amount:', orderDetails.totalAmount);
      console.log('[TC001_15] View Status Current Status:', orderDetails.currentStatus);
      console.log('[TC001_15] View Status Payment Ref No:', orderDetails.paymentRefNo);
      console.log('[TC001_15] View Status Payment Mode:', orderDetails.paymentMode);
      console.log('[TC001_15] View Status Payment Date:', orderDetails.paymentDate);

      const parsedRatePerGm = Number((orderDetails.ratePerGm.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
      const parsedAmount = Number((orderDetails.amount.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
      const narrationQty = Number((orderDetails.narration.match(/([\d.]+)\s*gm/i)?.[1] ?? '0').trim());

      expect(orderDetails.narration).toContain('Sold');
      expect(narrationQty).toBeCloseTo(validQty, 4);
      expect(parsedRatePerGm).toBeCloseTo(sellingPrice, 2);
      expect(parsedAmount).toBeCloseTo(totalAmountWithdraw, 1);
      expect(orderDetails.currentStatus).toMatch(/^Pending$/i);
    });

    await test.step('TC001_16 | Validate investment details after withdrawal on investment page', async () => {
      logSub(16, 'Validate investment details after withdrawal');
      await page.goto('/dashboard');
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


  test.skip('TC_002-withdrawal from Gold/Silver SIP(Deposits) and transfer to bank account @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
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
    let totalGoldInvestment = 0;
    let totalSilverInvestment = 0;
    let selectedSipName = '';
    let selectedSipMetalValue = '';
    let selectedSipMetalValueNumber = 0;
    let selectedSipMetalType: 'Gold' | 'Silver' = 'Gold';
    let selectedMetalBeforePurchase = 0;
    let totalAmountWithdraw = 0;
    const TC002 = (n: number): string => `TC002_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC002(n)}] ${title}`);
    };

    const gotoDashboardWithRetry = async (): Promise<void> => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          return;
        } catch (error) {
          if (attempt === 2) {
            throw error;
          }
          console.warn(`[TC_002] Dashboard navigation attempt ${attempt} failed. Retrying once...`);
        }
      }
    };
    
    await test.step('TC002_1 | Get and validate portfolio values', async () => {
      logSub(1, 'Get and validate portfolio values');
      await gotoDashboardWithRetry();

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



    await test.step('TC002_2 | Open SIP investment list', async () => {
      logSub(2, 'Open SIP investment list');
      await dashboardPage.clickViewAll();
    });
       
        await test.step('TC002_3 | Click Proceed and verify navigation', async () => {
          logSub(3, 'Click Proceed and verify navigation');
          await gotoDashboardWithRetry();
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickProceed();
          await expect(page).not.toHaveURL(currentUrl);

        });
    
        await test.step('TC002_4 | Deposit flow', async () => {
          logSub(4, 'Deposit flow');
          await withdrawalPage.clickDeposit();
          await withdrawalPage.clickDepositProceed();
        });
    
        await test.step('TC002_5 | Validate investment details with values', async () => {
          logSub(5, 'Validate investment details with values');
          const totalInvestment = await withdrawalPage.getTotalInvestmentValue();
          console.log('Total Investment:', totalInvestment);
    
           totalGoldInvestment = await withdrawalPage.getTotalGoldValue();
          console.log('Total Investment Gold:', totalGoldInvestment);
    
          totalSilverInvestment = await withdrawalPage.getTotalSilverValue();
          console.log('Total Investment Silver:', totalSilverInvestment);
    
          goldVault = await withdrawalPage.getGoldVaultValue();
          console.log('Total Investment Gold Vault:', goldVault);

          const selectedSipDetails = await dashboardPage.printGoldValueAndClickProceedBySipName(undefined, {
            minValueThreshold: 0.01,
            scrollDirection: 'up',
          });
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
          if (selectedSipMetalType === 'Gold') {
            await withdrawalPage.getTotalGoldInGramFromGoldVaultAndSipValueAndLog(
              goldVault,
              selectedSipMetalValueNumber,
            );
          }

        });
    
        await test.step('TC002_6 | Verify withdrawal details', async () => {
          logSub(6, 'Verify withdrawal details');
          const withdrawing = await withdrawalPage.getWithdrawingValue();
          console.log('Withdrawing value before Withdrawal:', withdrawing);
    
          const remaining = await withdrawalPage.getRemainingValue();
          console.log('Remaining value before Withdrawal:', remaining);
    
          sellingPrice = await withdrawalPage.getSellingPrice();
          console.log('Selling Price:', sellingPrice);
        });
    
        await test.step('TC002_7 | Enter quantity less than gold or silver SIP amount and validate Proceed enabled', async () => {
          logSub(7, 'Enter valid quantity and verify Proceed enabled');
          if (selectedSipMetalValueNumber <= 0.01) {
            throw new Error(`Selected SIP metal value is too low for withdrawal test: ${selectedSipMetalValue}`);
          }
          validQty = Number((selectedSipMetalValueNumber - 0.01).toFixed(4));
          await withdrawalPage.enterQuantity(validQty);
          console.log('Entered valid quantity:', validQty);
    
          const isEnabled = await withdrawalPage.isProceedButtonEnabled();
          expect(isEnabled).toBe(true);
        });
    
        await test.step('TC002_8 | Validate withdrawing and remaining after valid quantity', async () => {
          logSub(8, 'Validate withdrawing and remaining');
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
    
        await test.step('TC002_9 | Validate timer on account details page', async () => {
          logSub(9, 'Validate timer on account details page');
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
    
        await test.step('TC002_10 | Validate account details, bank selection, and amount calculation', async () => {
          logSub(10, 'Validate account details and amount calculation');
          const goldValue = await withdrawalPage.getMetalValueFromDetails(selectedSipMetalType);
          const amount = await withdrawalPage.getAmountFromAccountDetails();
          const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();
    
          console.log('metal value:', goldValue);
          console.log('Amount:', amount);
          console.log('Total:', totalAmount);
          console.log('Selling price:', sellingPrice);
    
          const expectedAmount = goldValue * sellingPrice;
          console.log(`Validation (Total Amount) => expected: ${expectedAmount}, actual: ${totalAmount}`);
          expect(totalAmount).toBeCloseTo(expectedAmount, 2);
          console.log(`Validation (Amount) => expected: ${expectedAmount}, actual: ${amount}`);
          expect(amount).toBeCloseTo(expectedAmount, 2);
    
          await withdrawalPage.selectBankAccount();
          totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
          console.log('Total Withdraw Amount:', totalAmountWithdraw);
          console.log(`Validation (Withdraw Amount) => expected: ${totalAmount}, actual: ${totalAmountWithdraw}`);
          expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);
    
          await withdrawalPage.clickProceedToWithdraw();
        });
    
        await test.step('TC002_11 | Validate withdrawal details on Dashboard', async () => {
          logSub(11, 'Validate withdrawal details on Dashboard');
          const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
          console.log(' Validate withdrawal Details:', withdrawalDetails);
          console.log(`Total ${selectedSipMetalType} before purchase:`, selectedMetalBeforePurchase);
          const totalMetalAfterPurchase = selectedMetalBeforePurchase - validQty;
          console.log(
            `Validation (Total ${selectedSipMetalType} after withdrawal) => expected=selectedMetalBeforePurchase-validQty (${selectedMetalBeforePurchase}-${validQty}=${selectedMetalBeforePurchase - validQty}), actual=${totalMetalAfterPurchase}`,
          );
          expect(totalMetalAfterPurchase).toBeCloseTo(selectedMetalBeforePurchase - validQty, 4);
    
        });

        await test.step('TC002_12 | Validate order details for withdrawn item in My Orders > Sell', async () => {
          logSub(12, 'Validate My Orders sell card details');
          await myOrderVerificationPage.goToMyOrders();
          await myOrderVerificationPage.clickSellTab();
          await myOrderVerificationPage.waitForSellWithdrawalOrderRow(totalAmountWithdraw);

          const sellCard = await myOrderVerificationPage.getLatestSellOrderCardDetails();

          console.log('[TC002_12] Sell card Date:', sellCard.date);
          console.log('[TC002_12] Sell card Transaction ID:', sellCard.transactionId);
          console.log('[TC002_12] Sell card Narration:', sellCard.narration);
          console.log('[TC002_12] Sell card Amount:', sellCard.amountText);

          const currentDate = new Date().toLocaleDateString('en-GB');
          expect(sellCard.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
          expect(sellCard.date).toBe(currentDate);
          expect(sellCard.transactionId).not.toBe('');
          expect(sellCard.narration).toContain('Sold');
          expect(sellCard.narration).toContain(validQty.toFixed(4));
          expect(sellCard.amountValue).toBeCloseTo(totalAmountWithdraw, 1);
          await myOrderVerificationPage.clickViewStatusOnLatestOrderRow();

          const orderDetails = await myOrderVerificationPage.getViewStatusOrderDetails();
          console.log('[TC002_12] View Status Transaction ID:', orderDetails.transactionId);
          console.log('[TC002_12] View Status Narration:', orderDetails.narration);
          console.log('[TC002_12] View Status Rate per 1 gm:', orderDetails.ratePerGm);
          console.log('[TC002_12] View Status Amount:', orderDetails.amount);
          console.log('[TC002_12] View Status Total Amount:', orderDetails.totalAmount);
          console.log('[TC002_12] View Status Current Status:', orderDetails.currentStatus);
          console.log('[TC002_12] View Status Payment Ref No:', orderDetails.paymentRefNo);
          console.log('[TC002_12] View Status Payment Mode:', orderDetails.paymentMode);
          console.log('[TC002_12] View Status Payment Date:', orderDetails.paymentDate);

          const parsedRatePerGm = Number((orderDetails.ratePerGm.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
          const parsedAmount = Number((orderDetails.amount.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
          const narrationQty = Number((orderDetails.narration.match(/([\d.]+)\s*gm/i)?.[1] ?? '0').trim());

          expect(orderDetails.narration).toContain('Sold');
          expect(narrationQty).toBeCloseTo(validQty, 4);
          expect(parsedRatePerGm).toBeCloseTo(sellingPrice, 2);
          expect(parsedAmount).toBeCloseTo(totalAmountWithdraw, 1);
          expect(orderDetails.currentStatus).toMatch(/^Pending$/i);
        });

        await test.step('TC002_13 | Validate investment details after withdrawal for Selected SIP from investment page', async () => {
          logSub(13, 'Validate investment details after withdrawal for Selected SIP from investment page');
          await page.goto('/dashboard');
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickProceed();
          await expect(page).not.toHaveURL(currentUrl);
          await withdrawalPage.clickDeposit();
          await withdrawalPage.clickDepositProceed();

          if (selectedSipMetalType === 'Gold') {
            console.log('Total Investment Gold before withdrawal:', totalGoldInvestment);
            const totalGoldAfterWithdrawalInvestment = totalGoldInvestment - validQty;
            console.log('Total Investment Gold after withdrawal:', totalGoldAfterWithdrawalInvestment);
            console.log(
              `Validation (Investment Gold) => expected=totalGoldInvestment-validQty (${totalGoldInvestment}-${validQty}=${totalGoldInvestment - validQty}), actual=${totalGoldAfterWithdrawalInvestment}`,
            );
            expect(totalGoldAfterWithdrawalInvestment).toBeCloseTo(totalGoldInvestment - validQty, 4);
          } else {
            console.log('Total Investment Silver before withdrawal:', totalSilverInvestment);
            const totalSilverAfterWithdrawalInvestment = totalSilverInvestment - validQty;
            console.log('Total Investment Silver after withdrawal:', totalSilverAfterWithdrawalInvestment);
            console.log(
              `Validation (Investment Silver) => expected=totalSilverInvestment-validQty (${totalSilverInvestment}-${validQty}=${totalSilverInvestment - validQty}), actual=${totalSilverAfterWithdrawalInvestment}`,
            );
            expect(totalSilverAfterWithdrawalInvestment).toBeCloseTo(totalSilverInvestment - validQty, 4);
          }
    
        });
    
        
});

test.skip('TC_003 - Withdraw from Silver Vault with Add Bank validation and error message checks @customer-flows',
  async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage }) => {
  console.log('\n==================== TC_003 START ====================');
  console.log(
    'Test Name: TC_003 - Withdraw from Silver Vault with Add Bank validation and error message checks',
  );
  console.log('======================================================\n');

  const TC003 = (n: number): string => `TC003_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC003(n)}] ${title}`);
  };

  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let currentUrl = '';
  let goldVault = 0;
  let silverVault = 0;
  let sellingPrice = 0;
  let validQty = 0;
  let invalidQty = 0;
  let totalGoldInvestment = 0;

  await test.step('TC003_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
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

  await test.step('TC003_2 | Click Proceed and verify navigation', async () => {
    logSub(2, 'Click Proceed and verify navigation');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC003_3 | Deposit flow', async () => {
    logSub(3, 'Deposit flow');
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  });

  await test.step('TC003_4 | Validate investment details with values', async () => {
    logSub(4, 'Validate investment details with values');
    const totalInvestment = await withdrawalPage.getTotalInvestmentValue();
    console.log('Total Investment:', totalInvestment);

     totalGoldInvestment = await withdrawalPage.getTotalGoldValue();
    console.log('Total Investment Gold:', totalGoldInvestment);

    const totalSilver = await withdrawalPage.getTotalSilverValue();
    console.log('Total Investment Silver:', totalSilver);

    goldVault = await withdrawalPage.getGoldVaultValue();
    console.log('Total Investment Gold Vault:', goldVault);

    silverVault = await withdrawalPage.getSilverVaultValue();
    console.log('Total Investment Silver Vault:', silverVault);
    if (silverVault <= 0) {
      console.log('[TC003_4] insufficient vault balance');
      throw new Error('insufficient vault balance');
    }
    await withdrawalPage.clickVaultProceed('Silver Vault');
  });

  await test.step('TC003_5 | Verify withdrawal details', async () => {
    logSub(5, 'Verify withdrawal details');
    const withdrawing = await withdrawalPage.getWithdrawingValue();
    console.log('Withdrawing value before Withdrawal:', withdrawing);

    const remaining = await withdrawalPage.getRemainingValue();
    console.log('Remaining value before Withdrawal:', remaining);

    sellingPrice = await withdrawalPage.getSellingPrice();
    console.log('Selling Price:', sellingPrice);
  });

  await test.step('TC003_6 | Enter quantity less than silver vault and validate Proceed enabled', async () => {
    logSub(6, 'Enter quantity less than silver vault and validate Proceed enabled');
    if (silverVault <= 0.01) {
      throw new Error(`Silver vault value is too low for withdrawal test: ${silverVault}`);
    }
    validQty = Number((silverVault - 0.01).toFixed(4));
    await withdrawalPage.enterQuantity(validQty);
    console.log('Entered valid quantity:', validQty);

    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });


  await test.step('TC003_7 | Validate withdrawing and remaining after valid quantity', async () => {
    logSub(7, 'Validate withdrawing and remaining after valid quantity');
    await withdrawalPage.enterQuantity(validQty);

    const withdrawingValue = await withdrawalPage.getWithdrawingValue();
    const remainingValue = await withdrawalPage.getRemainingValue();

    console.log('Entered:', validQty);
    console.log('Withdrawing:', withdrawingValue);
    console.log('Remaining:', remainingValue);

    expect(withdrawingValue).toBeCloseTo(validQty, 2);
    const expectedRemaining = silverVault - validQty;
    expect(remainingValue).toBeCloseTo(expectedRemaining, 2);

    await Promise.all([
      page.waitForURL('**/withdraw/account-details'),
      withdrawalPage.clickProceed(),
    ]);
    console.log('Proceed button clicked');
  });

  await test.step('TC003_8 | Validate account details', async () => {
    logSub(8, 'Validate account details');
    const silverValue = await withdrawalPage.getMetalValueFromDetails('Silver');
    const amount = await withdrawalPage.getAmountFromAccountDetails();
    const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();

    console.log('Silver:', silverValue);
    console.log('Amount:', amount);
    console.log('Total:', totalAmount);
    console.log('Selling price:', sellingPrice);

    const expectedAmount = silverValue * sellingPrice;
    expect(totalAmount).toBeCloseTo(expectedAmount, 2);
    expect(amount).toBeCloseTo(expectedAmount, 2);

  });

  await test.step('TC003_9 | Add New Bank with Invalid IFSCCode and verify transaction', async () => {
    logSub(9, 'Add New Bank with Invalid IFSCCode and verify transaction');
    const accountNumber = tc003Dataset.invalidIfscAccountNumber;
    const ifscCode = tc003Dataset.invalidIfscCode;
    const expectedIfscErrorMessage = tc003Dataset.expectedInvalidIfscMessage;
    console.log(`[${test.info().title}] Input values`, {
      step: 'Invalid IFSC',
      accountNumber,
      ifscCode,
    });
    await withdrawalPage.selectBankAccount();
    await addNewBankWithdrawalPage.clickAddBankDetails();
    await addNewBankWithdrawalPage.enterAccountNumber(accountNumber);
    await addNewBankWithdrawalPage.enterIFSCCode(ifscCode);
    const errorMessage = await addNewBankWithdrawalPage.getIFSCFieldErrorMessage();
    console.log('IFSC validation error message:', errorMessage);
    expect(errorMessage).toBe(expectedIfscErrorMessage);
    await addNewBankWithdrawalPage.clickCancel();
  });
  await test.step('TC003_10 | add new bank with invalid account number and verify transaction', async () => {
    logSub(10, 'Add new bank with invalid account number and verify transaction');
    const accountNumber = tc003Dataset.invalidAccountNumber;
    const ifscCode = tc003Dataset.invalidAccountIfscCode;
    const expectedAccountNumberErrorMessage = tc003Dataset.expectedInvalidAccountMessage;
    console.log(`[${test.info().title}] Input values`, {
      step: 'Invalid Account Number',
      accountNumber,
      ifscCode,
    });
    await withdrawalPage.selectBankAccount();
    await addNewBankWithdrawalPage.clickAddBankDetails();
    await addNewBankWithdrawalPage.enterAccountNumber(accountNumber);
    await addNewBankWithdrawalPage.enterIFSCCode(ifscCode);
    const canSave = await addNewBankWithdrawalPage.isSaveBankEnabled();
    console.log('Is Save Bank enabled:', canSave);
    if (canSave) {
      await addNewBankWithdrawalPage.clickSaveBank();
    }

    const errorMessage = await addNewBankWithdrawalPage.getAnyValidationErrorMessage();
    console.log('Account number validation error message:', errorMessage);
    expect(errorMessage).toBe(expectedAccountNumberErrorMessage);
    await addNewBankWithdrawalPage.clickCancel();

  });

  await test.step('TC003_11 | add new bank with Valid account number and invalid ifsc code and verify transaction', async () => {
    logSub(11, 'Add new bank with valid account number and invalid IFSC (toast)');
    const accountNumber = tc003Dataset.validAccountNumber;
    const ifscCode = tc003Dataset.validAccountInvalidIfscCode;
    const expectedToastErrorMessage = tc003Dataset.expectedToastErrorMessage;
    console.log(`[${test.info().title}] Input values`, {
      step: 'Invalid IFSC',
      accountNumber,
      ifscCode,
    });

    await withdrawalPage.selectBankAccount();
    await addNewBankWithdrawalPage.clickAddBankDetails();
    await addNewBankWithdrawalPage.enterAccountNumber(accountNumber);
    await addNewBankWithdrawalPage.enterIFSCCode(ifscCode);
    await addNewBankWithdrawalPage.clickSaveBank();
    let errorMessage = '';
    try {
      errorMessage = await addNewBankWithdrawalPage.getInvalidAccountToastMessage(6000);
    } catch {
      // Retry once when the first click does not trigger toast/validation reliably.
      await addNewBankWithdrawalPage.clickSaveBank();
      errorMessage = await addNewBankWithdrawalPage.getAnyValidationErrorMessage(12000);
    }
    console.log('Toast validation error message:', errorMessage);
    const normalizedError = errorMessage.toUpperCase();
    const normalizedExpected = expectedToastErrorMessage.toUpperCase();
    expect(
      normalizedError.includes(normalizedExpected) || normalizedError.includes('SOMETHING WENT WRONG')
    ).toBeTruthy();
    await addNewBankWithdrawalPage.clickCancel();
  });

  await test.step('TC003_12 | add bank detais with already verified account and verify transaction', async () => {
    logSub(12, 'Add bank details with already verified account and verify transaction');
    const accountNumber = tc003Dataset.verifiedAccountNumber;
    const ifscCode = tc003Dataset.verifiedAccountIfscCode;
    console.log(`[${test.info().title}] Input values`, {
      step: 'Already Verified Account',
      accountNumber,
      ifscCode,
    });
  
  await withdrawalPage.selectBankAccount();
  await addNewBankWithdrawalPage.clickAddBankDetails();
  await addNewBankWithdrawalPage.enterAccountNumber(accountNumber);
  await addNewBankWithdrawalPage.enterIFSCCode(ifscCode);
  await addNewBankWithdrawalPage.clickSaveBank();

  let errorMessage = '';
  const toastError = page
    .locator('div.p-toast.p-component .p-toast-message-error .p-toast-detail, div.p-toast.p-component p.font-gilroy')
    .first();
  const inlineError = page.locator('small.p-error:visible').first();

  if (await toastError.isVisible().catch(() => false)) {
    errorMessage = ((await toastError.textContent()) ?? '').trim();
  } else if (await inlineError.isVisible().catch(() => false)) {
    errorMessage = ((await inlineError.textContent()) ?? '').trim();
  }
  console.log('Already verified account transaction error message:', errorMessage);
  await addNewBankWithdrawalPage.clickCancel();
  });
});


test.skip('TC_009-Withdrawal Error Message Validation for gold vault(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
  const TC009ERR = (n: number): string => `TC009_ERR_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC009ERR(n)}] ${title}`);
  };

  const openWithdrawalDepositFlow = async (): Promise<void> => {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  };

  const getQuantityErrorTextIfVisible = async (): Promise<string> => {
    const quantityError = page.locator('small.p-error span').first();
    try {
      await quantityError.waitFor({ state: 'visible', timeout: 2000 });
      const text = (await quantityError.textContent()) ?? '';
      return text.trim();
    } catch {
      return '';
    }
  };

  let goldVault = 0;
  let invalidGoldQty = 0;

  await test.step('TC009_ERR_1 | Open Gold Vault and validate preconditions', async () => {
    logSub(1, 'Open Gold Vault and validate preconditions');
    await openWithdrawalDepositFlow();

    goldVault = await withdrawalPage.getGoldVaultValue();
    if (goldVault <= 0) {
      const message = 'Gold vault has no sufficient balance';
      console.error(`[${TC009ERR(1)}] ${message}`);
      throw new Error(message);
    }
    invalidGoldQty = Number((goldVault + 0.01).toFixed(4));
    await withdrawalPage.clickVaultProceed('Gold Vault');
  });

  await test.step('TC009_ERR_2 | Validate blank quantity error and disabled Proceed', async () => {
    logSub(2, 'Validate blank quantity error and disabled Proceed');
    const goldWithdrawingBefore = await withdrawalPage.getWithdrawingValue();
    const goldRemainingBefore = await withdrawalPage.getRemainingValue();
    const goldErrorText = await getQuantityErrorTextIfVisible();
    console.log(`[${TC009ERR(2)}] ===== Error Message Validation | Gold | Blank Quantity =====`);
    console.log(`[${TC009ERR(2)}] Quantity left blank for Gold Vault validation`);
    console.log(`[${TC009ERR(2)}] Gold vault value:`, goldVault);
    console.log(`[${TC009ERR(2)}] Gold withdrawing before qty entry:`, goldWithdrawingBefore);
    console.log(`[${TC009ERR(2)}] Gold remaining before qty entry:`, goldRemainingBefore);
    console.log(`[${TC009ERR(2)}] Gold error text:`, goldErrorText || '<not visible>');
    expect(goldWithdrawingBefore).toBeCloseTo(0, 2);
    expect(goldRemainingBefore).toBeCloseTo(goldVault, 2);
    const isGoldProceedDisabledForBlank = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC009ERR(2)}] Gold Proceed button is disabled (blank qty):`, isGoldProceedDisabledForBlank);
    expect(isGoldProceedDisabledForBlank).toBe(true);
  });

  await test.step('TC009_ERR_3 | Validate zero quantity error and disabled Proceed', async () => {
    logSub(3, 'Validate zero quantity error and disabled Proceed');
    await withdrawalPage.enterQuantity(0);
    const goldWithdrawingAfterZero = await withdrawalPage.getWithdrawingValue();
    const goldRemainingAfterZero = await withdrawalPage.getRemainingValue();
    const goldZeroQtyErrorText = await getQuantityErrorTextIfVisible();
    console.log(`[${TC009ERR(3)}] ===== Error Message Validation | Gold | Zero Quantity =====`);
    console.log(`[${TC009ERR(3)}] Entered Gold qty: 0`);
    console.log(`[${TC009ERR(3)}] Gold withdrawing after 0 qty:`, goldWithdrawingAfterZero);
    console.log(`[${TC009ERR(3)}] Gold remaining after 0 qty:`, goldRemainingAfterZero);
    console.log(`[${TC009ERR(3)}] Gold error text for 0 qty:`, goldZeroQtyErrorText || '<not visible>');
    expect(goldWithdrawingAfterZero).toBeCloseTo(0, 2);
    expect(goldRemainingAfterZero).toBeCloseTo(goldVault, 2);
    const isGoldProceedDisabledForZero = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC009ERR(3)}] Gold Proceed button is disabled (0 qty):`, isGoldProceedDisabledForZero);
    expect(isGoldProceedDisabledForZero).toBe(true);
  });

  await test.step('TC009_ERR_4 | Validate qty greater than vault and disabled Proceed', async () => {
    logSub(4, 'Validate qty greater than vault and disabled Proceed');
    await withdrawalPage.enterQuantity(invalidGoldQty);
    const goldWithdrawingAfterInvalid = await withdrawalPage.getWithdrawingValue();
    const goldRemainingAfterInvalid = await withdrawalPage.getRemainingValue();
    const goldInvalidQtyErrorText = await getQuantityErrorTextIfVisible();
    const isGoldProceedDisabledForInvalid = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC009ERR(4)}] ===== Error Message Validation | Gold | Qty Greater Than Vault =====`);
    console.log(`[${TC009ERR(4)}] Entered invalid Gold qty (vault + 0.01):`, invalidGoldQty);
    console.log(`[${TC009ERR(4)}] Gold withdrawing after invalid qty:`, goldWithdrawingAfterInvalid);
    console.log(`[${TC009ERR(4)}] Gold remaining after invalid qty:`, goldRemainingAfterInvalid);
    console.log(
      `[${TC009ERR(4)}] Gold error text for qty > vault:`,
      goldInvalidQtyErrorText || '<not visible>',
    );
    console.log(`[${TC009ERR(4)}] Gold Proceed disabled for qty > vault:`, isGoldProceedDisabledForInvalid);
    expect(isGoldProceedDisabledForInvalid).toBe(true);
  });

});

test.skip('TC_010-Withdrawal Error Message Validation for silver vault(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
  const TC010ERR = (n: number): string => `TC010_ERR_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC010ERR(n)}] ${title}`);
  };

  const openWithdrawalDepositFlow = async (): Promise<void> => {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  };

  const getQuantityErrorTextIfVisible = async (): Promise<string> => {
    const quantityError = page.locator('small.p-error span').first();
    try {
      await quantityError.waitFor({ state: 'visible', timeout: 2000 });
      const text = (await quantityError.textContent()) ?? '';
      return text.trim();
    } catch {
      return '';
    }
  };

  let silverVault = 0;
  let invalidSilverQty = 0;

  await test.step('TC010_ERR_1 | Open Silver Vault and validate preconditions', async () => {
    logSub(1, 'Open Silver Vault and validate preconditions');
    await openWithdrawalDepositFlow();

    silverVault = await withdrawalPage.getSilverVaultValue();
    if (silverVault <= 0) {
      const message = 'Silver vault has no sufficient balance';
      console.error(`[${TC010ERR(1)}] ${message}`);
      throw new Error(message);
    }
    invalidSilverQty = Number((silverVault + 0.01).toFixed(4));
    await withdrawalPage.clickVaultProceed('Silver Vault');
  });

  await test.step('TC010_ERR_2 | Validate blank quantity error and disabled Proceed', async () => {
    logSub(2, 'Validate blank quantity error and disabled Proceed');
    const silverWithdrawingBefore = await withdrawalPage.getWithdrawingValue();
    const silverRemainingBefore = await withdrawalPage.getRemainingValue();
    const silverErrorText = await getQuantityErrorTextIfVisible();
    console.log(`[${TC010ERR(2)}] ===== Error Message Validation | Silver | Blank Quantity =====`);
    console.log(`[${TC010ERR(2)}] Quantity left blank for Silver Vault validation`);
    console.log(`[${TC010ERR(2)}] Silver vault value:`, silverVault);
    console.log(`[${TC010ERR(2)}] Silver withdrawing before qty entry:`, silverWithdrawingBefore);
    console.log(`[${TC010ERR(2)}] Silver remaining before qty entry:`, silverRemainingBefore);
    console.log(`[${TC010ERR(2)}] Silver error text:`, silverErrorText || '<not visible>');
    expect(silverWithdrawingBefore).toBeCloseTo(0, 2);
    expect(silverRemainingBefore).toBeCloseTo(silverVault, 2);
    const isSilverProceedDisabledForBlank = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC010ERR(2)}] Silver Proceed button is disabled (blank qty):`, isSilverProceedDisabledForBlank);
    expect(isSilverProceedDisabledForBlank).toBe(true);
  });

  await test.step('TC010_ERR_3 | Validate zero quantity error and disabled Proceed', async () => {
    logSub(3, 'Validate zero quantity error and disabled Proceed');
    await withdrawalPage.enterQuantityInSilverVault(0);
    const silverWithdrawingAfterZero = await withdrawalPage.getWithdrawingValue();
    const silverRemainingAfterZero = await withdrawalPage.getRemainingValue();
    const silverZeroQtyErrorText = await getQuantityErrorTextIfVisible();
    console.log(`[${TC010ERR(3)}] ===== Error Message Validation | Silver | Zero Quantity =====`);
    console.log(`[${TC010ERR(3)}] Entered Silver qty: 0`);
    console.log(`[${TC010ERR(3)}] Silver withdrawing after 0 qty:`, silverWithdrawingAfterZero);
    console.log(`[${TC010ERR(3)}] Silver remaining after 0 qty:`, silverRemainingAfterZero);
    console.log(`[${TC010ERR(3)}] Silver error text for 0 qty:`, silverZeroQtyErrorText || '<not visible>');
    expect(silverWithdrawingAfterZero).toBeCloseTo(0, 2);
    expect(silverRemainingAfterZero).toBeCloseTo(silverVault, 2);
    const isSilverProceedDisabledForZero = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC010ERR(3)}] Silver Proceed button is disabled (0 qty):`, isSilverProceedDisabledForZero);
    expect(isSilverProceedDisabledForZero).toBe(true);
  });

  await test.step('TC010_ERR_4 | Validate qty greater than vault and disabled Proceed', async () => {
    logSub(4, 'Validate qty greater than vault and disabled Proceed');
    await withdrawalPage.enterQuantityInSilverVault(invalidSilverQty);
    const silverWithdrawingAfterInvalid = await withdrawalPage.getWithdrawingValue();
    const silverRemainingAfterInvalid = await withdrawalPage.getRemainingValue();
    const silverInvalidQtyErrorText = await getQuantityErrorTextIfVisible();
    const isSilverProceedDisabledForInvalid = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC010ERR(4)}] ===== Error Message Validation | Silver | Qty Greater Than Vault =====`);
    console.log(`[${TC010ERR(4)}] Entered invalid Silver qty (vault + 0.01):`, invalidSilverQty);
    console.log(`[${TC010ERR(4)}] Silver withdrawing after invalid qty:`, silverWithdrawingAfterInvalid);
    console.log(`[${TC010ERR(4)}] Silver remaining after invalid qty:`, silverRemainingAfterInvalid);
    console.log(
      `[${TC010ERR(4)}] Silver error text for qty > vault:`,
      silverInvalidQtyErrorText || '<not visible>',
    );
    console.log(`[${TC010ERR(4)}] Silver Proceed disabled for qty > vault:`, isSilverProceedDisabledForInvalid);
    console.log(
      `[${TC010ERR(4)}] UI behavior note: withdrawing/remaining may still reflect entered invalid qty while submission is blocked.`,
    );
    expect(isSilverProceedDisabledForInvalid).toBe(true);
  });
});

test.skip('TC_011-Withdrawal Error Message Validation for gold SIP(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
  const TC011ERR = (n: number): string => `TC011_ERR_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC011ERR(n)}] ${title}`);
  };

  const openWithdrawalDepositFlow = async (): Promise<void> => {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  };

  const getQuantityErrorTextIfVisible = async (): Promise<string> => {
    const quantityError = page.locator('small.p-error span').first();
    try {
      await quantityError.waitFor({ state: 'visible', timeout: 2000 });
      const text = (await quantityError.textContent()) ?? '';
      return text.trim();
    } catch {
      return '';
    }
  };

  let selectedSipName = '';
  let selectedSipGoldQty = 0;
  let invalidSipQty = 0;

  await test.step('TC011_ERR_1 | Open Gold SIP and validate preconditions', async () => {
    logSub(1, 'Open Gold SIP and validate preconditions');
    await openWithdrawalDepositFlow();

    const selectedSipDetails = await dashboardPage.printGoldValueAndClickProceedBySipName(undefined, {
      minValueThreshold: 0.01,
      scrollDirection: 'up',
      onlyMetalType: 'Gold',
    });
    selectedSipName = selectedSipDetails.sipName;
    const selectedSipMetalType = selectedSipDetails.metalType;
    selectedSipGoldQty = Number(selectedSipDetails.goldValue.replace(/[^\d.]/g, ''));

    if (selectedSipMetalType !== 'Gold') {
      throw new Error(
        `[${TC011ERR(1)}] Expected Gold SIP but selected "${selectedSipMetalType}" SIP (${selectedSipName}).`,
      );
    }
    if (selectedSipGoldQty <= 0) {
      const message = 'Selected Gold SIP has no sufficient balance';
      console.error(`[${TC011ERR(1)}] ${message}`);
      throw new Error(message);
    }

    invalidSipQty = Number((selectedSipGoldQty + 0.01).toFixed(4));
    console.log(`[${TC011ERR(1)}] Selected Gold SIP name:`, selectedSipName);
    console.log(`[${TC011ERR(1)}] Selected Gold SIP qty:`, selectedSipGoldQty);
  });

  await test.step('TC011_ERR_2 | Validate blank quantity error and disabled Proceed', async () => {
    logSub(2, 'Validate blank quantity error and disabled Proceed');
    const withdrawingBefore = await withdrawalPage.getWithdrawingValue();
    const remainingBefore = await withdrawalPage.getRemainingValue();
    const blankErrorText = await getQuantityErrorTextIfVisible();

    console.log(`[${TC011ERR(2)}] ===== Error Message Validation | Gold SIP | Blank Quantity =====`);
    console.log(`[${TC011ERR(2)}] SIP:`, selectedSipName);
    console.log(`[${TC011ERR(2)}] Withdrawing before qty entry:`, withdrawingBefore);
    console.log(`[${TC011ERR(2)}] Remaining before qty entry:`, remainingBefore);
    console.log(`[${TC011ERR(2)}] Error text:`, blankErrorText || '<not visible>');
    expect(withdrawingBefore).toBeCloseTo(0, 2);
    expect(remainingBefore).toBeCloseTo(selectedSipGoldQty, 2);
    const isProceedDisabledForBlank = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC011ERR(2)}] Proceed button is disabled (blank qty):`, isProceedDisabledForBlank);
    expect(isProceedDisabledForBlank).toBe(true);
  });

  await test.step('TC011_ERR_3 | Validate zero quantity error and disabled Proceed', async () => {
    logSub(3, 'Validate zero quantity error and disabled Proceed');
    await withdrawalPage.enterQuantity(0);

    const withdrawingAfterZero = await withdrawalPage.getWithdrawingValue();
    const remainingAfterZero = await withdrawalPage.getRemainingValue();
    const zeroErrorText = await getQuantityErrorTextIfVisible();

    console.log(`[${TC011ERR(3)}] ===== Error Message Validation | Gold SIP | Zero Quantity =====`);
    console.log(`[${TC011ERR(3)}] Entered qty: 0`);
    console.log(`[${TC011ERR(3)}] Withdrawing after 0 qty:`, withdrawingAfterZero);
    console.log(`[${TC011ERR(3)}] Remaining after 0 qty:`, remainingAfterZero);
    console.log(`[${TC011ERR(3)}] Error text for 0 qty:`, zeroErrorText || '<not visible>');
    expect(withdrawingAfterZero).toBeCloseTo(0, 2);
    expect(remainingAfterZero).toBeCloseTo(selectedSipGoldQty, 2);
    const isProceedDisabledForZero = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC011ERR(3)}] Proceed button is disabled (0 qty):`, isProceedDisabledForZero);
    expect(isProceedDisabledForZero).toBe(true);
  });

  await test.step('TC011_ERR_4 | Validate qty greater than SIP and disabled Proceed', async () => {
    logSub(4, 'Validate qty greater than SIP and disabled Proceed');
    await withdrawalPage.enterQuantity(invalidSipQty);

    const withdrawingAfterInvalid = await withdrawalPage.getWithdrawingValue();
    const remainingAfterInvalid = await withdrawalPage.getRemainingValue();
    const invalidErrorText = await getQuantityErrorTextIfVisible();
    const isProceedDisabledForInvalid = await withdrawalPage.isProceedButtonDisabled();

    console.log(`[${TC011ERR(4)}] ===== Error Message Validation | Gold SIP | Qty Greater Than SIP =====`);
    console.log(`[${TC011ERR(4)}] Entered invalid qty (sip + 0.01):`, invalidSipQty);
    console.log(`[${TC011ERR(4)}] Withdrawing after invalid qty:`, withdrawingAfterInvalid);
    console.log(`[${TC011ERR(4)}] Remaining after invalid qty:`, remainingAfterInvalid);
    console.log(`[${TC011ERR(4)}] Error text for qty > sip:`, invalidErrorText || '<not visible>');
    console.log(`[${TC011ERR(4)}] Proceed disabled for qty > sip:`, isProceedDisabledForInvalid);
    console.log(
      `[${TC011ERR(4)}] UI behavior note: withdrawing/remaining may still reflect entered invalid qty while submission is blocked.`,
    );
    expect(isProceedDisabledForInvalid).toBe(true);
  });
});

test.skip('TC_012-Withdrawal Error Message Validation for silver SIP(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
  const TC012ERR = (n: number): string => `TC012_ERR_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC012ERR(n)}] ${title}`);
  };

  const openWithdrawalDepositFlow = async (): Promise<void> => {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  };

  const getQuantityErrorTextIfVisible = async (): Promise<string> => {
    const quantityError = page.locator('small.p-error span').first();
    try {
      await quantityError.waitFor({ state: 'visible', timeout: 2000 });
      const text = (await quantityError.textContent()) ?? '';
      return text.trim();
    } catch {
      return '';
    }
  };

  let selectedSipName = '';
  let selectedSipSilverQty = 0;
  let invalidSipQty = 0;

  await test.step('TC012_ERR_1 | Open Silver SIP and validate preconditions', async () => {
    logSub(1, 'Open Silver SIP and validate preconditions');
    await openWithdrawalDepositFlow();

    const selectedSipDetails = await dashboardPage.printGoldValueAndClickProceedBySipName(undefined, {
      minValueThreshold: 0.01,
      scrollDirection: 'up',
      onlyMetalType: 'Silver',
    });
    selectedSipName = selectedSipDetails.sipName;
    const selectedSipMetalType = selectedSipDetails.metalType;
    selectedSipSilverQty = Number(selectedSipDetails.goldValue.replace(/[^\d.]/g, ''));

    if (selectedSipMetalType !== 'Silver') {
      throw new Error(
        `[${TC012ERR(1)}] Expected Silver SIP but selected "${selectedSipMetalType}" SIP (${selectedSipName}).`,
      );
    }
    if (selectedSipSilverQty <= 0) {
      const message = 'Selected Silver SIP has no sufficient balance';
      console.error(`[${TC012ERR(1)}] ${message}`);
      throw new Error(message);
    }

    invalidSipQty = Number((selectedSipSilverQty + 0.01).toFixed(4));
    console.log(`[${TC012ERR(1)}] Selected Silver SIP name:`, selectedSipName);
    console.log(`[${TC012ERR(1)}] Selected Silver SIP qty:`, selectedSipSilverQty);
  });

  await test.step('TC012_ERR_2 | Validate blank quantity error and disabled Proceed', async () => {
    logSub(2, 'Validate blank quantity error and disabled Proceed');
    const withdrawingBefore = await withdrawalPage.getWithdrawingValue();
    const remainingBefore = await withdrawalPage.getRemainingValue();
    const blankErrorText = await getQuantityErrorTextIfVisible();

    console.log(`[${TC012ERR(2)}] ===== Error Message Validation | Silver SIP | Blank Quantity =====`);
    console.log(`[${TC012ERR(2)}] SIP:`, selectedSipName);
    console.log(`[${TC012ERR(2)}] Withdrawing before qty entry:`, withdrawingBefore);
    console.log(`[${TC012ERR(2)}] Remaining before qty entry:`, remainingBefore);
    console.log(`[${TC012ERR(2)}] Error text:`, blankErrorText || '<not visible>');
    expect(withdrawingBefore).toBeCloseTo(0, 2);
    expect(remainingBefore).toBeCloseTo(selectedSipSilverQty, 2);
    const isProceedDisabledForBlank = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC012ERR(2)}] Proceed button is disabled (blank qty):`, isProceedDisabledForBlank);
    expect(isProceedDisabledForBlank).toBe(true);
  });

  await test.step('TC012_ERR_3 | Validate zero quantity error and disabled Proceed', async () => {
    logSub(3, 'Validate zero quantity error and disabled Proceed');
    await withdrawalPage.enterQuantity(0);

    const withdrawingAfterZero = await withdrawalPage.getWithdrawingValue();
    const remainingAfterZero = await withdrawalPage.getRemainingValue();
    const zeroErrorText = await getQuantityErrorTextIfVisible();

    console.log(`[${TC012ERR(3)}] ===== Error Message Validation | Silver SIP | Zero Quantity =====`);
    console.log(`[${TC012ERR(3)}] Entered qty: 0`);
    console.log(`[${TC012ERR(3)}] Withdrawing after 0 qty:`, withdrawingAfterZero);
    console.log(`[${TC012ERR(3)}] Remaining after 0 qty:`, remainingAfterZero);
    console.log(`[${TC012ERR(3)}] Error text for 0 qty:`, zeroErrorText || '<not visible>');
    expect(withdrawingAfterZero).toBeCloseTo(0, 2);
    expect(remainingAfterZero).toBeCloseTo(selectedSipSilverQty, 2);
    const isProceedDisabledForZero = await withdrawalPage.isProceedButtonDisabled();
    console.log(`[${TC012ERR(3)}] Proceed button is disabled (0 qty):`, isProceedDisabledForZero);
    expect(isProceedDisabledForZero).toBe(true);
  });

  await test.step('TC012_ERR_4 | Validate qty greater than SIP and disabled Proceed', async () => {
    logSub(4, 'Validate qty greater than SIP and disabled Proceed');
    await withdrawalPage.enterQuantity(invalidSipQty);

    const withdrawingAfterInvalid = await withdrawalPage.getWithdrawingValue();
    const remainingAfterInvalid = await withdrawalPage.getRemainingValue();
    const invalidErrorText = await getQuantityErrorTextIfVisible();
    const isProceedDisabledForInvalid = await withdrawalPage.isProceedButtonDisabled();

    console.log(`[${TC012ERR(4)}] ===== Error Message Validation | Silver SIP | Qty Greater Than SIP =====`);
    console.log(`[${TC012ERR(4)}] Entered invalid qty (sip + 0.01):`, invalidSipQty);
    console.log(`[${TC012ERR(4)}] Withdrawing after invalid qty:`, withdrawingAfterInvalid);
    console.log(`[${TC012ERR(4)}] Remaining after invalid qty:`, remainingAfterInvalid);
    console.log(`[${TC012ERR(4)}] Error text for qty > sip:`, invalidErrorText || '<not visible>');
    console.log(`[${TC012ERR(4)}] Proceed disabled for qty > sip:`, isProceedDisabledForInvalid);
    console.log(
      `[${TC012ERR(4)}] UI behavior note: withdrawing/remaining may still reflect entered invalid qty while submission is blocked.`,
    );
    expect(isProceedDisabledForInvalid).toBe(true);
  });
});


test.skip('TC_013-Gold Vault minimum selling amount (Rs. 10) error after Proceed (deposit flow)@customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage, myOrderVerificationPage }) => {
  const TC013 = (n: number): string => `TC013_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC013(n)}] ${title}`);
  };

  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let currentUrl = '';
  let goldVault = 0;
  let sellingPrice = 0;
  let validQty = 0;
  let totalGoldInvestment = 0;
  let totalAmountWithdraw = 0;
  let skipPostWithdrawSuccessSteps = false;

  await test.step('TC013_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
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

  await test.step('TC013_2 | Verify Cancel and Proceed buttons are visible', async () => {
    logSub(2, 'Verify Cancel and Proceed buttons are visible');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
  });

  await test.step('TC013_3 | Capture current URL', async () => {
    logSub(3, 'Capture current URL');
    currentUrl = page.url();
  });

  await test.step('TC013_4 | Click Cancel button', async () => {
    logSub(4, 'Click Cancel button');
    await withdrawalPage.clickCancel();
  });

  await test.step('TC013_5 | Verify same URL after clicking Cancel', async () => {
    logSub(5, 'Verify same URL after clicking Cancel');
    await expect(page).toHaveURL(currentUrl);
  });

  await test.step('TC013_6 | Click Proceed and verify navigation', async () => {
    logSub(6, 'Click Proceed and verify navigation');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC013_7 | Deposit flow', async () => {
    logSub(7, 'Deposit flow');
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  });

  await test.step('TC013_8 | Validate investment details with values', async () => {
    logSub(8, 'Validate investment details with values');
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

  await test.step('TC013_9 | Verify withdrawal details', async () => {
    logSub(9, 'Verify withdrawal details');
    const withdrawing = await withdrawalPage.getWithdrawingValue();
    console.log('Withdrawing value before Withdrawal:', withdrawing);

    const remaining = await withdrawalPage.getRemainingValue();
    console.log('Remaining value before Withdrawal:', remaining);

    sellingPrice = await withdrawalPage.getSellingPrice();
    console.log('Selling Price:', sellingPrice);
  });

  await test.step('TC013_10 | Enter tiny quantity (below Rs. 10 sell) and validate Proceed enabled', async () => {
    logSub(10, 'Enter quantity that yields sell amount below minimum');
    if (goldVault <= 0.0001) {
      throw new Error(`Gold vault value is too low for minimum-threshold test: ${goldVault}`);
    }
    validQty = Number(((goldVault + 0.0001) - goldVault).toFixed(4));
    await withdrawalPage.enterQuantity(validQty);
    console.log('Entered quantity (below min sell threshold):', validQty);

    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('TC013_11 | Validate withdrawing and remaining after valid quantity', async () => {
    logSub(11, 'Validate withdrawing and remaining');
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

  await test.step('TC013_12 | Validate timer on account details page', async () => {
    logSub(12, 'Validate timer on account details page');
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

  await test.step('TC013_13 | Validate account details, bank selection, amount, and minimum selling error after submit', async () => {
    logSub(13, 'Validate account details, bank, amount, and min selling error after Proceed');
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
    totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
    console.log('Total Withdraw Amount:', totalAmountWithdraw);
    expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);

    await withdrawalPage.clickProceedToWithdraw();
    await withdrawalPage.validateMinimumSellingAmountRs10Error();
    console.log('[TC013_13] Validated minimum selling amount error after Proceed to withdraw');
    skipPostWithdrawSuccessSteps = true;
  });

  await test.step('TC013_14 | Validate withdrawal details on dashboard', async () => {
    if (skipPostWithdrawSuccessSteps) {
      console.log('[TC013_14] Skipped — minimum selling amount blocked withdrawal (validated in TC013_13)');
      return;
    }
    logSub(14, 'Validate withdrawal details on dashboard');
    const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
    console.log(' Validate withdrawal Details:', withdrawalDetails);
    const totalGoldAfterPurchase = totalGoldBeforePurchase - validQty;
    console.log('Total Gold after withdrawal:', totalGoldAfterPurchase);
    expect(totalGoldAfterPurchase).toBeCloseTo(totalGoldBeforePurchase - validQty, 4);
  });

  await test.step('TC013_15 | Validate order details for withdrawn item in My Orders > Sell', async () => {
    if (skipPostWithdrawSuccessSteps) {
      console.log('[TC013_15] Skipped — minimum selling amount blocked withdrawal (validated in TC013_13)');
      return;
    }
    logSub(15, 'Validate My Orders sell card details');
    await myOrderVerificationPage.goToMyOrders();
    await myOrderVerificationPage.clickSellTab();
    await myOrderVerificationPage.waitForSellWithdrawalOrderRow(totalAmountWithdraw);

    const sellCard = await myOrderVerificationPage.getLatestSellOrderCardDetails();

    console.log('[TC013_15] Sell card Date:', sellCard.date);
    console.log('[TC013_15] Sell card Transaction ID:', sellCard.transactionId);
    console.log('[TC013_15] Sell card Narration:', sellCard.narration);
    console.log('[TC013_15] Sell card Amount:', sellCard.amountText);

    const currentDate = new Date().toLocaleDateString('en-GB');
    expect(sellCard.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(sellCard.date).toBe(currentDate);
    expect(sellCard.transactionId).not.toBe('');
    expect(sellCard.narration).toContain('Sold');
    expect(sellCard.narration).toContain(validQty.toFixed(4));
    expect(sellCard.amountValue).toBeCloseTo(totalAmountWithdraw, 1);
    await myOrderVerificationPage.clickViewStatusOnLatestOrderRow();

    const orderDetails = await myOrderVerificationPage.getViewStatusOrderDetails();
    console.log('[TC013_15] View Status Transaction ID:', orderDetails.transactionId);
    console.log('[TC013_15] View Status Narration:', orderDetails.narration);
    console.log('[TC013_15] View Status Rate per 1 gm:', orderDetails.ratePerGm);
    console.log('[TC013_15] View Status Amount:', orderDetails.amount);
    console.log('[TC013_15] View Status Total Amount:', orderDetails.totalAmount);
    console.log('[TC013_15] View Status Current Status:', orderDetails.currentStatus);
    console.log('[TC013_15] View Status Payment Ref No:', orderDetails.paymentRefNo);
    console.log('[TC013_15] View Status Payment Mode:', orderDetails.paymentMode);
    console.log('[TC013_15] View Status Payment Date:', orderDetails.paymentDate);

    const parsedRatePerGm = Number((orderDetails.ratePerGm.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
    const parsedAmount = Number((orderDetails.amount.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
    const narrationQty = Number((orderDetails.narration.match(/([\d.]+)\s*gm/i)?.[1] ?? '0').trim());

    expect(orderDetails.narration).toContain('Sold');
    expect(narrationQty).toBeCloseTo(validQty, 4);
    expect(parsedRatePerGm).toBeCloseTo(sellingPrice, 2);
    expect(parsedAmount).toBeCloseTo(totalAmountWithdraw, 1);
    expect(orderDetails.currentStatus).toMatch(/^Pending$/i);
  });

  await test.step('TC013_16 | Validate investment details after withdrawal on investment page', async () => {
    if (skipPostWithdrawSuccessSteps) {
      console.log('[TC013_16] Skipped — minimum selling amount blocked withdrawal (validated in TC013_13)');
      return;
    }
    logSub(16, 'Validate investment details after withdrawal');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();

    const totalGoldAfterWithdrawalInvestment = totalGoldInvestment - validQty;
    console.log('Total Investment Gold after withdrawal:', totalGoldAfterWithdrawalInvestment);
    expect(totalGoldAfterWithdrawalInvestment).toBeCloseTo(totalGoldInvestment - validQty, 4);
    const goldVaultAfterWithdrawalInvestment = goldVault - validQty;
    expect(goldVaultAfterWithdrawalInvestment).toBeCloseTo(goldVault - validQty, 4);
    console.log('Total Investment Gold Vault after withdrawal:', goldVaultAfterWithdrawalInvestment);
  });
});

test.skip('TC_014-Verify User Can Withdraw Complete Silver vault Balance to Bank Account Successfully @customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage, myOrderVerificationPage }) => {
  const TC014 = (n: number): string => `TC014_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC014(n)}] ${title}`);
  };

  let portfolioValue = 0;
  let totalSilverBeforePurchase = 0;
  let currentUrl = '';
  let silverVault = 0;
  let sellingPrice = 0;
  let validQty = 0;
  let invalidQty = 0;
  let totalSilverInvestment = 0;
  let totalWithdrawAmount = 0;

  await test.step('TC014_1 | Get and validate portfolio and silver values', async () => {
    logSub(1, 'Get and validate portfolio and silver values');
    await page.goto('/dashboard');

    portfolioValue = await dashboardPage.getPortfolioValueNumber();
    console.log('Total Portfolio Value (Rs):', portfolioValue);
    expect(portfolioValue).toBeGreaterThan(0);

    totalSilverBeforePurchase = await dashboardPage.getTotalSilverValue();
    console.log('Total Silver (g):', totalSilverBeforePurchase);
    expect(totalSilverBeforePurchase).toBeGreaterThan(0);
  });

  await test.step('TC014_2 | Verify Cancel and Proceed buttons are visible', async () => {
    logSub(2, 'Verify Cancel and Proceed buttons are visible');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
  });

  await test.step('TC014_3 | Capture current URL', async () => {
    logSub(3, 'Capture current URL');
    currentUrl = page.url();
  });

  await test.step('TC014_4 | Click Cancel button', async () => {
    logSub(4, 'Click Cancel button');
    await withdrawalPage.clickCancel();
  });

  await test.step('TC014_5 | Verify same URL after clicking Cancel', async () => {
    logSub(5, 'Verify same URL after clicking Cancel');
    await expect(page).toHaveURL(currentUrl);
  });

  await test.step('TC014_6 | Click Proceed and verify navigation', async () => {
    logSub(6, 'Click Proceed and verify navigation');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC014_7 | Deposit flow', async () => {
    logSub(7, 'Deposit flow');
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  });

  await test.step('TC014_8 | Validate investment details with silver vault values', async () => {
    logSub(8, 'Validate investment details with silver vault values');
    const totalInvestment = await withdrawalPage.getTotalInvestmentValue();
    console.log('Total Investment:', totalInvestment);

    totalSilverInvestment = await withdrawalPage.getTotalSilverValue();
    console.log('Total Investment Silver:', totalSilverInvestment);

    silverVault = await withdrawalPage.getSilverVaultValue();
    console.log('Total Investment Silver Vault:', silverVault);
    if (silverVault <= 0) {
      throw new Error(
        `[${TC014(8)}][FAIL] Insufficient silver vault value: Silver Vault must be > 0 to proceed with complete withdrawal.`,
      );
    }

    await withdrawalPage.clickVaultProceed('Silver Vault');
  });

  await test.step('TC014_9 | Verify withdrawal details before withdrawal', async () => {
    logSub(9, 'Verify withdrawal details before withdrawal');
    const withdrawing = await withdrawalPage.getWithdrawingValue();
    console.log('Withdrawing value before Withdrawal:', withdrawing);

    const remaining = await withdrawalPage.getRemainingValue();
    console.log('Remaining value before Withdrawal:', remaining);

    sellingPrice = await withdrawalPage.getSellingPrice();
    console.log('Selling Price:', sellingPrice);
  });

  await test.step('TC014_10 | Enter quantity greater than total silver vault amount and validate error', async () => {
    logSub(10, 'Invalid quantity validation');
    invalidQty = Number((silverVault + 0.01).toFixed(4));
    await withdrawalPage.enterQuantity(invalidQty);
    console.log('Entered invalid quantity:', invalidQty);
    const errorText = await withdrawalPage.getQuantityErrorText();
    expect(errorText).not.toBe('');
  });

  await test.step('TC014_11 | Verify Proceed button is disabled for invalid quantity', async () => {
    logSub(11, 'Verify Proceed disabled for invalid quantity');
    const isDisabled = await withdrawalPage.isProceedButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  await test.step('TC014_12 | Enter quantity equal to complete silver vault and validate Proceed enabled', async () => {
    logSub(12, 'Enter complete silver vault quantity');
    if (silverVault <= 0) {
      throw new Error(`Silver vault value is too low for withdrawal test: ${silverVault}`);
    }
    validQty = Number(silverVault.toFixed(4));
    await withdrawalPage.enterQuantity(validQty);
    console.log('Entered valid quantity (complete silver vault):', validQty);

    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('TC014_13 | Validate withdrawing and remaining after complete silver vault quantity', async () => {
    logSub(13, 'Validate withdrawing and remaining');
    await withdrawalPage.enterQuantity(validQty);

    const withdrawingValue = await withdrawalPage.getWithdrawingValue();
    const remainingValue = await withdrawalPage.getRemainingValue();

    console.log('Entered:', validQty);
    console.log('Withdrawing:', withdrawingValue);
    console.log('Remaining:', remainingValue);

    expect(withdrawingValue).toBeCloseTo(validQty, 2);
    const expectedRemaining = Number((silverVault - validQty).toFixed(4));
    expect(remainingValue).toBeCloseTo(expectedRemaining, 2);

    await Promise.all([
      page.waitForURL('**/withdraw/account-details'),
      withdrawalPage.clickProceed(),
    ]);
    console.log('Proceed button clicked');
  });

  await test.step('TC014_14 | Validate timer on account details page', async () => {
    logSub(14, 'Validate timer on account details page');
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

  await test.step('TC014_15 | Validate account details, bank selection, and amount calculation', async () => {
    logSub(15, 'Validate account details and amount');
    const silverValue = await withdrawalPage.getMetalValueFromDetails('Silver');
    const amount = await withdrawalPage.getAmountFromAccountDetails();
    const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();

    console.log('Silver:', silverValue);
    console.log('Amount:', amount);
    console.log('Total:', totalAmount);
    console.log('Selling price:', sellingPrice);

    const expectedAmount = silverValue * sellingPrice;
    expect(totalAmount).toBeCloseTo(expectedAmount, 2);
    expect(amount).toBeCloseTo(expectedAmount, 2);

    await withdrawalPage.selectBankAccount();
    totalWithdrawAmount = await withdrawalPage.getTotalWithdrawAmount();
    console.log('Total Withdraw Amount:', totalWithdrawAmount);
    expect(totalWithdrawAmount).toBeCloseTo(totalAmount, 2);

    await withdrawalPage.clickProceedToWithdraw();
  });

  await test.step('TC014_16 | Validate withdrawal details on dashboard', async () => {
    logSub(16, 'Validate withdrawal details on dashboard');
    const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
    console.log('Validate withdrawal Details:', withdrawalDetails);
    const totalSilverAfterPurchase = totalSilverBeforePurchase - validQty;
    console.log('Total Silver after withdrawal:', totalSilverAfterPurchase);
    expect(totalSilverAfterPurchase).toBeCloseTo(totalSilverBeforePurchase - validQty, 4);
  });

  await test.step('TC014_17 | Validate order details for withdrawn item in My Orders > Sell', async () => {
    logSub(17, 'Validate My Orders sell card details');
    await myOrderVerificationPage.goToMyOrders();
    await myOrderVerificationPage.clickSellTab();
    await myOrderVerificationPage.waitForSellWithdrawalOrderRow(totalWithdrawAmount, {
      narrationHint: 'Silver Sold',
    });

    const sellCard = await myOrderVerificationPage.getLatestSellOrderCardDetails();

    console.log(`[${TC014(17)}] Sell card Date:`, sellCard.date);
    console.log(`[${TC014(17)}] Sell card Transaction ID:`, sellCard.transactionId);
    console.log(`[${TC014(17)}] Sell card Narration:`, sellCard.narration);
    console.log(`[${TC014(17)}] Sell card Amount:`, sellCard.amountText);

    expect(sellCard.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(sellCard.transactionId).not.toBe('');
    expect(sellCard.narration).toContain('Silver Sold');
    expect(sellCard.narration).toContain(validQty.toFixed(4));
    expect(sellCard.amountValue).toBeCloseTo(totalWithdrawAmount, 1);
    await myOrderVerificationPage.clickViewStatusOnLatestOrderRow();

    const orderDetails = await myOrderVerificationPage.getViewStatusOrderDetails();
    console.log(`[${TC014(17)}] View Status Transaction ID:`, orderDetails.transactionId);
    console.log(`[${TC014(17)}] View Status Narration:`, orderDetails.narration);
    console.log(`[${TC014(17)}] View Status Rate per 1 gm:`, orderDetails.ratePerGm);
    console.log(`[${TC014(17)}] View Status Amount:`, orderDetails.amount);
    console.log(`[${TC014(17)}] View Status Total Amount:`, orderDetails.totalAmount);
    console.log(`[${TC014(17)}] View Status Current Status:`, orderDetails.currentStatus);
    console.log(`[${TC014(17)}] View Status Payment Ref No:`, orderDetails.paymentRefNo);
    console.log(`[${TC014(17)}] View Status Payment Mode:`, orderDetails.paymentMode);
    console.log(`[${TC014(17)}] View Status Payment Date:`, orderDetails.paymentDate);
    expect(orderDetails.transactionId).toBe(sellCard.transactionId);
    expect(orderDetails.narration).toContain('Sold');
    expect(orderDetails.currentStatus).toMatch(/Pending|Completed|Processing|Failed/i);
  });

  await test.step('TC014_18 | Validate investment details after withdrawal on investment page', async () => {
    logSub(18, 'Validate investment details after withdrawal');
    await page.goto('/dashboard');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();

    const totalSilverAfterWithdrawalInvestment = totalSilverInvestment - validQty;
    console.log('Total Investment Silver after withdrawal:', totalSilverAfterWithdrawalInvestment);
    expect(totalSilverAfterWithdrawalInvestment).toBeCloseTo(totalSilverInvestment - validQty, 4);
    const silverVaultAfterWithdrawalInvestment = silverVault - validQty;
    expect(silverVaultAfterWithdrawalInvestment).toBeCloseTo(silverVault - validQty, 4);
    console.log('Total Investment Silver Vault after withdrawal:', silverVaultAfterWithdrawalInvestment);
  });
});

test.skip('TC_015-Verify user can withdraw complete Gold SIP balance to bank account @customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage ,myOrderVerificationPage}) => {
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let currentUrl = '';
  let sellingPrice = 0;
  let validQty = 0;
  let invalidQty = 0;
  let totalGoldInvestment = 0;
  let selectedSipName = '';
  let selectedSipMetalValue = '';
  let selectedSipMetalValueNumber = 0;
  let selectedSipMetalType: 'Gold' | 'Silver' = 'Gold';
  let totalAmountWithdraw = 0;
  /** Expected INR amount for order validation: selling rate × withdrawn quantity */
  let expectedWithdrawalAmount = 0;

  const TC015 = (n: number): string => `TC015_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC015(n)}] ${title}`);
  };

  const gotoDashboardWithRetry = async (): Promise<void> => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        return;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  };

  await test.step('TC015_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
    await gotoDashboardWithRetry();

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

  await test.step('TC015_2 | Click Proceed and verify navigation', async () => {
    logSub(2, 'Click Proceed and verify navigation');
    await gotoDashboardWithRetry();
    currentUrl = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC015_3 | Deposit flow', async () => {
    logSub(3, 'Deposit flow');
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();
  });

  await test.step('TC015_4 | Validate investment details and select Gold SIP', async () => {
    logSub(4, 'Validate investment details and select Gold SIP');
    const totalInvestment = await withdrawalPage.getTotalInvestmentValue();
    console.log('Total Investment:', totalInvestment);

    totalGoldInvestment = await withdrawalPage.getTotalGoldValue();
    console.log('Total Investment Gold:', totalGoldInvestment);

    const totalSilverInvestment = await withdrawalPage.getTotalSilverValue();
    console.log('Total Investment Silver:', totalSilverInvestment);

    const selectedSipDetails = await dashboardPage.printGoldValueAndClickProceedBySipName(undefined, {
      minValueThreshold: 0.01,
      scrollDirection: 'up',
    });
    selectedSipName = selectedSipDetails.sipName;
    selectedSipMetalValue = selectedSipDetails.goldValue;
    selectedSipMetalType = selectedSipDetails.metalType;
    selectedSipMetalValueNumber = Number(selectedSipMetalValue.replace(/[^\d.]/g, ''));

    console.log('Selected SIP Name:', selectedSipName);
    console.log('Selected SIP Metal Type:', selectedSipMetalType);
    console.log('Selected SIP Metal Value:', selectedSipMetalValue);

    if (selectedSipMetalType !== 'Gold') {
      throw new Error(
        `[${TC015(4)}][FAIL] Expected Gold SIP for TC015 but selected "${selectedSipMetalType}" SIP (${selectedSipName}).`,
      );
    }
  });

  await test.step('TC015_5 | Verify withdrawal details', async () => {
    logSub(5, 'Verify withdrawal details');
    const withdrawing = await withdrawalPage.getWithdrawingValue();
    console.log('Withdrawing value before Withdrawal:', withdrawing);

    const remaining = await withdrawalPage.getRemainingValue();
    console.log('Remaining value before Withdrawal:', remaining);

    sellingPrice = await withdrawalPage.getSellingPrice();
    console.log('Selling Price:', sellingPrice);
  });

  await test.step('TC015_6 | Enter complete Gold SIP quantity and validate Proceed enabled', async () => {
    logSub(6, 'Enter complete Gold SIP quantity');
    if (selectedSipMetalValueNumber <= 0) {
      throw new Error(`[${TC015(6)}][FAIL] Selected Gold SIP value is too low: ${selectedSipMetalValue}`);
    }
    validQty = Number(selectedSipMetalValueNumber.toFixed(4));
    expectedWithdrawalAmount = Number((sellingPrice * validQty).toFixed(2));
    console.log('Expected withdrawal amount (selling price × valid qty):', expectedWithdrawalAmount);
    await withdrawalPage.clickUseTotalInvestmentAmountFromSipCheckbox();
    console.log('Selected checkbox: Use the total investment amount from this SIP');
    console.log('Expected complete SIP quantity (gm):', validQty);

    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('TC015_7 | Validate withdrawing and remaining after complete quantity', async () => {
    logSub(7, 'Validate withdrawing and remaining');
    await withdrawalPage.enterQuantity(validQty);

    const withdrawingValue = await withdrawalPage.getWithdrawingValue();
    const remainingValue = await withdrawalPage.getRemainingValue();

    console.log('Entered:', validQty);
    console.log('Withdrawing:', withdrawingValue);
    console.log('Remaining:', remainingValue);

    expect(withdrawingValue).toBeCloseTo(validQty, 2);
    expect(remainingValue).toBeCloseTo(0, 2);

    await Promise.all([
      page.waitForURL('**/withdraw/account-details'),
      withdrawalPage.clickProceed(),
    ]);
    console.log('Proceed button clicked');
  });

  await test.step('TC015_8 | Validate timer on account details page', async () => {
    logSub(8, 'Validate timer on account details page');
    const isTimerVisible = await withdrawalPage.isTimerVisible();
    console.log(`[${TC015(8)}] Timer visible:`, isTimerVisible);
    expect(isTimerVisible).toBe(true);

    const time1 = await withdrawalPage.getTimerText();
    console.log(`[${TC015(8)}] Initial timer text:`, time1);
    expect(time1).toMatch(/^\d{1,2}:\d{2}$/);

    await withdrawalPage.waitForTimerChange(time1);
    const time2 = await withdrawalPage.getTimerText();
    const sec1 = withdrawalPage.convertToSeconds(time1);
    const sec2 = withdrawalPage.convertToSeconds(time2);
    console.log(`[${TC015(8)}] Timer before:`, time1, `(${sec1}s)`);
    console.log(`[${TC015(8)}] Timer after:`, time2, `(${sec2}s)`);
    console.log(
      `[${TC015(8)}] Validation (timer countdown) => expected sec2 < sec1: ${sec2} < ${sec1} => ${sec2 < sec1}`,
    );
    expect(sec2).toBeLessThan(sec1);
  });

  await test.step('TC015_9 | Validate account details, bank selection, and amount calculation', async () => {
    logSub(9, 'Validate account details and amount calculation');
    const goldValue = await withdrawalPage.getMetalValueFromDetails('Gold');
    const amount = await withdrawalPage.getAmountFromAccountDetails();
    const totalAmount = await withdrawalPage.getTotalAmountFromAccountDetails();

    const expectedAmount = goldValue * sellingPrice;
    console.log(`[${TC015(9)}] Gold (g) from details:`, goldValue);
    console.log(`[${TC015(9)}] Selling price (₹/g):`, sellingPrice);
    console.log(`[${TC015(9)}] Expected amount (gold × selling price):`, expectedAmount);
    console.log(`[${TC015(9)}] Expected withdrawal amount (selling price × valid qty):`, expectedWithdrawalAmount);
    console.log(`[${TC015(9)}] Amount (UI):`, amount);
    console.log(`[${TC015(9)}] Total amount (UI):`, totalAmount);
    console.log(
      `[${TC015(9)}] Validation (total amount) => expected≈${expectedAmount}, actual=${totalAmount}`,
    );
    console.log(
      `[${TC015(9)}] Validation (line amount) => expected≈${expectedAmount}, actual=${amount}`,
    );
    expect(totalAmount).toBeCloseTo(expectedAmount, 2);
    expect(amount).toBeCloseTo(expectedAmount, 2);

    await withdrawalPage.selectBankAccount();
    totalAmountWithdraw = await withdrawalPage.getTotalWithdrawAmount();
    console.log(`[${TC015(9)}] Total withdraw amount (UI):`, totalAmountWithdraw);
    console.log(
      `[${TC015(9)}] Validation (withdraw vs total) => expected≈${totalAmount}, actual=${totalAmountWithdraw}`,
    );
    console.log(
      `[${TC015(9)}] Validation (withdraw vs selling×qty) => expected≈${expectedWithdrawalAmount}, actual=${totalAmountWithdraw}`,
    );
    expect(totalAmountWithdraw).toBeCloseTo(totalAmount, 2);
    expect(totalAmountWithdraw).toBeCloseTo(expectedWithdrawalAmount, 2);

    await withdrawalPage.clickProceedToWithdraw();
  });

  await test.step('TC015_10 | Validate withdrawal details on Dashboard', async () => {
    logSub(10, 'Validate withdrawal details on Dashboard');
    const withdrawalDetails = await paymentPage.getSuccessMessageAndContinueToDashboard();
    console.log('Validate withdrawal Details:', withdrawalDetails);
    const totalGoldAfterPurchase = totalGoldBeforePurchase - validQty;
    console.log(`[${TC015(10)}] Total gold after purchase:`, totalGoldAfterPurchase);
    console.log(`[${TC015(10)}] Validation (total gold after purchase) => expected≈${totalGoldBeforePurchase - validQty}, actual=${totalGoldAfterPurchase}`);
    expect(totalGoldAfterPurchase).toBeCloseTo(totalGoldBeforePurchase - validQty, 4);
  });

  await test.step('TC015_11 | Validate order details for withdrawn item in My Orders > Sell', async () => {
    logSub(11, 'Validate My Orders sell card details');
    await myOrderVerificationPage.goToMyOrders();
    await myOrderVerificationPage.clickSellTab();
    await myOrderVerificationPage.waitForSellWithdrawalOrderRow(expectedWithdrawalAmount);

    const sellCard = await myOrderVerificationPage.getLatestSellOrderCardDetails();

    console.log(`[${TC015(11)}] Sell card Date:`, sellCard.date);
    console.log(`[${TC015(11)}] Sell card Transaction ID:`, sellCard.transactionId);
    console.log(`[${TC015(11)}] Sell card Narration:`, sellCard.narration);
    console.log(`[${TC015(11)}] Sell card Amount:`, sellCard.amountText);

    const currentDate = new Date().toLocaleDateString('en-GB');
    expect(sellCard.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(sellCard.date).toBe(currentDate);
    expect(sellCard.transactionId).not.toBe('');
    expect(sellCard.narration).toContain('Sold');
    expect(sellCard.narration).toContain(validQty.toFixed(4));
    expect(sellCard.amountValue).toBeCloseTo(expectedWithdrawalAmount, 1);
    await myOrderVerificationPage.clickViewStatusOnLatestOrderRow();

    const orderDetails = await myOrderVerificationPage.getViewStatusOrderDetails();
    console.log(`[${TC015(11)}] View Status Transaction ID:`, orderDetails.transactionId);
    console.log(`[${TC015(11)}] View Status Narration:`, orderDetails.narration);
    console.log(`[${TC015(11)}] View Status Rate per 1 gm:`, orderDetails.ratePerGm);
    console.log(`[${TC015(11)}] View Status Amount:`, orderDetails.amount);
    console.log(`[${TC015(11)}] View Status Total Amount:`, orderDetails.totalAmount);
    console.log(`[${TC015(11)}] View Status Current Status:`, orderDetails.currentStatus);
    console.log(`[${TC015(11)}] View Status Payment Ref No:`, orderDetails.paymentRefNo);
    console.log(`[${TC015(11)}] View Status Payment Mode:`, orderDetails.paymentMode);
    console.log(`[${TC015(11)}] View Status Payment Date:`, orderDetails.paymentDate);

    const parsedRatePerGm = Number((orderDetails.ratePerGm.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
    const parsedAmount = Number((orderDetails.amount.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));
    const narrationQty = Number((orderDetails.narration.match(/([\d.]+)\s*gm/i)?.[1] ?? '0').trim());

    expect(orderDetails.narration).toContain('Sold');
    expect(narrationQty).toBeCloseTo(validQty, 4);
    expect(parsedRatePerGm).toBeCloseTo(sellingPrice, 2);
    expect(parsedAmount).toBeCloseTo(expectedWithdrawalAmount, 1);
    expect(orderDetails.currentStatus).toMatch(/^Pending$/i);
  });

  await test.step('TC015_12 | Validate Gold investment details after complete SIP withdrawal', async () => {
    logSub(12, 'Validate Gold investment details after complete SIP withdrawal');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
    await withdrawalPage.clickDeposit();
    await withdrawalPage.clickDepositProceed();

    const totalGoldAfterWithdrawalInvestment = totalGoldInvestment - validQty;
    const expectedGoldAfterWithdrawal = totalGoldInvestment - validQty;
    console.log(`[${TC015(12)}] Total investment gold (captured before withdrawal):`, totalGoldInvestment);
    console.log(`[${TC015(12)}] Withdrawn quantity (g):`, validQty);
    console.log(
      `[${TC015(12)}] Validation (investment gold after complete SIP withdrawal) => expected≈${expectedGoldAfterWithdrawal}, computed=${totalGoldAfterWithdrawalInvestment}`,
    );
    expect(totalGoldAfterWithdrawalInvestment).toBeCloseTo(totalGoldInvestment - validQty, 4);
  });
});
});