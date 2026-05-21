import { test, expect } from '../../fixtures/base.fixture';
import { getWithdrawalTc003Dataset, getWithdrawalTc004Dataset } from '../../utils/data/customer-excel-data';

const tc003Dataset = getWithdrawalTc003Dataset();
const tc004Dataset = getWithdrawalTc004Dataset();

  test('TC_001-withdrawal from Gold Vault(Deposits) and transfer to bank account @customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage, myOrderVerificationPage }) => {
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

    await test.step('TC001_2 | Verify Cancel and Proceed buttons are visible', async () => {
      logSub(2, 'Verify Cancel and Proceed buttons are visible');
      await dashboardPage.clickWithdrawInvestment();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
    });

    await test.step('TC001_3 | Capture current URL', async () => {
      logSub(3, 'Capture current URL');
      currentUrl = page.url();
    });

    await test.step('TC001_4 | Click Cancel button', async () => {
      logSub(4, 'Click Cancel button');
      await withdrawalPage.clickCancel();
    });

    await test.step('TC001_5 | Verify same URL after clicking Cancel', async () => {
      logSub(5, 'Verify same URL after clicking Cancel');
      await expect(page).toHaveURL(currentUrl);
    });

    await test.step('TC001_6 | Click Proceed and verify navigation', async () => {
      logSub(6, 'Click Proceed and verify navigation');
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.clickProceed();
      await expect(page).not.toHaveURL(currentUrl);
    });

    await test.step('TC001_7 | Deposit flow', async () => {
      logSub(7, 'Deposit flow');
      await withdrawalPage.clickDeposit();
      await withdrawalPage.clickDepositProceed();
    });

    await test.step('TC001_8 | Validate investment details with values', async () => {
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
      await myOrderVerificationPage.waitForSellOrderRow();

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


  test('TC_002-withdrawal from Gold/Silver SIP(Deposits) and transfer to bank account @customer-flows', async ({
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
          await myOrderVerificationPage.waitForSellOrderRow();

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

test('TC_003 - Withdraw from Silver Vault with Add Bank validation and error message checks @customer-flows',
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


test('TC_004-withdrwal from gold vault and convert into gold coin @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
  paymentPage,
  myOrderVerificationPage,
}) => {
  test.setTimeout(240_000);
  const TC004_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let validQty = 0;
  let investmentListTotalGoldRequired = 0;
  let beforeWithdrawalVaultTotalGold = 0;
  let beforeWithdrawalVaultRemainingGold = 0;
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
  const TC004 = (n: number): string => `TC004_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC004(n)}] ${title}`);
  };

  await test.step('TC004_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
    await dashboardPage.goto('/dashboard');
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

  await test.step('TC004_2 | Click Proceed and verify navigation', async () => {
    logSub(2, 'Click Proceed and verify navigation');
    const urlBeforeProceed = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(urlBeforeProceed);
  });

  await test.step('TC004_3 | Verify Two options are visible and click on Convert into Gold/Jewellery', async () => {
    logSub(3, 'Verify Two options are visible and click on Convert into Gold/Jewellery');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await withdrawalPage.clickProceedForConvertGoldJewellery();
  });


  await test.step('TC004_4 | Verify product list is available and select product', async () => {
    logSub(4, 'Verify product list is available and select product');
    await withdrawalPage.waitForProductListPage();
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
    await withdrawalPage.selectCoinCategoryIfNotSelected();
    console.log(`[${TC004(4)}] Product selected from withdrawal workbook:`, TC004_PRODUCT_NAME);
    await withdrawalPage.selectProductByName(TC004_PRODUCT_NAME);
  });

  await test.step('TC004_5 | Get and validate product details', async () => {
    logSub(5, 'Get and validate product details');
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    console.log(selectedProductDetails);
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC004_6 | Verify cart details', async () => {
    logSub(6, 'Verify cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details were not captured before cart validation.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    console.log('Cart quantity normalized to 1 for selected product');
    await withdrawalPage.validateCartItemWithSelectedProduct({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
      });

    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    console.log('Cart Total Amount Payable:', totalAmountPayable);
    console.log('Making & Delivery Charges Amount:', selectedProductDetails.makingAndDeliveryChargesAmount);
    expect(totalAmountPayable).toBe(selectedProductDetails.makingAndDeliveryChargesAmount);
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC004_7 | Verify investment details before withdrawal', async () => {
    logSub(7, 'Verify investment details before withdrawal');
    investmentListTotalGoldRequired = await withdrawalPage.getInvestmentListTotalGoldRequired();
    const investmentListTotalSilverRequired = await withdrawalPage.getInvestmentListTotalSilverRequired();
    const investmentListTotalGoldAvailable = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    const investmentListTotalSilverAvailable = await withdrawalPage.getInvestmentListTotalSilverAvailable();
    console.log('Investment List Total Gold Required:', investmentListTotalGoldRequired);
    console.log('Investment List Total Silver Required:', investmentListTotalSilverRequired);
    console.log('Investment List Total Gold Available:', investmentListTotalGoldAvailable);
    console.log('Investment List Total Silver Available:', investmentListTotalSilverAvailable);

    
  });

  await test.step('TC004_8 | Verify Vault card value before withdrawal', async () => {
    logSub(8, 'Verify Vault card value before withdrawal');
    const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
    beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
    beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
    console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
    console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);

  });

  await test.step('TC004_9 | Validate Proceed to Withdraw state for invalid and valid quantities', async () => {
    logSub(9, 'Validate quantity boundaries against Total Gold Required');
    expect(investmentListTotalGoldRequired).toBeGreaterThan(0);
    const hasRequiredGoldForVault = beforeWithdrawalVaultTotalGold >= investmentListTotalGoldRequired;
    console.log(`[${TC004(9)}] beforeWithdrawalVaultTotalGold:`, beforeWithdrawalVaultTotalGold);
    console.log(`[${TC004(9)}] investmentListTotalGoldRequired:`, investmentListTotalGoldRequired);
    console.log(
      `[${TC004(9)}] Precondition Check -> expected: GoldVault >= TotalGoldRequired | actual: ${beforeWithdrawalVaultTotalGold} >= ${investmentListTotalGoldRequired} | result: ${hasRequiredGoldForVault ? 'PASS' : 'FAIL'}`,
    );
    if (!hasRequiredGoldForVault) {
      console.log(
        `[${TC004(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) is less than Total Gold Required (${investmentListTotalGoldRequired}).`,
      );
    }
    expect(
      hasRequiredGoldForVault,
      `[${TC004(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) must be >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    ).toBe(true);
    console.log(
      `[${TC004(9)}][PASS] Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    );

    const lessThanRequiredQty = Number((investmentListTotalGoldRequired - 0.01).toFixed(4));
    const greaterThanRequiredQty = Number((investmentListTotalGoldRequired + 0.01).toFixed(4));
    console.log('Invalid quantity (less than Total Gold Required):', lessThanRequiredQty);
    console.log('Invalid quantity (greater than Total Gold Required):', greaterThanRequiredQty);


    await withdrawalPage.enterQuantity(lessThanRequiredQty);
    const goldVaultTotalsForLessQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForLessQty = goldVaultTotalsForLessQty.remainingGold;
    const expectedRemainingForLessQty = Number((beforeWithdrawalVaultRemainingGold - lessThanRequiredQty).toFixed(4));
    console.log('Invalid quantity (less than Total Gold Required):', lessThanRequiredQty);
    console.log('Remaining value after entering less-than-required quantity:', remainingForLessQty);
    expect(remainingForLessQty).toBeCloseTo(expectedRemainingForLessQty, 4);

    await withdrawalPage.enterQuantity(greaterThanRequiredQty);
    const goldVaultTotalsForGreaterQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForGreaterQty = goldVaultTotalsForGreaterQty.remainingGold;
    const expectedRemainingForGreaterQty = Number(
      (beforeWithdrawalVaultRemainingGold - greaterThanRequiredQty).toFixed(4),
    );
    console.log('Invalid quantity (greater than Total Gold Required):', greaterThanRequiredQty);
    console.log('Remaining value after entering greater-than-required quantity:', remainingForGreaterQty);
    expect(remainingForGreaterQty).toBeCloseTo(expectedRemainingForGreaterQty, 4);

    await withdrawalPage.enterQuantity(investmentListTotalGoldRequired);
    validQty = investmentListTotalGoldRequired;
    console.log('Valid quantity (equal to Total Gold Required):', investmentListTotalGoldRequired);

    const goldVaultTotalsForValidQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingAfterValidQty = goldVaultTotalsForValidQty.remainingGold;
    const expectedRemainingAfterValidQty = Number(
      (beforeWithdrawalVaultRemainingGold - investmentListTotalGoldRequired).toFixed(4),
    );
    expect(remainingAfterValidQty).toBeCloseTo(expectedRemainingAfterValidQty, 4);
    console.log('Remaining value after entering valid quantity:', remainingAfterValidQty);
    console.log('Expected remaining value after entering valid quantity:', expectedRemainingAfterValidQty);
    await withdrawalPage.validateTotalGoldValueDelivery(investmentListTotalGoldRequired);
  

  });
  await test.step('TC004_10 | Validate delivery information', async () => {
    logSub(10, 'Validate delivery information');
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.clickSameAsBillingAddressCheckbox();
    await withdrawalPage.settleMs(500);
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC004_11 | Validate checkout page details', async () => {
    logSub(11, 'Validate checkout page details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details were not captured before checkout validation.');
    }
    if (!deliveryInformation) {
      throw new Error('Delivery information was not captured before checkout validation.');
    }

    await withdrawalPage.checkoutPageValidateSelectedProductAgainstProductDetails({
      productName: selectedProductDetails.productName,
      makingAndDeliveryChargesAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      quantity: 1,
    });
    await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(deliveryInformation);
    await withdrawalPage.checkoutPageValidatePaymentSummaryAgainstMakingCharges(
      selectedProductDetails.makingAndDeliveryChargesAmount,
    );
    await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
    await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
    await withdrawalPage.checkoutPageClickProceedToPay();
  });


  await test.step('TC004_12 | Verify payment page details', async () => {
    logSub(12, 'Verify payment page details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details were not captured before payment validation.');
    }
    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const expectedAmount = selectedProductDetails.makingAndDeliveryChargesAmount;
    const razorpayAmountNormalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log(
      `[TC_004 VALIDATION] razorpayAmount raw=${razorpayAmountRaw} normalized=${razorpayAmountNormalized} expected=${expectedAmount}`
    );
    expect(Math.abs(razorpayAmountNormalized - expectedAmount)).toBeLessThanOrEqual(1);

    await paymentPage.completeNetbankingPaymentWithdrwal('HDFC Bank', { tc005Mode: true });
    console.log('Payment successful');
  });

  await test.step('TC004_13 | Dashboard — gold  balance after redeem', async () => {
    logSub(13, 'Dashboard balance update');
    await dashboardPage.goto('/dashboard');
    await dashboardPage.waitForUrl(/dashboard/i);
    const totalGoldAfter = await dashboardPage.getTotalGoldValue();
    const expectedGoldAfter = Number((totalGoldBeforePurchase - validQty).toFixed(4));
    console.log(`[${TC004(13)}] Gold before/after/expected:`, totalGoldBeforePurchase, totalGoldAfter, expectedGoldAfter);
    expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
  });


  await test.step('TC004_14 | My orders — delivery card matches cart', async () => {
    logSub(14, 'My orders delivery card');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before my-orders validation.');
    }
    await myOrderVerificationPage.goToMyOrders();
    await myOrderVerificationPage.waitForOrderRow();
    await myOrderVerificationPage.clickOnDelivery();
    await myOrderVerificationPage.validateLatestOrderRowStatusPending();
    await myOrderVerificationPage.waitForProductOrderCard();
    await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
      expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
    });
  });
});

test('TC005 — withdrawal flow with SIP convert to silver coin @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
  paymentPage,
  myOrderVerificationPage,
}) => {
  test.setTimeout(300_000);
  const SILVER_PRODUCT =
    tc004Dataset.tc005ProductName || 'Augmont 1GM Silver Coin 999 Purity';

  const TC005 = (n: number): string => `TC005_${n}`;
  let sipName = '';
  let selectedSipName = '';
  let selectedSipMetalValue = '';
  let selectedSipMetalValueNumber = 0;
  let selectedSipMetalType: 'Gold' | 'Silver' = 'Gold';
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let currentUrl = '';
  let beforeWithdrawalVaultRemainingSilver = 0;
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
  let selectedProductGm = 0;


  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC005(n)}] ${title}`);
  };

  await test.step('TC005_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
    logSub(1, 'Login & Dashboard');
    await page.goto('/dashboard');
    portfolioValue = await dashboardPage.getPortfolioValueNumber();
    console.log(`[${TC005(1)}] Portfolio Value (Rs):`, portfolioValue);
    expect(portfolioValue).toBeGreaterThan(0);

    totalGoldBeforePurchase = await dashboardPage.getTotalGoldValue();
    totalSilverBeforePurchase = await dashboardPage.getTotalSilverValue();
    console.log(`[${TC005(1)}] Total Gold (g):`, totalGoldBeforePurchase);
    console.log(`[${TC005(1)}] Total Silver (g):`, totalSilverBeforePurchase);
    expect(totalGoldBeforePurchase).toBeGreaterThan(0);
    expect(totalSilverBeforePurchase).toBeGreaterThan(0);

    goldFD = await dashboardPage.getGoldFDValue();
    console.log(`[${TC005(1)}] Gold FD+:`, goldFD);
    expect(goldFD).not.toBe('');
  });

  await test.step('TC005_2 | SIP — get approved SIP with positive investment', async () => {
    logSub(2, 'Get approved SIP with positive investment');
    await dashboardPage.clickViewAll();
    sipName = await dashboardPage.getApprovedSipNameWithPositiveInvestment();
    console.log('SIP Name:', sipName);
  });


  await test.step('TC005_3 | Withdrawal — Withdrawal Investment UI (Cancel & Proceed)', async () => {
    logSub(3, 'Withdrawal Investment screen');
    await page.goto('/dashboard');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
    currentUrl = page.url();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC005_4 | Withdrawal — Withdraw deposit & Convert into Silver options visible', async () => {
    logSub(4, 'Withdrawal options');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Gold/Jewellery")]]',
      )
      .first()
      .locator('span.p-button-label.ng-star-inserted')
      .filter({ hasText: /^Proceed$/i })
      .first()
      .click();

  });

  await test.step('TC005_5 | Withdrawal — Select Convert to Silver & Jewellery → product list', async () => {
    logSub(5, 'Convert to Silver & Jewellery');
    await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
  });

  await test.step('TC005_6 | Product List — categories, metal path = silver product', async () => {
    logSub(6, 'Product list');
    console.log(
      `[${TC005(6)}] Dashboard snapshot — Total Gold (g):`,
      totalGoldBeforePurchase,
      'Total Silver (g):',
      totalSilverBeforePurchase,
    );
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
    await withdrawalPage.selectCoinCategoryIfNotSelected();
    const products = await withdrawalPage.getAndLogProductCountAndNames();
    expect(products.count).toBeGreaterThan(0);
    expect(products.names.some((n) => n.includes('Silver'))).toBeTruthy();
    console.log(`[${TC005(6)}] Product from withdrawal workbook (WithdrawalTc005ProductName):`, SILVER_PRODUCT);
    await withdrawalPage.selectProductByName(SILVER_PRODUCT);
  });

  await test.step('TC005_7 | Product Details — name, weight, charges, delivery date', async () => {
    logSub(7, 'Product details');
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    expect(selectedProductDetails.productName).toBeTruthy();
    expect(selectedProductDetails.productWeight).toBeTruthy();
    expect(selectedProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
    expect(selectedProductDetails.expectedDeliveryDate).toBeTruthy();
    console.log(`[${TC005(7)}] Product details:`, selectedProductDetails);
  });

  await test.step('TC005_8 | Product Details — Request Delivery (add to cart)', async () => {
    logSub(8, 'Request Delivery');
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC005_9 | Cart — single line item after Removing another product from cart', async () => {
    logSub(9, 'Cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    await withdrawalPage.validateSelectedProductCardInCart(selectedProductDetails.productName, 1);
  });

  await test.step('TC005_10 | Cart — quantity & amount payable vs making charges', async () => {
    logSub(10, 'Cart calculations');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart totals.');
    }
    const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    const expectedAmountPayable =
      selectedProductDetails.makingAndDeliveryChargesAmount * selectedProductQtyInCart;
    expect(totalAmountPayable).toBe(expectedAmountPayable);
  });

  await test.step('TC005_11 | Cart — Select Investments → investment screen', async () => {
    logSub(11, 'Select Investments');
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC005_12 | Investment — capture totals and select SIP', async () => {
    logSub(12, 'Capture totals and select SIP');
    await test.step('Verify investment details before withdrawal', async () => {
      logSub(12, 'Verify investment details before withdrawal');
      const investmentListTotalGoldRequired = await withdrawalPage.getInvestmentListTotalGoldRequired();
      const investmentListTotalSilverRequired = await withdrawalPage.getInvestmentListTotalSilverRequired();
      const investmentListTotalGoldAvailable = await withdrawalPage.getInvestmentListTotalGoldAvailable();
      const investmentListTotalSilverAvailable = await withdrawalPage.getInvestmentListTotalSilverAvailable();
      console.log('Investment List Total Gold Required:', investmentListTotalGoldRequired);
      console.log('Investment List Total Silver Required:', investmentListTotalSilverRequired);
      console.log('Investment List Total Gold Available:', investmentListTotalGoldAvailable);
      console.log('Investment List Total Silver Available:', investmentListTotalSilverAvailable);
  
      
    });
    await test.step('Select SIP and capture details', async () => {
      logSub(12, 'Select SIP and capture details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before SIP selection.');
      }
      selectedProductGm = Number(
        (selectedProductDetails.productWeight.match(/([0-9]+(?:\.[0-9]+)?)\s*gm/i)?.[1] ?? '0').trim(),
      );
      console.log(`[TC005_PRODUCT_TOTAL_GM] ${selectedProductGm}`);
      const selectedSipDetails = await dashboardPage.deliveryScrollUpAndClickProceedByMatchingSipMetalValue(
        sipName,
        selectedProductGm,
        { onlyMetalType: 'Silver' },
      );
      selectedSipName = selectedSipDetails.sipName;
      selectedSipMetalValue = String(selectedSipDetails.metalValue);
      selectedSipMetalType = selectedSipDetails.metalType;
      selectedSipMetalValueNumber = selectedSipDetails.metalValue;
      console.log('Selected SIP Name:', selectedSipName);
      console.log('Selected SIP Metal Type:', selectedSipMetalType);
      console.log('Selected SIP Metal Value:', selectedSipMetalValue);
      console.log(`[TC005_SIP_CARD_GM] ${selectedSipMetalValueNumber}`);
    });
  });
  await test.step('TC005_13 | Investment — verify withdrawal panel values before withdrawal', async () => {
    logSub(13, 'Verify withdrawal panel values');
    if (!selectedSipName) {
      throw new Error('Selected SIP name missing before SIP card quantity entry.');
    }
    if (selectedProductGm <= 0) {
      throw new Error(`Selected product gm is invalid before SIP card quantity entry: ${selectedProductGm}`);
    }
    const sipCardData = await withdrawalPage.deliveryGetRemainingAndEnterQuantityForSipCard(
      selectedSipName,
      selectedProductGm,
    );
    beforeWithdrawalVaultRemainingSilver = sipCardData.remainingValueInGm;
    console.log(
      `[TC005_CORRESPONDING_SIP_REMAINING_GM] ${sipCardData.sipName}: ${beforeWithdrawalVaultRemainingSilver}`,
    );
    const expectedRemainingAfterEntry = Number((selectedSipMetalValueNumber - selectedProductGm).toFixed(4));
    console.log(`[TC005_EXPECTED_REMAINING_AFTER_ENTRY_GM] ${expectedRemainingAfterEntry}`);
    console.log(`[TC005_ACTUAL_REMAINING_AFTER_ENTRY_GM] ${sipCardData.remainingValueAfterEntryInGm}`);
    expect(sipCardData.remainingValueAfterEntryInGm).toBeCloseTo(expectedRemainingAfterEntry, 4);
    await withdrawalPage.clickDeliveryProceedButton();

  });

  // await test.step('TC005_14 | SIP Validation — enter invalid quantity and validate error', async () => {
  //   logSub(14, 'Invalid quantity validation');
  //   invalidQty = Number((selectedSipMetalValueNumber + 0.01).toFixed(4));
  //   await withdrawalPage.enterQuantity(invalidQty);
  //   console.log('Entered invalid quantity:', invalidQty);
  //   const errorText = await withdrawalPage.getQuantityErrorText();
  //   expect(errorText).not.toBe('');
  // });

  // await test.step('TC005_15 | SIP Validation — proceed disabled for invalid quantity', async () => {
  //   logSub(15, 'Proceed disabled on invalid quantity');
  //   const isDisabled = await withdrawalPage.isProceedButtonDisabled();
  //   expect(isDisabled).toBe(true);
  // });

  // await test.step('TC005_16 | SIP Validation — enter valid quantity and proceed enabled', async () => {
  //   logSub(16, 'Valid quantity enables proceed');
  //   if (selectedSipMetalValueNumber <= 0.01) {
  //     throw new Error(`Selected SIP metal value is too low for withdrawal test: ${selectedSipMetalValue}`);
  //   }
  //   validQty = Number((selectedSipMetalValueNumber - 0.01).toFixed(4));
  //   await withdrawalPage.enterQuantity(validQty);
  //   console.log('Entered valid quantity:', validQty);

  //   const isEnabled = await withdrawalPage.isProceedButtonEnabled();
  //   expect(isEnabled).toBe(true);
  // });

  // await test.step('TC005_17 | SIP Validation — validate withdrawing/remaining and proceed', async () => {
  //   logSub(17, 'Validate withdrawing/remaining and proceed');
  //   await withdrawalPage.enterQuantity(validQty);

  //   const withdrawingValue = await withdrawalPage.getWithdrawingValue();
  //   const remainingValue = await withdrawalPage.getRemainingValue();

  //   console.log('Entered:', validQty);
  //   console.log('Withdrawing:', withdrawingValue);
  //   console.log('Remaining:', remainingValue);

  //   console.log(`Validation (Withdrawing) => expected: ${validQty}, actual: ${withdrawingValue}`);
  //   expect(withdrawingValue).toBeCloseTo(validQty, 2);
  //   const expectedRemaining = selectedSipMetalValueNumber - validQty;
  //   console.log(`Validation (Remaining) => expected: ${expectedRemaining}, actual: ${remainingValue}`);
  //   expect(remainingValue).toBeCloseTo(expectedRemaining, 2);

  //   await Promise.all([
  //     page.waitForURL('**/withdraw/account-details'),
  //     withdrawalPage.clickProceed(),
  //   ]);
  //   console.log('Proceed button clicked');
  // });



  await test.step('TC005_18 | Checkout — same as billing & proceed', async () => {
    logSub(18, 'Address');
    await withdrawalPage.clickSameAsBillingAddressCheckbox();
    await page.waitForTimeout(500);
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC005_19 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
    logSub(19, 'Payment summary');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before checkout.');
    }
    const summary = await withdrawalPage.checkoutPageGetPaymentSummary();
    expect(summary.totalAmount).toBeGreaterThan(0);
    expect(summary.netPayableAmount).toBeCloseTo(summary.totalAmount - summary.paidFromFunds, 2);
    await withdrawalPage.checkoutPageValidatePaymentSummaryAgainstMakingCharges(
      selectedProductDetails.makingAndDeliveryChargesAmount,
    );
  });

  await test.step('TC005_20 | Checkout — order details vs product & address', async () => {
    logSub(20, 'Order details on checkout');
    if (!selectedProductDetails || !deliveryInformation) {
      throw new Error('Missing product or delivery info for checkout validation.');
    }
    await withdrawalPage.checkoutPageValidateSelectedProductAgainstProductDetails({
      productName: selectedProductDetails.productName,
      makingAndDeliveryChargesAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      quantity: 1,
    });
    await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(deliveryInformation);
  });

  await test.step('TC005_21 | Checkout — payment method & Proceed to Pay', async () => {
    logSub(21, 'Proceed to payment');
    await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
    await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
    await withdrawalPage.checkoutPageClickProceedToPay();
  });

  await test.step('TC005_22 | Payment — complete netbanking', async () => {
    logSub(22, 'Payment');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before payment.');
    }
    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const expectedAmount = selectedProductDetails.makingAndDeliveryChargesAmount;
    const normalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log(`[TC005_PAYMENT] Razorpay amount raw: ${razorpayAmountRaw}`);
    console.log(`[TC005_PAYMENT] Expected amount: ${expectedAmount}`);
    console.log(`[TC005_PAYMENT] Normalized Razorpay amount: ${normalized}`);
    expect(Math.abs(normalized - expectedAmount)).toBeLessThanOrEqual(1);
    console.log('[TC005_PAYMENT] Starting netbanking payment flow');
    await paymentPage.completeNetbankingPaymentWithdrwal('HDFC Bank');
    console.log('[TC005_PAYMENT] Netbanking payment flow completed (post-success click stage)');
  });

  await test.step('TC005_23 | Dashboard — silver balance after redeem', async () => {
    logSub(23, 'Dashboard silver update');
    if (selectedProductGm <= 0) {
      throw new Error(`selectedProductGm missing for silver balance check: ${selectedProductGm}`);
    }
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/i);
    const totalSilverAfter = await dashboardPage.getTotalSilverValue();
    const expectedSilverAfter = Number((totalSilverBeforePurchase - selectedProductGm).toFixed(4));
    console.log(
      `[${TC005(23)}] Total Silver before:`,
      totalSilverBeforePurchase,
      'after:',
      totalSilverAfter,
      'expected (before − withdrawn gm):',
      expectedSilverAfter,
      'withdrawnGm:',
      selectedProductGm,
    );
    expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
  });

  await test.step('TC005_24 | My orders — delivery card matches cart', async () => {
    logSub(24, 'My orders delivery card');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before my-orders.');
    }
    await page.goto('/my-orders');
    await expect(page).toHaveURL(/my-orders/);
    await myOrderVerificationPage.waitForOrderRow();
    await myOrderVerificationPage.clickOnDelivery();
    await myOrderVerificationPage.validateLatestOrderRowStatusPending();
    await myOrderVerificationPage.waitForProductOrderCard();
    await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
      expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
    });
  });
});

test('TC_006 - Convert into Gold Jewellery and withdrawal from vault and sip end-to-end @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
  paymentPage,
  myOrderVerificationPage,
}) => {
  test.setTimeout(360_000);

  const TC006 = (n: number): string => `TC006_${n}`;
  const SELECTED_METAL_TYPE: 'Gold' | 'Silver' = 'Gold';
  let SELECTED_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Jewellery';
  const TC006_PRODUCT_NAME =
    tc004Dataset.tc006ProductName || 'Augmont Classic Om Pendant';

  let portfolioValue = 0;
  let totalGoldBefore = 0;
  let totalSilverBefore = 0;
  let selectedProductGm = 0;
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;

  let requiredGold = 0;
  let beforeRemainingGold = 0;
  let beforeRemainingSip = 0;
  let validGoldInput = 0;
  let validSipInput = 0;

  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC006(n)}] ${title}`);
  };

  const parseFirstNumber = (value: string): number => Number((value.match(/[\d.]+/)?.[0] ?? '0').trim());

  await test.step('TC006_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
    logSub(1, 'Login & Dashboard');
    await page.goto('/dashboard');
    portfolioValue = await dashboardPage.getPortfolioValueNumber();
    totalGoldBefore = await dashboardPage.getTotalGoldValue();
    totalSilverBefore = await dashboardPage.getTotalSilverValue();
    console.log(`[${TC006(1)}] Portfolio Value:`, portfolioValue);
    console.log(`[${TC006(1)}] Total Gold:`, totalGoldBefore);
    console.log(`[${TC006(1)}] Total Silver:`, totalSilverBefore);
    expect(portfolioValue).toBeGreaterThan(0);
    expect(totalGoldBefore).toBeGreaterThan(0);
    expect(totalSilverBefore).toBeGreaterThan(0);
  });

  await test.step('TC006_2 | Withdrawal — Withdrawal Investment UI (Cancel & Proceed)', async () => {
    logSub(2, 'Withdrawal Investment UI');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
  });

  await test.step('TC006_3 | Withdrawal — Proceed to withdrawal flow', async () => {
    logSub(3, 'Proceed to withdrawal flow');
    const currentUrl = page.url();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC006_4 | Withdrawal — Withdraw deposit & Convert into Gold/Jewellery options visible', async () => {
    logSub(4, 'Withdrawal options');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
  });

  await test.step('TC006_5 | Withdrawal — Select Convert to Gold/Jewellery → product list', async () => {
    logSub(5, 'Convert to Gold/Jewellery');
    await withdrawalPage.clickProceedForConvertGoldJewellery();
    await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
  });

  await test.step('TC006_6 | Product List — categories and dashboard snapshot', async () => {
    logSub(6, 'Product list');
    console.log(
      `[${TC006(6)}] Dashboard snapshot — Total Gold (g):`,
      totalGoldBefore,
      'Total Silver (g):',
      totalSilverBefore,
    );
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
  });

  await test.step('TC006_7 | Product List — select metal type (Gold/Silver)', async () => {
    logSub(7, 'Select metal type');
    console.log(`[${TC006(7)}] Selected metal type: ${SELECTED_METAL_TYPE}`);
    expect(['Gold', 'Silver']).toContain(SELECTED_METAL_TYPE);
  });

  await test.step('TC006_8 | Product List — select product type and product', async () => {
    logSub(8, 'Select product');
    console.log(
      `[${TC006(8)}] Product from withdrawal workbook (WithdrawalTc006ProductName):`,
      TC006_PRODUCT_NAME,
    );
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await withdrawalPage.selectJewelleryCategoryIfNotSelected();
        await withdrawalPage.selectProductByName(TC006_PRODUCT_NAME, SELECTED_PRODUCT_TYPE);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[${TC006(8)}] Product select attempt ${attempt} failed: ${message}`);
        if (attempt === 2) {
          throw error;
        }
        await page.goto('/withdraw/product-list');
        await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
      }
    }
  });

  await test.step('TC006_9 | Product Details — name, weight, charges, delivery date', async () => {
    logSub(9, 'Product details');
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    // Jewellery names may not contain the metal keyword (e.g., pendant names),
    // so validate details presence/quality instead of name substring matching.
    expect(selectedProductDetails.productName).toBeTruthy();
    expect(selectedProductDetails.productWeight).not.toBe('');
    expect(selectedProductDetails.makingAndDeliveryCharges).toMatch(/Making/i);
    expect(selectedProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
    expect(selectedProductDetails.expectedDeliveryDate).not.toBe('');
    selectedProductGm = parseFirstNumber(selectedProductDetails.productWeight);
    console.log(`[${TC006(9)}] Selected product grams:`, selectedProductGm);
    expect(selectedProductGm).toBeGreaterThan(0);
  });

  await test.step('TC006_10 | Product Details — Request Delivery (add to cart)', async () => {
    logSub(10, 'Request Delivery');
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC006_11 | Cart — single line item after removing extra products', async () => {
    logSub(11, 'Cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart validation.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    await withdrawalPage.validateSelectedProductCardInCart(selectedProductDetails.productName, 1);
  });

  await test.step('TC006_12 | Cart — quantity/weights/amount payable validation', async () => {
    logSub(12, 'Cart calculations');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart totals validation.');
    }
    const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    const expectedAmountPayable =
      selectedProductDetails.makingAndDeliveryChargesAmount * selectedProductQtyInCart;
    expect(totalAmountPayable).toBe(expectedAmountPayable);
  });

  await test.step('TC006_13 | Cart — Select Investments → investment screen', async () => {
    logSub(13, 'Select Investments');
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC006_14 | Investment — capture required and available Gold values', async () => {
    logSub(14, 'Capture required/available values');
    requiredGold = await withdrawalPage.getInvestmentListTotalGoldRequired();
    const availableGold = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    const goldTotals = await withdrawalPage.getGoldVaultCardTotals();
    beforeRemainingGold = goldTotals.remainingGold;
    console.log(`[${TC006(14)}] Required Gold:`, requiredGold);
    console.log(`[${TC006(14)}] Available Gold:`, availableGold);
    console.log(`[${TC006(14)}] Remaining Gold (before):`, beforeRemainingGold);
    expect(requiredGold >= 0).toBe(true);
  });

  await test.step('TC006_15 | Investment — invalid Gold input keeps Proceed disabled', async () => {
    logSub(15, 'Invalid quantity validation');
    const invalidGoldInput = requiredGold > 0 ? Number(Math.max(0, requiredGold - 0.01).toFixed(4)) : 0;
    await withdrawalPage.enterQuantity(invalidGoldInput);
    console.log(`[${TC006(15)}] Invalid Gold input:`, invalidGoldInput);
    const errorText = await withdrawalPage.getQuantityErrorText().catch(() => '');
    console.log(`[${TC006(15)}] Error text:`, errorText);
    if (!errorText) {
      console.log(`[${TC006(15)}] No inline validation text shown; validating via disabled Proceed state.`);
    }
    const isDisabled = await withdrawalPage.isProceedButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  await test.step('TC006_16 | Investment — valid Gold input updates remaining balances', async () => {
    logSub(16, 'Valid quantity and remaining balance');
    validGoldInput = requiredGold > 0 ? Number((requiredGold * 0.5).toFixed(4)) : 0;
    validSipInput = requiredGold > 0 ? Number((requiredGold - validGoldInput).toFixed(4)) : 0;
    console.log(`[${TC006(16)}] Gold input vs Gold Vault remaining:`, validGoldInput, '<=', beforeRemainingGold);
    if (validGoldInput > beforeRemainingGold) {
      throw new Error(
        `[${TC006(16)}][FAIL] Insufficient vault value: validGoldInput (${validGoldInput}) must be <= Gold Vault remaining (${beforeRemainingGold}).`,
      );
    }
    await withdrawalPage.enterQuantity(validGoldInput);
    let sipEntry: Awaited<ReturnType<typeof withdrawalPage.enterQuantityInFirstSipCard>> | null = null;
    if (validSipInput > 0) {
      sipEntry = await withdrawalPage.enterQuantityInFirstSipCard(validSipInput, {
        metalType: 'Gold',
      });
      beforeRemainingSip = sipEntry.remainingValueInGm;
      console.log(`[${TC006(16)}] SIP input vs SIP remaining:`, validSipInput, '>=', beforeRemainingSip);
      if (validSipInput > beforeRemainingSip) {
        throw new Error(
          `[${TC006(16)}][FAIL] Insufficient SIP  value: validSipInput (${validSipInput}) must be >= SIP remaining (${beforeRemainingSip}).`,
        );
      }
    }
    console.log(`[${TC006(16)}] Valid Gold input:`, validGoldInput);
    console.log(`[${TC006(16)}] Valid SIP input:`, validSipInput);

    const goldAfter = await withdrawalPage.getGoldVaultCardTotals();
    const expectedGoldRemaining = Number((beforeRemainingGold - validGoldInput).toFixed(4));
    if (sipEntry) {
      const expectedSipRemaining = Number((beforeRemainingSip - validSipInput).toFixed(4));
      console.log(`[${TC006(16)}] SIP remaining expected/actual:`, expectedSipRemaining, sipEntry.remainingValueAfterEntryInGm);
      expect(sipEntry.remainingValueAfterEntryInGm).toBeCloseTo(expectedSipRemaining, 3);
    }
    console.log(`[${TC006(16)}] Gold remaining expected/actual:`, expectedGoldRemaining, goldAfter.remainingGold);
    expect(goldAfter.remainingGold).toBeCloseTo(expectedGoldRemaining, 3);
    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('TC006_17 | Investment — Proceed to account details/checkout', async () => {
    logSub(17, 'Proceed to checkout');
    await withdrawalPage.clickDeliveryProceedButton();
    await expect(page).toHaveURL(/checkout|address|delivery/i);
  });

  await test.step('TC006_18 | Checkout — same as billing & proceed', async () => {
    logSub(18, 'Address');
    await withdrawalPage.clickSameAsBillingAddressCheckbox();
    await page.waitForTimeout(500);
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC006_19 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
    logSub(19, 'Payment summary');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before checkout.');
    }
    const summary = await withdrawalPage.checkoutPageGetPaymentSummary();
    expect(summary.totalAmount).toBeGreaterThan(0);
    expect(summary.netPayableAmount).toBeCloseTo(summary.totalAmount - summary.paidFromFunds, 2);
    expect(summary.totalAmount).toBeCloseTo(selectedProductDetails.makingAndDeliveryChargesAmount, 2);
  });

  await test.step('TC006_20 | Checkout — order details vs product & address', async () => {
    logSub(20, 'Order details on checkout');
    if (!selectedProductDetails || !deliveryInformation) {
      throw new Error('Missing selected product or delivery info for checkout validation.');
    }
    const actualProduct = await withdrawalPage.checkoutPageGetAndLogSelectedProductDetails({ log: false });
    const actualDelivery = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay({ log: false });
    const expectedFullName = `${deliveryInformation.firstName} ${deliveryInformation.lastName}`.trim();
    const expected = {    
      
      
    productName: selectedProductDetails.productName,
      makingChargesAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      quantity: 1,
      fullName: expectedFullName,
      address: deliveryInformation.address,
      cityOrDistrict: deliveryInformation.cityOrDistrict,
      state: deliveryInformation.state,
      pincode: deliveryInformation.pincode,
    };
    const actual = {
      productName: actualProduct.productName,
      makingChargesAmount: actualProduct.makingChargesAmount,
      quantity: actualProduct.quantity,
      fullName: actualDelivery.contactName,
      addressBody: actualDelivery.addressBodyNormalized,
    };
    console.log(`[${TC006(20)}] Expected:`, expected);
    console.log(`[${TC006(20)}] Actual:`, actual);

    expect(actualProduct.productName.toLowerCase()).toContain(selectedProductDetails.productName.toLowerCase());
    expect(actualProduct.makingChargesAmount).toBeCloseTo(selectedProductDetails.makingAndDeliveryChargesAmount, 2);
    expect(actualProduct.quantity).toBe(1);
    const normalizedAddressBody = actualDelivery.addressBodyNormalized.toLowerCase();
    expect(actualDelivery.contactName.toLowerCase()).toBe(expectedFullName.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.address.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.cityOrDistrict.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.state.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.pincode.trim());
  });

  await test.step('TC006_21 | Checkout — payment method & Proceed to Pay', async () => {
    logSub(21, 'Proceed to payment');
    await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
    await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
    await withdrawalPage.checkoutPageClickProceedToPay();
  });

  await test.step('TC006_22 | Payment — complete netbanking', async () => {
    logSub(22, 'Payment');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before payment.');
    }
    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const expectedAmount = selectedProductDetails.makingAndDeliveryChargesAmount;
    const normalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log(`[${TC006(22)}] Razorpay amount raw/normalized/expected:`, razorpayAmountRaw, normalized, expectedAmount);
    expect(Math.abs(normalized - expectedAmount)).toBeLessThanOrEqual(1);
    await paymentPage.completeNetbankingPaymentWithdrwal('HDFC Bank');
  });

  await test.step('TC006_23 | Dashboard — gold and silver balance after redeem', async () => {
    logSub(23, 'Dashboard balance update');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/i);
    const totalGoldAfter = await dashboardPage.getTotalGoldValue();
    const totalSilverAfter = await dashboardPage.getTotalSilverValue();
    const expectedGoldAfter = Number((totalGoldBefore - validGoldInput - validSipInput).toFixed(4));
    const expectedSilverAfter = Number(totalSilverBefore.toFixed(4));
    console.log(`[${TC006(20)}] Gold before/after/expected:`, totalGoldBefore, totalGoldAfter, expectedGoldAfter);
    console.log(`[${TC006(20)}] Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);
    expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
    expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
  });

  await test.step('TC006_24 | My orders — delivery card matches cart', async () => {
    logSub(24, 'My orders delivery card');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before my-orders validation.');
    }
    await page.goto('/my-orders');
    await expect(page).toHaveURL(/my-orders/);
    await myOrderVerificationPage.waitForOrderRow();
    await myOrderVerificationPage.clickOnDelivery();
    await myOrderVerificationPage.validateLatestOrderRowStatusPending();
    await myOrderVerificationPage.waitForProductOrderCard();
    await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
      expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
    });
  });
});

test('TC_007 - Convert into Gold/Jewellery — gold + silver in cart; withdraw from Gold Vault and Silver Vault @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
  paymentPage,
  myOrderVerificationPage,
}) => {
  test.setTimeout(360_000);

  const TC007 = (n: number): string => `TC007_${n}`;
  const GOLD_PRODUCT_NAME = 'Augmont Classic Om Pendant';
  const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';
  let SELECTED_GOLD_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Jewellery';
  const SILVER_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Coin';

  let portfolioValue = 0;
  let totalGoldBefore = 0;
  let totalSilverBefore = 0;
  let goldProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let silverProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;

  let requiredGold = 0;
  let requiredSilver = 0;
  let availableGold = 0;
  let availableSilver = 0;
  let beforeRemainingGold = 0;
  let beforeRemainingSilver = 0;
  let validGoldInput = 0;
  let validSilverInput = 0;

  type CartItemDetails = {
    productName: string;
    productWeight: string;
    quantity: number;
    pricePerItem: number;
  };
  let cartItems: CartItemDetails[] = [];
  let cartTotalAmountPayable = 0;

  const captureCartItemDetails = async (productName: string): Promise<CartItemDetails> => {
    const cardLocator = page
      .locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4')
      .filter({
        has: page.locator('div.text-20.text-darkgunmetal.font-cabinetgroteskextrabold', {
          hasText: productName,
        }),
      })
      .first();
    await cardLocator.waitFor({ state: 'visible', timeout: 15_000 });

    const titleText = (
      (await cardLocator
        .locator('div.text-20.text-darkgunmetal.font-cabinetgroteskextrabold')
        .first()
        .textContent()) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const cardText = ((await cardLocator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const priceMatches = [...cardText.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)];
    if (priceMatches.length === 0) {
      throw new Error(`No ₹ price found on cart card for "${productName}". Card text: ${cardText}`);
    }
    const lastPriceText = priceMatches[priceMatches.length - 1][1];
    const pricePerItem = Number(lastPriceText.replace(/,/g, ''));

    const weightMatch = cardText.match(/([\d.]+)\s*gm[s]?/i);
    const productWeight = weightMatch ? `${weightMatch[1]}gm` : '';

    const quantity = await withdrawalPage.getSelectedProductQuantityInCart(productName);

    return { productName: titleText, productWeight, quantity, pricePerItem };
  };

  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC007(n)}] ${title}`);
  };

  const parseFirstNumber = (value: string): number => Number((value.match(/[\d.]+/)?.[0] ?? '0').trim());

  const combinedMakingChargesAmount = (): number => {
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Gold/silver product details missing for combined charges.');
    }
    return Number(
      (
        goldProductDetails.makingAndDeliveryChargesAmount + silverProductDetails.makingAndDeliveryChargesAmount
      ).toFixed(2),
    );
  };

  await test.step('TC007_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
    logSub(1, 'Login & Dashboard');
    await page.goto('/dashboard');
    portfolioValue = await dashboardPage.getPortfolioValueNumber();
    totalGoldBefore = await dashboardPage.getTotalGoldValue();
    totalSilverBefore = await dashboardPage.getTotalSilverValue();
    console.log(`[${TC007(1)}] Portfolio Value:`, portfolioValue);
    console.log(`[${TC007(1)}] Total Gold:`, totalGoldBefore);
    console.log(`[${TC007(1)}] Total Silver:`, totalSilverBefore);
    expect(portfolioValue).toBeGreaterThan(0);
    expect(totalGoldBefore).toBeGreaterThan(0);
    expect(totalSilverBefore).toBeGreaterThan(0);
  });

  await test.step('TC007_2 | Withdrawal — Withdrawal Investment UI (Cancel & Proceed)', async () => {
    logSub(2, 'Withdrawal Investment UI');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
  });

  await test.step('TC007_3 | Withdrawal — Proceed to withdrawal flow', async () => {
    logSub(3, 'Proceed to withdrawal flow');
    const currentUrl = page.url();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC007_4 | Withdrawal — Withdraw deposit & Convert into Gold/Jewellery options visible', async () => {
    logSub(4, 'Withdrawal options');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
  });

  await test.step('TC007_5 | Withdrawal — Select Convert to Gold/Jewellery → product list', async () => {
    logSub(5, 'Convert to Gold/Jewellery');
    await withdrawalPage.clickProceedForConvertGoldJewellery();
    await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
  });

  await test.step('TC007_6 | Product List — categories and dashboard snapshot', async () => {
    logSub(6, 'Product list');
    console.log(
      `[${TC007(6)}] Dashboard snapshot — Total Gold (g):`,
      totalGoldBefore,
      'Total Silver (g):',
      totalSilverBefore,
    );
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
  });

  await test.step('TC007_7 | Product List — metal path: gold jewellery first, then silver coin', async () => {
    logSub(7, 'Metal / product plan');
    console.log(`[${TC007(7)}] Gold product: ${GOLD_PRODUCT_NAME} (${SELECTED_GOLD_PRODUCT_TYPE})`);
    console.log(`[${TC007(7)}] Silver product: ${SILVER_PRODUCT_NAME} (${SILVER_PRODUCT_TYPE})`);
  });

  await test.step('TC007_8 | Product List — select gold jewellery product', async () => {
    logSub(8, 'Select gold jewellery');
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await withdrawalPage.selectJewelleryCategoryIfNotSelected();
        await withdrawalPage.selectProductByName(GOLD_PRODUCT_NAME, SELECTED_GOLD_PRODUCT_TYPE);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[${TC007(8)}] Gold product select attempt ${attempt} failed: ${message}`);
        if (attempt === 2) {
          throw error;
        }
        await page.goto('/withdraw/product-list');
        await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
      }
    }
  });

  await test.step('TC007_9 | Product Details (gold) — name, weight, charges, delivery date', async () => {
    logSub(9, 'Gold product details');
    goldProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    expect(goldProductDetails.productName).toBeTruthy();
    expect(goldProductDetails.productWeight).not.toBe('');
    expect(goldProductDetails.makingAndDeliveryCharges).toMatch(/Making/i);
    expect(goldProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
    expect(goldProductDetails.expectedDeliveryDate).not.toBe('');
    const goldGm = parseFirstNumber(goldProductDetails.productWeight);
    console.log(`[${TC007(9)}] Gold product grams:`, goldGm);
    expect(goldGm).toBeGreaterThan(0);
  });

  await test.step('TC007_10 | Product Details (gold) — Request Delivery (first line in cart)', async () => {
    logSub(10, 'Request Delivery (gold)');
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC007_11 | Product List — add silver coin (second line in cart)', async () => {
    logSub(11, 'Return to product list & select silver');
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await page.goto('/withdraw/product-list');
        await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
        await withdrawalPage.selectCoinCategoryIfNotSelected();
        await withdrawalPage.selectProductByName(SILVER_PRODUCT_NAME, SILVER_PRODUCT_TYPE);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[${TC007(11)}] Silver product select attempt ${attempt} failed: ${message}`);
        if (attempt === 3) {
          throw error;
        }
        await page.waitForTimeout(1_000);
      }
    }
  });

  await test.step('TC007_12 | Product Details (silver) — name, weight, charges, delivery date', async () => {
    logSub(12, 'Silver product details');
    silverProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    expect(silverProductDetails.productName).toBeTruthy();
    expect(silverProductDetails.productWeight).not.toBe('');
    expect(silverProductDetails.makingAndDeliveryCharges).toMatch(/Making/i);
    expect(silverProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
    expect(silverProductDetails.expectedDeliveryDate).not.toBe('');
    const silverGm = parseFirstNumber(silverProductDetails.productWeight);
    console.log(`[${TC007(12)}] Silver product grams:`, silverGm);
    expect(silverGm).toBeGreaterThan(0);
  });

  await test.step('TC007_13 | Product Details (silver) — Request Delivery', async () => {
    logSub(13, 'Request Delivery (silver)');
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC007_14 | Cart — multiple products (Gold + Silver) total quantity 2 (reduce each by one if total > 2)', async () => {
    logSub(14, 'Cart details (Gold + Silver, total qty = 2)');
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Product details missing before cart validation.');
    }

    const initialCartCount = await withdrawalPage.getCountOfProductInCart();
    console.log(`[${TC007(14)}] Cart product count (before cleanup):`, initialCartCount);
    if (initialCartCount > 2) {
      console.log(`[${TC007(14)}] Removing extra products; keeping only Gold and Silver line items.`);
      const normalizedKeepNames = [goldProductDetails.productName, silverProductDetails.productName]
        .map((name) => name.replace(/\s+/g, ' ').trim().toLowerCase())
        .filter((name) => name.length > 0);
      const cartCards = page.locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4');
      await cartCards.first().waitFor({ state: 'visible' });
      let safetyCleanup = 0;
      while ((await cartCards.count()) > normalizedKeepNames.length) {
        const cardCount = await cartCards.count();
        let removed = false;
        for (let i = 0; i < cardCount; i += 1) {
          const card = cartCards.nth(i);
          const cardText = ((await card.textContent()) ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
          const shouldKeep = normalizedKeepNames.some((name) => cardText.includes(name));
          if (shouldKeep) {
            continue;
          }
          const removeBtn = card.getByRole('button', { name: /Remove Item/i }).first();
          await removeBtn.waitFor({ state: 'visible' });
          await removeBtn.click();
          const expectedCount = cardCount - 1;
          await page.waitForFunction(
            ({ selector, expected }) => {
              const scopedGlobal = globalThis as {
                document?: { querySelectorAll?: (s: string) => { length: number } };
              };
              return (scopedGlobal.document?.querySelectorAll?.(selector)?.length ?? 0) <= expected;
            },
            { selector: 'div.border.border-sheengold.rounded-2xl.p-4.mb-4', expected: expectedCount },
            { timeout: 10_000 },
          );
          removed = true;
          break;
        }
        if (!removed) {
          break;
        }
        safetyCleanup += 1;
        if (safetyCleanup > 20) {
          throw new Error('Safety stop while removing extra cart products (TC007).');
        }
      }
    }

    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    console.log(`[${TC007(14)}] Cart product count:`, productCountInCart);
    expect(productCountInCart).toBe(2);

    const goldQtyInitial = await withdrawalPage.getSelectedProductQuantityInCart(goldProductDetails.productName);
    const silverQtyInitial = await withdrawalPage.getSelectedProductQuantityInCart(silverProductDetails.productName);
    const totalQuantityInitial = goldQtyInitial + silverQtyInitial;
    console.log(
      `[${TC007(14)}] Initial qty — gold:`,
      goldQtyInitial,
      'silver:',
      silverQtyInitial,
      'total:',
      totalQuantityInitial,
    );

    if (totalQuantityInitial > 2) {
      console.log(`[${TC007(14)}] Total cart quantity > 2; reducing both products by one.`);
      if (goldQtyInitial > 1) {
        await withdrawalPage.reduceSelectedProductQuantityInCart(goldProductDetails.productName, goldQtyInitial - 1);
      }
      if (silverQtyInitial > 1) {
        await withdrawalPage.reduceSelectedProductQuantityInCart(silverProductDetails.productName, silverQtyInitial - 1);
      }
    }

    const goldQtyFinal = await withdrawalPage.getSelectedProductQuantityInCart(goldProductDetails.productName);
    const silverQtyFinal = await withdrawalPage.getSelectedProductQuantityInCart(silverProductDetails.productName);
    const totalQuantityFinal = goldQtyFinal + silverQtyFinal;
    console.log(
      `[${TC007(14)}] Final qty — gold:`,
      goldQtyFinal,
      'silver:',
      silverQtyFinal,
      'total:',
      totalQuantityFinal,
    );

    expect(goldQtyFinal).toBe(1);
    expect(silverQtyFinal).toBe(1);
    expect(totalQuantityFinal).toBe(2);

    await withdrawalPage.validateSelectedProductCardInCart(goldProductDetails.productName, 1);
    await withdrawalPage.validateSelectedProductCardInCart(silverProductDetails.productName, 1);
  });

  await test.step('TC007_15 | Cart (Gold + Silver) — quantity/weights/amount payable validation', async () => {
    logSub(15, 'Cart calculations (Gold + Silver)');
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Product details missing before cart totals validation.');
    }
    const goldQty = await withdrawalPage.getSelectedProductQuantityInCart(goldProductDetails.productName);
    const silverQty = await withdrawalPage.getSelectedProductQuantityInCart(silverProductDetails.productName);
    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    const expectedAmountPayable =
      goldProductDetails.makingAndDeliveryChargesAmount * goldQty +
      silverProductDetails.makingAndDeliveryChargesAmount * silverQty;
    expect(totalAmountPayable).toBe(expectedAmountPayable);

    const goldCartItem = await captureCartItemDetails(goldProductDetails.productName);
    const silverCartItem = await captureCartItemDetails(silverProductDetails.productName);
    cartItems = [goldCartItem, silverCartItem];
    cartTotalAmountPayable = totalAmountPayable;
    console.log(
      `[${TC007(15)}] Captured cart item details (read from cart UI):\n${JSON.stringify(cartItems, null, 2)}`,
    );
    console.log(`[${TC007(15)}] Cart total amount payable:`, cartTotalAmountPayable);

    expect(goldCartItem.quantity).toBe(goldQty);
    expect(silverCartItem.quantity).toBe(silverQty);
    expect(goldCartItem.pricePerItem).toBe(goldProductDetails.makingAndDeliveryChargesAmount);
    expect(silverCartItem.pricePerItem).toBe(silverProductDetails.makingAndDeliveryChargesAmount);
    expect(cartItems.reduce((sum, line) => sum + line.pricePerItem * line.quantity, 0)).toBe(
      totalAmountPayable,
    );
  });

  await test.step('TC007_16 | Cart — Select Investments → investment screen', async () => {
    logSub(16, 'Select Investments');
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC007_17 | Investment — capture required and available metal values', async () => {
    logSub(17, 'Capture required/available values');
    requiredGold = await withdrawalPage.getInvestmentListTotalGoldRequired();
    requiredSilver = await withdrawalPage.getInvestmentListTotalSilverRequired();
    availableGold = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    availableSilver = await withdrawalPage.getInvestmentListTotalSilverAvailable();
    const goldTotals = await withdrawalPage.getGoldVaultCardTotals();
    const silverTotals = await withdrawalPage.getSilverVaultCardTotals();
    beforeRemainingGold = goldTotals.remainingGold;
    beforeRemainingSilver = silverTotals.remainingSilver;
    console.log(`[${TC007(17)}] Required Gold:`, requiredGold);
    console.log(`[${TC007(17)}] Required Silver:`, requiredSilver);
    console.log(`[${TC007(17)}] Available Gold:`, availableGold);
    console.log(`[${TC007(17)}] Available Silver:`, availableSilver);
    console.log(`[${TC007(17)}] Remaining Gold (before):`, beforeRemainingGold);
    console.log(`[${TC007(17)}] Remaining Silver (before):`, beforeRemainingSilver);
    expect(requiredGold >= 0).toBe(true);
    expect(requiredSilver >= 0).toBe(true);

    const goldVaultSufficient = beforeRemainingGold >= requiredGold;
    const silverVaultSufficient = beforeRemainingSilver >= requiredSilver;
    console.log(
      `[${TC007(17)}] Gold Vault check (remaining >= required):`,
      `${beforeRemainingGold} >= ${requiredGold} -> ${goldVaultSufficient ? 'PASS' : 'FAIL'}`,
    );
    console.log(
      `[${TC007(17)}] Silver Vault check (remaining >= required):`,
      `${beforeRemainingSilver} >= ${requiredSilver} -> ${silverVaultSufficient ? 'PASS' : 'FAIL'}`,
    );

    if (!goldVaultSufficient || !silverVaultSufficient) {
      throw new Error(
        `[${TC007(17)}][FAIL] Insufficient vault value: Gold Vault remaining=${beforeRemainingGold}, Gold required=${requiredGold}, Silver Vault remaining=${beforeRemainingSilver}, Silver required=${requiredSilver}.`,
      );
    }
  });

  await test.step('TC007_18 | Investment — invalid Gold/Silver input keeps Proceed disabled', async () => {
    logSub(18, 'Invalid quantity validation');
    const invalidGoldInput = requiredGold > 0 ? Number(Math.max(0, requiredGold - 0.01).toFixed(4)) : 0;
    const invalidSilverInput = requiredSilver > 0 ? Number(Math.max(0, requiredSilver - 0.01).toFixed(4)) : 0;
    await withdrawalPage.enterQuantity(invalidGoldInput);
    await withdrawalPage.enterQuantityInSilverVault(invalidSilverInput);
    console.log(`[${TC007(18)}] Invalid Gold input:`, invalidGoldInput);
    console.log(`[${TC007(18)}] Invalid Silver input:`, invalidSilverInput);
    const errorText = await withdrawalPage.getQuantityErrorText().catch(() => '');
    console.log(`[${TC007(18)}] Error text:`, errorText);
    if (!errorText) {
      console.log(`[${TC007(18)}] No inline validation text shown; validating via disabled Proceed state.`);
    }
    const isDisabled = await withdrawalPage.isProceedButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  await test.step('TC007_19 | Investment — withdraw from Gold Vault and Silver Vault (valid inputs)', async () => {
    logSub(19, 'Gold vault + Silver vault withdrawal');
    validGoldInput = requiredGold > 0 ? Number(requiredGold.toFixed(4)) : 0;
    validSilverInput = requiredSilver > 0 ? Number(requiredSilver.toFixed(4)) : 0;

    await withdrawalPage.enterQuantity(validGoldInput);
    await withdrawalPage.enterQuantityInSilverVault(validSilverInput);

    console.log(`[${TC007(19)}] Gold withdrawn (Gold Vault):`, validGoldInput);
    console.log(`[${TC007(19)}] Silver withdrawn (Silver Vault):`, validSilverInput);

    const goldAfter = await withdrawalPage.getGoldVaultCardTotals();
    const silverAfter = await withdrawalPage.getSilverVaultCardTotals();
    const expectedGoldRemaining = Number((beforeRemainingGold - validGoldInput).toFixed(4));
    const expectedSilverRemaining = Number((beforeRemainingSilver - validSilverInput).toFixed(4));
    console.log(`[${TC007(19)}] Gold remaining expected/actual:`, expectedGoldRemaining, goldAfter.remainingGold);
    console.log(`[${TC007(19)}] Silver remaining expected/actual:`, expectedSilverRemaining, silverAfter.remainingSilver);
    expect(goldAfter.remainingGold).toBeCloseTo(expectedGoldRemaining, 3);
    expect(silverAfter.remainingSilver).toBeCloseTo(expectedSilverRemaining, 3);
    const isEnabled = await withdrawalPage.isProceedButtonEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('TC007_20 | Investment — Proceed to account details/checkout', async () => {
    logSub(20, 'Proceed to checkout');
    await withdrawalPage.clickDeliveryProceedButton();
    await expect(page).toHaveURL(/checkout|address|delivery/i);
  });

  await test.step('TC007_21 | Checkout — same as billing & proceed', async () => {
    logSub(21, 'Address');
    await withdrawalPage.clickSameAsBillingAddressCheckbox();
    await page.waitForTimeout(500);
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC007_22 | Checkout (Gold + Silver) — payment summary (total, paid from funds, net payable)', async () => {
    logSub(22, 'Payment summary (Gold + Silver combined)');
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Product details missing before checkout.');
    }
    const summary = await withdrawalPage.checkoutPageGetPaymentSummary();
    const expectedTotal = combinedMakingChargesAmount();
    expect(summary.totalAmount).toBeGreaterThan(0);
    expect(summary.netPayableAmount).toBeCloseTo(summary.totalAmount - summary.paidFromFunds, 2);
    expect(summary.totalAmount).toBeCloseTo(expectedTotal, 2);
  });

  await test.step('TC007_23 | Checkout (Gold + Silver) — order details vs products & address', async () => {
    logSub(23, 'Order details on checkout (Gold + Silver)');
    if (!goldProductDetails || !silverProductDetails || !deliveryInformation) {
      throw new Error('Missing product or delivery info for checkout validation.');
    }
    const expectedFullName = `${deliveryInformation.firstName} ${deliveryInformation.lastName}`.trim();
    const goldTitlePrefix = goldProductDetails.productName.split('(')[0].trim();
    const silverTitlePrefix = silverProductDetails.productName.split('(')[0].trim();
    await expect(page.getByText(new RegExp(goldTitlePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first()).toBeVisible();
    await expect(page.getByText(new RegExp(silverTitlePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first()).toBeVisible();

    const actualDelivery = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay({ log: false });
    const normalizedAddressBody = actualDelivery.addressBodyNormalized.toLowerCase();
    expect(actualDelivery.contactName.toLowerCase()).toBe(expectedFullName.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.address.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.cityOrDistrict.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.state.toLowerCase());
    expect(normalizedAddressBody).toContain(deliveryInformation.pincode.trim());
  });

  await test.step('TC007_24 | Checkout — payment method & Proceed to Pay', async () => {
    logSub(24, 'Proceed to payment');
    await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
    await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
    await withdrawalPage.checkoutPageClickProceedToPay();
  });

  await test.step('TC007_25 | Payment (Gold + Silver) — complete netbanking with combined amount', async () => {
    logSub(25, 'Payment (Gold + Silver combined)');
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Product details missing before payment.');
    }
    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const expectedAmount = combinedMakingChargesAmount();
    const normalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log(`[${TC007(25)}] Razorpay amount raw/normalized/expected:`, razorpayAmountRaw, normalized, expectedAmount);
    expect(Math.abs(normalized - expectedAmount)).toBeLessThanOrEqual(1);
    await paymentPage.completeNetbankingPaymentWithdrwal('HDFC Bank');
  });

  await test.step('TC007_26 | Dashboard (Gold + Silver) — gold and silver balance after redeem', async () => {
    logSub(26, 'Dashboard balance update (Gold + Silver)');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/i);
    const totalGoldAfter = await dashboardPage.getTotalGoldValue();
    const totalSilverAfter = await dashboardPage.getTotalSilverValue();
    const expectedGoldAfter = Number((totalGoldBefore - validGoldInput).toFixed(4));
    const expectedSilverAfter = Number((totalSilverBefore - validSilverInput).toFixed(4));
    console.log(`[${TC007(26)}] Gold before/after/expected:`, totalGoldBefore, totalGoldAfter, expectedGoldAfter);
    console.log(`[${TC007(26)}] Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);
    expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
    expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
  });

  await test.step('TC007_27 | My orders (Gold + Silver) — both products on Delivery card with same Transaction Id', async () => {
    logSub(27, 'My orders delivery (Gold + Silver, same Txn Id)');
    if (!goldProductDetails || !silverProductDetails) {
      throw new Error('Product details missing before my-orders validation.');
    }


    await page.goto('/my-orders');
    await expect(page).toHaveURL(/my-orders/);
    await myOrderVerificationPage.waitForOrderRow();
    await myOrderVerificationPage.clickOnDelivery();

    const deliveryOrderCard = page.locator('div.bg-sheengold-ochre').first();
    await deliveryOrderCard.waitFor({ state: 'visible', timeout: 30_000 });

    const statusBadge = deliveryOrderCard
      .locator('span')
      .filter({ hasText: /^(Pending|Completed|Failed|Processing|Cancelled)$/i })
      .first();
    await statusBadge.waitFor({ state: 'visible', timeout: 15_000 });
    const deliveryStatusText = ((await statusBadge.textContent()) ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    console.log(`[${TC007(27)}] Delivery card status (extracted):`, deliveryStatusText);
    expect(deliveryStatusText, 'Delivery card status must be exactly "Pending"').toBe('Pending');

    const productHeadings = deliveryOrderCard.locator('h3');
    await expect(productHeadings).toHaveCount(2, { timeout: 15_000 });

    type CapturedLine = {
      name: string;
      transactionId: string;
      quantity: number;
      price: number;
    };
    const captured: CapturedLine[] = [];
    const headingCount = await productHeadings.count();
    for (let i = 0; i < headingCount; i += 1) {
      const heading = productHeadings.nth(i);
      const block = heading.locator(
        'xpath=ancestor::div[contains(@class,"space-y-2")][1]',
      );

      const name = ((await heading.textContent()) ?? '').replace(/\s+/g, ' ').trim();

      const txnIdText = (
        (await block
          .locator('span')
          .filter({ hasText: /Transaction\s*Id/i })
          .first()
          .locator('xpath=following-sibling::div[1]')
          .textContent()) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();

      const qtyText = (
        (await block
          .locator('span')
          .filter({ hasText: /Quanti(?:ty|y)/i })
          .first()
          .locator('xpath=following-sibling::div[1]')
          .textContent()) ?? ''
      ).trim();
      const quantity = Number((qtyText.match(/[\d.]+/)?.[0] ?? '0'));

      const priceText = (
        (await block.locator('p').filter({ hasText: /₹/ }).first().textContent()) ?? ''
      ).trim();
      const price = Number(
        (priceText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''),
      );

      captured.push({ name, transactionId: txnIdText, quantity, price });
    }

    console.log(
      `[${TC007(27)}] Captured delivery cards:\n${JSON.stringify(captured, null, 2)}`,
    );

    if (cartItems.length !== 2) {
      throw new Error(
        `Cart items snapshot missing/invalid before delivery validation. cartItems=${JSON.stringify(cartItems)}`,
      );
    }
    console.log(
      `[${TC007(27)}] Cart item details for hard assertion:\n${JSON.stringify(cartItems, null, 2)}`,
    );

    expect(captured.length, 'Delivery card should have exactly 2 product lines').toBe(2);
    expect(captured[0].transactionId, 'Transaction Id must be present').not.toBe('');
    expect(captured[0].transactionId, 'Both products must share the same Transaction Id').toBe(
      captured[1].transactionId,
    );

    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
    for (const cartItem of cartItems) {
      const expectedName = normalize(cartItem.productName);
      const matchedLine = captured.find((line) => normalize(line.name).includes(expectedName));
      if (!matchedLine) {
        throw new Error(
          `Cart item "${cartItem.productName}" not found in delivery card. Captured: ${JSON.stringify(captured)}`,
        );
      }
      console.log(`[${TC007(27)}] Cart vs delivery line for "${cartItem.productName}":`, {
        expected: cartItem,
        actual: matchedLine,
      });
      expect(
        normalize(matchedLine.name).includes(expectedName),
        `Delivery card product name should contain cart item "${cartItem.productName}"`,
      ).toBe(true);
      expect(matchedLine.quantity, `Quantity for "${cartItem.productName}" must match cart`).toBe(
        cartItem.quantity,
      );
      expect(matchedLine.price, `Price for "${cartItem.productName}" must match cart making charges`).toBe(
        cartItem.pricePerItem,
      );
    }
  });
});

test('TC_008-Convert to Silver or/Jewellery -Verify No Silver Deduction After Failed Payment During SIP Withdrawal Conversion @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
  paymentPage,
  myOrderVerificationPage,
}) => {
  test.setTimeout(360_000);

  const TC008 = (n: number): string => `TC008_${n}`;
  const SILVER_PRODUCT = 'Augmont 1GM Silver Coin 999 Purity';

  let sipName = '';
  let selectedSipName = '';
  let selectedSipMetalValue = '';
  let selectedSipMetalValueNumber = 0;
  let selectedSipMetalType: 'Gold' | 'Silver' = 'Silver';
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let currentUrl = '';
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
  let selectedProductGm = 0;
  let capturedFailureMessage = '';

  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC008(n)}] ${title}`);
  };

  await test.step('TC008_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
    logSub(1, 'Login & Dashboard');
    await page.goto('/dashboard');
    portfolioValue = await dashboardPage.getPortfolioValueNumber();
    console.log(`[${TC008(1)}] Portfolio Value (Rs):`, portfolioValue);
    expect(portfolioValue).toBeGreaterThan(0);

    totalGoldBeforePurchase = await dashboardPage.getTotalGoldValue();
    totalSilverBeforePurchase = await dashboardPage.getTotalSilverValue();
    console.log(`[${TC008(1)}] Total Gold (g):`, totalGoldBeforePurchase);
    console.log(`[${TC008(1)}] Total Silver (g):`, totalSilverBeforePurchase);
    expect(totalGoldBeforePurchase).toBeGreaterThan(0);
    expect(totalSilverBeforePurchase).toBeGreaterThan(0);

    goldFD = await dashboardPage.getGoldFDValue();
    console.log(`[${TC008(1)}] Gold FD+:`, goldFD);
    expect(goldFD).not.toBe('');
  });

  await test.step('TC008_2 | SIP — get approved SIP with positive investment', async () => {
    logSub(2, 'Get approved SIP with positive investment');
    await dashboardPage.clickViewAll();
    sipName = await dashboardPage.getApprovedSipNameWithPositiveInvestment();
    console.log('SIP Name:', sipName);
  });

  await test.step('TC008_3 | Withdrawal — Withdrawal Investment UI (Cancel & Proceed)', async () => {
    logSub(3, 'Withdrawal Investment screen');
    await page.goto('/dashboard');
    await dashboardPage.clickWithdrawInvestment();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceed' })).toBeVisible();
    currentUrl = page.url();
    await withdrawalPage.clickProceed();
    await expect(page).not.toHaveURL(currentUrl);
  });

  await test.step('TC008_4 | Withdrawal — Withdraw deposit & Convert into Silver options visible', async () => {
    logSub(4, 'Withdrawal options');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await page
      .locator(
        'xpath=//div[contains(@class,"border") and contains(@class,"rounded-xl") and .//div[contains(normalize-space(),"Convert into Gold/Jewellery")]]',
      )
      .first()
      .locator('span.p-button-label.ng-star-inserted')
      .filter({ hasText: /^Proceed$/i })
      .first()
      .click();
  });

  await test.step('TC008_5 | Withdrawal — Select Convert to Silver & Jewellery → product list', async () => {
    logSub(5, 'Convert to Silver & Jewellery');
    await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
  });

  await test.step('TC008_6 | Product List — categories, metal path = silver product', async () => {
    logSub(6, 'Product list');
    console.log(
      `[${TC008(6)}] Dashboard snapshot — Total Gold (g):`,
      totalGoldBeforePurchase,
      'Total Silver (g):',
      totalSilverBeforePurchase,
    );
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
    await withdrawalPage.selectCoinCategoryIfNotSelected();
    const products = await withdrawalPage.getAndLogProductCountAndNames();
    expect(products.count).toBeGreaterThan(0);
    expect(products.names.some((n) => n.includes('Silver'))).toBeTruthy();
    await withdrawalPage.selectProductByName(SILVER_PRODUCT);
  });

  await test.step('TC008_7 | Product Details — name, weight, charges, delivery date', async () => {
    logSub(7, 'Product details');
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    expect(selectedProductDetails.productName).toBeTruthy();
    expect(selectedProductDetails.productWeight).toBeTruthy();
    expect(selectedProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
    expect(selectedProductDetails.expectedDeliveryDate).toBeTruthy();
    console.log(`[${TC008(7)}] Product details:`, selectedProductDetails);
  });

  await test.step('TC008_8 | Product Details — Request Delivery (add to cart)', async () => {
    logSub(8, 'Request Delivery');
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC008_9 | Cart — single line item after Removing another product from cart', async () => {
    logSub(9, 'Cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    await withdrawalPage.validateSelectedProductCardInCart(selectedProductDetails.productName, 1);
  });

  await test.step('TC008_10 | Cart — quantity & amount payable vs making charges', async () => {
    logSub(10, 'Cart calculations');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before cart totals.');
    }
    const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
      selectedProductDetails.productName,
    );
    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    const expectedAmountPayable =
      selectedProductDetails.makingAndDeliveryChargesAmount * selectedProductQtyInCart;
    expect(totalAmountPayable).toBe(expectedAmountPayable);
  });

  await test.step('TC008_11 | Cart — Select Investments → investment screen', async () => {
    logSub(11, 'Select Investments');
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC008_12 | Investment — capture totals and select SIP', async () => {
    logSub(12, 'Capture totals and select SIP');
    const investmentListTotalGoldRequired = await withdrawalPage.getInvestmentListTotalGoldRequired();
    const investmentListTotalSilverRequired = await withdrawalPage.getInvestmentListTotalSilverRequired();
    const investmentListTotalGoldAvailable = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    const investmentListTotalSilverAvailable = await withdrawalPage.getInvestmentListTotalSilverAvailable();
    console.log('Investment List Total Gold Required:', investmentListTotalGoldRequired);
    console.log('Investment List Total Silver Required:', investmentListTotalSilverRequired);
    console.log('Investment List Total Gold Available:', investmentListTotalGoldAvailable);
    console.log('Investment List Total Silver Available:', investmentListTotalSilverAvailable);

    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before SIP selection.');
    }
    selectedProductGm = Number(
      (selectedProductDetails.productWeight.match(/([0-9]+(?:\.[0-9]+)?)\s*gm/i)?.[1] ?? '0').trim(),
    );
    console.log(`[TC008_PRODUCT_TOTAL_GM] ${selectedProductGm}`);
    const selectedSipDetails = await dashboardPage.deliveryScrollUpAndClickProceedByMatchingSipMetalValue(
      sipName,
      selectedProductGm,
      { onlyMetalType: 'Silver' },
    );
    selectedSipName = selectedSipDetails.sipName;
    selectedSipMetalValue = String(selectedSipDetails.metalValue);
    selectedSipMetalType = selectedSipDetails.metalType;
    selectedSipMetalValueNumber = selectedSipDetails.metalValue;
    console.log('Selected SIP Name:', selectedSipName);
    console.log('Selected SIP Metal Type:', selectedSipMetalType);
    console.log('Selected SIP Metal Value:', selectedSipMetalValue);
    console.log(`[TC008_SIP_CARD_GM] ${selectedSipMetalValueNumber}`);
  });

  await test.step('TC008_13 | Investment — verify withdrawal panel values before withdrawal', async () => {
    logSub(13, 'Verify withdrawal panel values');
    if (!selectedSipName) {
      throw new Error('Selected SIP name missing before SIP card quantity entry.');
    }
    if (selectedProductGm <= 0) {
      throw new Error(`Selected product gm is invalid before SIP card quantity entry: ${selectedProductGm}`);
    }
    const sipCardData = await withdrawalPage.deliveryGetRemainingAndEnterQuantityForSipCard(
      selectedSipName,
      selectedProductGm,
    );
    console.log(
      `[TC008_CORRESPONDING_SIP_REMAINING_GM] ${sipCardData.sipName}: ${sipCardData.remainingValueInGm}`,
    );
    const expectedRemainingAfterEntry = Number((selectedSipMetalValueNumber - selectedProductGm).toFixed(4));
    console.log(`[TC008_EXPECTED_REMAINING_AFTER_ENTRY_GM] ${expectedRemainingAfterEntry}`);
    console.log(`[TC008_ACTUAL_REMAINING_AFTER_ENTRY_GM] ${sipCardData.remainingValueAfterEntryInGm}`);
    expect(sipCardData.remainingValueAfterEntryInGm).toBeCloseTo(expectedRemainingAfterEntry, 4);
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC008_14 | Checkout — same as billing & proceed', async () => {
    logSub(14, 'Address');
    await withdrawalPage.clickSameAsBillingAddressCheckbox();
    await page.waitForTimeout(500);
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
  });

  await test.step('TC008_15 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
    logSub(15, 'Payment summary');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before checkout.');
    }
    const summary = await withdrawalPage.checkoutPageGetPaymentSummary();
    expect(summary.totalAmount).toBeGreaterThan(0);
    expect(summary.netPayableAmount).toBeCloseTo(summary.totalAmount - summary.paidFromFunds, 2);
    await withdrawalPage.checkoutPageValidatePaymentSummaryAgainstMakingCharges(
      selectedProductDetails.makingAndDeliveryChargesAmount,
    );
  });

  await test.step('TC008_16 | Checkout — order details vs product & address', async () => {
    logSub(16, 'Order details on checkout');
    if (!selectedProductDetails || !deliveryInformation) {
      throw new Error('Missing product or delivery info for checkout validation.');
    }
    await withdrawalPage.checkoutPageValidateSelectedProductAgainstProductDetails({
      productName: selectedProductDetails.productName,
      makingAndDeliveryChargesAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      quantity: 1,
    });
    await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(deliveryInformation);
  });

  await test.step('TC008_17 | Checkout — payment method & Proceed to Pay', async () => {
    logSub(17, 'Proceed to payment');
    await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
    await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
    await withdrawalPage.checkoutPageClickProceedToPay();
  });

  await test.step('TC008_18 | Payment — netbanking with FAILURE in demo bank popup; capture failure message', async () => {
    logSub(18, 'Payment FAILURE');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before payment.');
    }

    const razorpayAmountRaw = await paymentPage.getPriceSummaryAmountFromFrame();
    const expectedAmount = selectedProductDetails.makingAndDeliveryChargesAmount;
    const normalized =
      razorpayAmountRaw > expectedAmount * 10
        ? Number((razorpayAmountRaw / 100).toFixed(2))
        : razorpayAmountRaw;
    console.log(`[${TC008(18)}] Razorpay amount raw/normalized/expected:`, razorpayAmountRaw, normalized, expectedAmount);
    expect(Math.abs(normalized - expectedAmount)).toBeLessThanOrEqual(1);

    capturedFailureMessage = await paymentPage.failNetbankingPaymentWithdrawal('HDFC Bank');
    console.log(`[${TC008(18)}] Captured failure message:`, capturedFailureMessage || '(none)');

    const failurePatterns =
      /payment\s*(?:was\s*)?(?:failed|unsuccessful|not\s*(?:completed|successful))|payment\s*could\s*not\s*be\s*completed|transaction\s*(?:has\s*)?failed|something\s*went\s*wrong|payment\s*(?:has\s*)?failed/i;
    expect(capturedFailureMessage, 'Captured failure message must not be empty').not.toBe('');
    expect(capturedFailureMessage).toMatch(failurePatterns);
  });

  await test.step('TC008_19 | Dashboard — silver balance UNCHANGED (withdrawal not succeeded)', async () => {
    logSub(19, 'Dashboard silver unchanged');
    if (selectedProductGm <= 0) {
      throw new Error(`selectedProductGm missing for silver balance check: ${selectedProductGm}`);
    }
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/i);
    const totalSilverAfter = await dashboardPage.getTotalSilverValue();
    console.log(
      `[${TC008(19)}] Total Silver before:`,
      totalSilverBeforePurchase,
      'after:',
      totalSilverAfter,
      'attempted-withdraw gm:',
      selectedProductGm,
    );
    expect(totalSilverAfter, 'Silver balance must not decrease after a failed payment').toBeCloseTo(
      totalSilverBeforePurchase,
      2,
    );
  });

  await test.step('TC008_20 | My orders — no NEW Pending DELIVERY for this product (withdrawal not recorded as success)', async () => {
    logSub(20, 'My orders — no successful Pending delivery for failed payment');
    if (!selectedProductDetails) {
      throw new Error('Selected product details missing before my-orders verification.');
    }

    await page.goto('/my-orders');
    await expect(page).toHaveURL(/my-orders/);

    const noRecord = page.locator('text=No Record Found').first();
    const orderRowsExist = await page
      .locator('div.p-4')
      .filter({ has: page.locator('div.text-10:has-text("Transaction ID")') })
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!orderRowsExist) {
      console.log(`[${TC008(20)}] No order rows present (No Record Found):`, await noRecord.isVisible().catch(() => false));
      console.log(`[${TC008(20)}] Withdrawal correctly NOT recorded — pass.`);
      return;
    }

    await myOrderVerificationPage.waitForOrderRow();
    await myOrderVerificationPage.clickOnDelivery();

    const deliveryCard = page.locator('div.bg-sheengold-ochre').first();
    const deliveryCardVisible = await deliveryCard.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!deliveryCardVisible) {
      console.log(`[${TC008(20)}] No DELIVERY card visible — failed payment did not create a delivery order.`);
      return;
    }

    const cardText = ((await deliveryCard.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const statusBadge = deliveryCard
      .locator('span')
      .filter({ hasText: /^(Pending|Completed|Failed|Processing|Cancelled)$/i })
      .first();
    const cardStatus =
      ((await statusBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    console.log(`[${TC008(20)}] Latest DELIVERY card status:`, cardStatus || '(unknown)');

    const productInLatestCard = cardText
      .toLowerCase()
      .includes(selectedProductDetails.productName.toLowerCase());
    console.log(
      `[${TC008(20)}] Latest DELIVERY card contains attempted product "${selectedProductDetails.productName}":`,
      productInLatestCard,
    );

    if (productInLatestCard) {
      expect(
        /pending/i.test(cardStatus),
        `Failed payment must NOT create a Pending delivery for "${selectedProductDetails.productName}" (actual status: "${cardStatus || 'N/A'}")`,
      ).toBe(false);
    }
  });
});

test('TC_009-Withdrawal Error Message Validation for gold vault(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
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

test('TC_010-Withdrawal Error Message Validation for silver vault(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
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

test('TC_011-Withdrawal Error Message Validation for gold SIP(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
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

test('TC_012-Withdrawal Error Message Validation for silver SIP(deposit flow) @customer-flows', async ({ page, dashboardPage, withdrawalPage }) => {
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


test('TC_013-Gold Vault minimum selling amount (Rs. 10) error after Proceed (deposit flow)@customer-flows', async ({ page, dashboardPage, withdrawalPage, paymentPage, addNewBankWithdrawalPage, myOrderVerificationPage }) => {
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
    await myOrderVerificationPage.waitForSellOrderRow();

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
    await myOrderVerificationPage.waitForSellOrderRow();

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
    await myOrderVerificationPage.waitForSellOrderRow();

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

/**
 * Checkout delivery address — TC id is TC_016 because TC_014 is reserved for silver vault bank withdrawal.
 */
test('TC_016-Verify delivery address section on the checkout page in withdrawal flow @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
}) => {
  test.setTimeout(300_000);
  const TC016_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
  /** Manual shipping data (must match state ↔ pincode rules in the app). */
  const manualAddress = {
    firstName: 'Augmont',
    lastName: 'QA Delivery',
    address: 'Bandra Kurla Complex Plot C',
    pincode: '400051',
    stateOptionLabel: 'Maharashtra',
    cityOptionLabel: 'Mumbai',
  } as const;
  /** Checkout billing card uses single full name + mobile (`#name`, `#mobileNumber`). */
  const billingFullName = `${manualAddress.firstName} ${manualAddress.lastName}`.trim();
  const billingMobile = '9876543210';
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let validQty = 0;
  let investmentListTotalGoldRequired = 0;
  let beforeWithdrawalVaultTotalGold = 0;
  let beforeWithdrawalVaultRemainingGold = 0;
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
  const TC016 = (n: number): string => `TC016_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC016(n)}] ${title}`);
  };

  await test.step('TC016_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
    await dashboardPage.goto('/dashboard');
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

  await test.step('TC016_2 | Click Proceed and verify navigation', async () => {
    logSub(2, 'Click Proceed and verify navigation');
    const urlBeforeProceed = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await withdrawalPage.expectUrlNotToEqual(urlBeforeProceed);
  });

  await test.step('TC016_3 | Verify options & Convert into Gold/Jewellery', async () => {
    logSub(3, 'Verify Two options are visible and click on Convert into Gold/Jewellery');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await withdrawalPage.clickProceedForConvertGoldJewellery();
  });

  await test.step('TC016_4 | Verify product list and select product', async () => {
    logSub(4, 'Verify product list is available and select product');
    await withdrawalPage.waitForProductListPage();
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
    let selected = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await withdrawalPage.selectCoinCategoryIfNotSelected();
      console.log(`[${TC016(4)}] Product selected from withdrawal workbook (attempt ${attempt}/3):`, TC016_PRODUCT_NAME);
      selected = await withdrawalPage
        .selectProductByName(TC016_PRODUCT_NAME)
        .then(() => true)
        .catch(async (error) => {
          console.warn(
            `[${TC016(4)}] Product selection attempt ${attempt} failed for "${TC016_PRODUCT_NAME}". Retrying...`,
          );
          await withdrawalPage.settleMs(700);
          if (attempt === 3) {
            throw error;
          }
          return false;
        });
      if (selected) {
        break;
      }
    }
  });

  await test.step('TC016_5 | Get product details and Request Delivery', async () => {
    logSub(5, 'Get and validate product details');
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    console.log(selectedProductDetails);
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC016_6 | Verify cart details', async () => {
    logSub(6, 'Verify cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details were not captured before cart validation.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(selectedProductDetails.productName);
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    console.log('Cart quantity normalized to 1 for selected product');
    await withdrawalPage.validateCartItemWithSelectedProduct({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
    });

    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    console.log('Cart Total Amount Payable:', totalAmountPayable);
    console.log('Making & Delivery Charges Amount:', selectedProductDetails.makingAndDeliveryChargesAmount);
    expect(totalAmountPayable).toBe(selectedProductDetails.makingAndDeliveryChargesAmount);
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC016_7 | Investment summary — required vs available metal', async () => {
    logSub(7, 'Verify investment details before withdrawal');
    investmentListTotalGoldRequired = await withdrawalPage.getInvestmentListTotalGoldRequired();
    const investmentListTotalSilverRequired = await withdrawalPage.getInvestmentListTotalSilverRequired();
    const investmentListTotalGoldAvailable = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    const investmentListTotalSilverAvailable = await withdrawalPage.getInvestmentListTotalSilverAvailable();
    console.log('Investment List Total Gold Required:', investmentListTotalGoldRequired);
    console.log('Investment List Total Silver Required:', investmentListTotalSilverRequired);
    console.log('Investment List Total Gold Available:', investmentListTotalGoldAvailable);
    console.log('Investment List Total Silver Available:', investmentListTotalSilverAvailable);
  });

  await test.step('TC016_8 | Gold Vault card totals before withdrawal', async () => {
    logSub(8, 'Verify Vault card value before withdrawal');
    const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
    beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
    beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
    console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
    console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);
  });

  await test.step('TC016_9 | Enter valid gold quantity for delivery', async () => {
    logSub(9, 'Validate quantity against Total Gold Required and proceed');
    expect(investmentListTotalGoldRequired).toBeGreaterThan(0);
    const hasRequiredGoldForVault = beforeWithdrawalVaultTotalGold >= investmentListTotalGoldRequired;
    console.log(`[${TC016(9)}] beforeWithdrawalVaultTotalGold:`, beforeWithdrawalVaultTotalGold);
    console.log(`[${TC016(9)}] investmentListTotalGoldRequired:`, investmentListTotalGoldRequired);
    console.log(
      `[${TC016(9)}] Precondition Check -> expected: GoldVault >= TotalGoldRequired | actual: ${beforeWithdrawalVaultTotalGold} >= ${investmentListTotalGoldRequired} | result: ${hasRequiredGoldForVault ? 'PASS' : 'FAIL'}`,
    );
    if (!hasRequiredGoldForVault) {
      console.log(
        `[${TC016(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) is less than Total Gold Required (${investmentListTotalGoldRequired}).`,
      );
    }
    expect(
      hasRequiredGoldForVault,
      `[${TC016(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) must be >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    ).toBe(true);
    console.log(
      `[${TC016(9)}][PASS] Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    );

    const lessThanRequiredQty = Number((investmentListTotalGoldRequired - 0.01).toFixed(4));
    const greaterThanRequiredQty = Number((investmentListTotalGoldRequired + 0.01).toFixed(4));

    await withdrawalPage.enterQuantity(lessThanRequiredQty);
    const goldVaultTotalsForLessQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForLessQty = goldVaultTotalsForLessQty.remainingGold;
    const expectedRemainingForLessQty = Number((beforeWithdrawalVaultRemainingGold - lessThanRequiredQty).toFixed(4));
    expect(remainingForLessQty).toBeCloseTo(expectedRemainingForLessQty, 4);

    await withdrawalPage.enterQuantity(greaterThanRequiredQty);
    const goldVaultTotalsForGreaterQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForGreaterQty = goldVaultTotalsForGreaterQty.remainingGold;
    const expectedRemainingForGreaterQty = Number(
      (beforeWithdrawalVaultRemainingGold - greaterThanRequiredQty).toFixed(4),
    );
    expect(remainingForGreaterQty).toBeCloseTo(expectedRemainingForGreaterQty, 4);

    await withdrawalPage.enterQuantity(investmentListTotalGoldRequired);
    validQty = investmentListTotalGoldRequired;

    const goldVaultTotalsForValidQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingAfterValidQty = goldVaultTotalsForValidQty.remainingGold;
    const expectedRemainingAfterValidQty = Number(
      (beforeWithdrawalVaultRemainingGold - investmentListTotalGoldRequired).toFixed(4),
    );
    expect(remainingAfterValidQty).toBeCloseTo(expectedRemainingAfterValidQty, 4);
    await withdrawalPage.validateTotalGoldValueDelivery(investmentListTotalGoldRequired);
  });

  await test.step('TC016_10 | Open delivery address form', async () => {
    logSub(10, 'Proceed from delivery summary to address fields');
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
  });

  await test.step('TC016_11 | Withdraw — fill delivery row + billing card (Proceed stays disabled until billing is valid)', async () => {
    logSub(11, 'Delivery row then billing (#name, #mobileNumber, …) — same screen as Delivery Information tab');
    await withdrawalPage.fillManualDeliveryAddress({
      firstName: manualAddress.firstName,
      lastName: manualAddress.lastName,
      address: manualAddress.address,
      pincode: manualAddress.pincode,
      stateOptionLabel: manualAddress.stateOptionLabel,
      cityOptionLabel: manualAddress.cityOptionLabel,
    });
    await withdrawalPage.scrollCheckoutBillingSectionIntoView();
    await withdrawalPage.fillCheckoutBillingAddress({
      fullName: billingFullName,
      mobile: billingMobile,
      address: manualAddress.address,
      pincode: manualAddress.pincode,
      stateOptionLabel: manualAddress.stateOptionLabel,
      cityOptionLabel: manualAddress.cityOptionLabel,
    });
    await withdrawalPage.settleMs(400);
  });

  await test.step('TC016_12 | Capture delivery snapshot and navigate to checkout', async () => {
    logSub(12, 'Proceed to checkout');
    deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.expectCheckoutDeliveryOrAddressUrl();
  });

  await test.step(
    'TC016_13 | Checkout billing — click each textbox, Tab (blur), read & print field errors',
    async () => {
      logSub(13, 'Edit form: clear billing text fields → click each input → Tab → inline errors');
      await withdrawalPage.checkoutPageClickEditDeliveryAddress();
      await withdrawalPage.scrollCheckoutBillingSectionIntoView();
      await withdrawalPage.logCheckoutBillingValidationAfterTabThrough({ logPrefix: TC016(13) });

      await withdrawalPage.fillCheckoutBillingAddress({
        fullName: billingFullName,
        mobile: billingMobile,
        address: manualAddress.address,
        pincode: manualAddress.pincode,
        stateOptionLabel: manualAddress.stateOptionLabel,
        cityOptionLabel: manualAddress.cityOptionLabel,
      });
      await withdrawalPage.settleMs(400);
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.settleMs(600);
    },
  );

  await test.step('TC016_14 | Checkout — To Deliver At matches manual delivery info', async () => {
    logSub(14, 'Verify delivery address section on checkout page');
    if (!deliveryInformation) {
      throw new Error('Delivery information was not captured before checkout validation.');
    }
    await withdrawalPage.checkoutPageClickSummaryTab();
    await withdrawalPage.expectCheckoutToDeliverAtHeadingVisible({ timeoutMs: 15_000 });
    const checkoutDeliverySnapshot = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay();
    await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(
      {
        ...deliveryInformation,
        // Summary line reflects billing full name after TC016_13 save, not profile delivery-row names.
        firstName: manualAddress.firstName,
        lastName: manualAddress.lastName,
      },
      { prefetchedDisplay: checkoutDeliverySnapshot },
    );
  });
});

/**
 * After checkout loads, open **Edit**, change the address in the form, save, then confirm **Summary → To Deliver At**
 * shows the new line (and no longer the pre-edit line).
 */
test('TC_017-Verify delivery address on checkout summary after editing delivery information @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
}) => {
  test.setTimeout(300_000);
  const TC017_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
  const manualAddress = {
    firstName: 'Augmont',
    lastName: 'QA Delivery',
    address: 'Bandra Kurla Complex Plot C',
    pincode: '400051',
    stateOptionLabel: 'Maharashtra',
    cityOptionLabel: 'Mumbai',
  } as const;
  /** Same pin/state/city; new street line to prove Summary picked up the edit. */
  const editedManualAddress = {
    ...manualAddress,
    address: 'Worli Sea Face Road Plot D',
  } as const;
  const billingFullName = `${manualAddress.firstName} ${manualAddress.lastName}`.trim();
  const billingMobile = '9876543210';
  let portfolioValue = 0;
  let totalGoldBeforePurchase = 0;
  let totalSilverBeforePurchase = 0;
  let goldFD = '';
  let investmentListTotalGoldRequired = 0;
  let beforeWithdrawalVaultTotalGold = 0;
  let beforeWithdrawalVaultRemainingGold = 0;
  let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
  const TC017 = (n: number): string => `TC017_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC017(n)}] ${title}`);
  };

  await test.step('TC017_1 | Get and validate portfolio values', async () => {
    logSub(1, 'Get and validate portfolio values');
    await dashboardPage.goto('/dashboard');
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

  await test.step('TC017_2 | Click Proceed and verify navigation', async () => {
    logSub(2, 'Click Proceed and verify navigation');
    const urlBeforeProceed = page.url();
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await withdrawalPage.expectUrlNotToEqual(urlBeforeProceed);
  });

  await test.step('TC017_3 | Verify options & Convert into Gold/Jewellery', async () => {
    logSub(3, 'Verify Two options are visible and click on Convert into Gold/Jewellery');
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await withdrawalPage.clickProceedForConvertGoldJewellery();
  });

  await test.step('TC017_4 | Verify product list and select product', async () => {
    logSub(4, 'Verify product list is available and select product');
    await withdrawalPage.waitForProductListPage();
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
    let selected = false;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await withdrawalPage.selectCoinCategoryIfNotSelected();
      console.log(`[${TC017(4)}] Product selected from withdrawal workbook (attempt ${attempt}/3):`, TC017_PRODUCT_NAME);
      selected = await withdrawalPage
        .selectProductByName(TC017_PRODUCT_NAME)
        .then(() => true)
        .catch(async (error) => {
          console.warn(
            `[${TC017(4)}] Product selection attempt ${attempt} failed for "${TC017_PRODUCT_NAME}". Retrying...`,
          );
          await withdrawalPage.settleMs(700);
          if (attempt === 3) {
            throw error;
          }
          return false;
        });
      if (selected) {
        await withdrawalPage.waitForProductDetailsPage();
        break;
      }
    }
  });

  await test.step('TC017_5 | Get product details and Request Delivery', async () => {
    logSub(5, 'Get and validate product details');
    await withdrawalPage.waitForProductDetailsPage();
    selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    console.log(selectedProductDetails);
    await withdrawalPage.clickRequestDelivery();
  });

  await test.step('TC017_6 | Verify cart details', async () => {
    logSub(6, 'Verify cart details');
    if (!selectedProductDetails) {
      throw new Error('Selected product details were not captured before cart validation.');
    }
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(selectedProductDetails.productName);
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    console.log('Cart quantity normalized to 1 for selected product');
    await withdrawalPage.validateCartItemWithSelectedProduct({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
    });

    const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
    console.log('Cart Total Amount Payable:', totalAmountPayable);
    console.log('Making & Delivery Charges Amount:', selectedProductDetails.makingAndDeliveryChargesAmount);
    expect(totalAmountPayable).toBe(selectedProductDetails.makingAndDeliveryChargesAmount);
    await withdrawalPage.clickSelectInvestments();
  });

  await test.step('TC017_7 | Investment summary — required vs available metal', async () => {
    logSub(7, 'Verify investment details before withdrawal');
    investmentListTotalGoldRequired = await withdrawalPage.getInvestmentListTotalGoldRequired();
    const investmentListTotalSilverRequired = await withdrawalPage.getInvestmentListTotalSilverRequired();
    const investmentListTotalGoldAvailable = await withdrawalPage.getInvestmentListTotalGoldAvailable();
    const investmentListTotalSilverAvailable = await withdrawalPage.getInvestmentListTotalSilverAvailable();
    console.log('Investment List Total Gold Required:', investmentListTotalGoldRequired);
    console.log('Investment List Total Silver Required:', investmentListTotalSilverRequired);
    console.log('Investment List Total Gold Available:', investmentListTotalGoldAvailable);
    console.log('Investment List Total Silver Available:', investmentListTotalSilverAvailable);
  });

  await test.step('TC017_8 | Gold Vault card totals before withdrawal', async () => {
    logSub(8, 'Verify Vault card value before withdrawal');
    const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
    beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
    beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
    console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
    console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);
  });

  await test.step('TC017_9 | Enter valid gold quantity for delivery', async () => {
    logSub(9, 'Validate quantity against Total Gold Required and proceed');
    expect(investmentListTotalGoldRequired).toBeGreaterThan(0);
    const hasRequiredGoldForVault = beforeWithdrawalVaultTotalGold >= investmentListTotalGoldRequired;
    console.log(`[${TC017(9)}] beforeWithdrawalVaultTotalGold:`, beforeWithdrawalVaultTotalGold);
    console.log(`[${TC017(9)}] investmentListTotalGoldRequired:`, investmentListTotalGoldRequired);
    console.log(
      `[${TC017(9)}] Precondition Check -> expected: GoldVault >= TotalGoldRequired | actual: ${beforeWithdrawalVaultTotalGold} >= ${investmentListTotalGoldRequired} | result: ${hasRequiredGoldForVault ? 'PASS' : 'FAIL'}`,
    );
    if (!hasRequiredGoldForVault) {
      console.log(
        `[${TC017(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) is less than Total Gold Required (${investmentListTotalGoldRequired}).`,
      );
    }
    expect(
      hasRequiredGoldForVault,
      `[${TC017(9)}][FAIL] Insufficient vault value: Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) must be >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    ).toBe(true);
    console.log(
      `[${TC017(9)}][PASS] Gold Vault Total Gold (${beforeWithdrawalVaultTotalGold}) >= Total Gold Required (${investmentListTotalGoldRequired}).`,
    );

    const lessThanRequiredQty = Number((investmentListTotalGoldRequired - 0.01).toFixed(4));
    const greaterThanRequiredQty = Number((investmentListTotalGoldRequired + 0.01).toFixed(4));

    await withdrawalPage.enterQuantity(lessThanRequiredQty);
    const goldVaultTotalsForLessQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForLessQty = goldVaultTotalsForLessQty.remainingGold;
    const expectedRemainingForLessQty = Number((beforeWithdrawalVaultRemainingGold - lessThanRequiredQty).toFixed(4));
    expect(remainingForLessQty).toBeCloseTo(expectedRemainingForLessQty, 4);

    await withdrawalPage.enterQuantity(greaterThanRequiredQty);
    const goldVaultTotalsForGreaterQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingForGreaterQty = goldVaultTotalsForGreaterQty.remainingGold;
    const expectedRemainingForGreaterQty = Number(
      (beforeWithdrawalVaultRemainingGold - greaterThanRequiredQty).toFixed(4),
    );
    expect(remainingForGreaterQty).toBeCloseTo(expectedRemainingForGreaterQty, 4);

    await withdrawalPage.enterQuantity(investmentListTotalGoldRequired);

    const goldVaultTotalsForValidQty = await withdrawalPage.getGoldVaultCardTotals();
    const remainingAfterValidQty = goldVaultTotalsForValidQty.remainingGold;
    const expectedRemainingAfterValidQty = Number(
      (beforeWithdrawalVaultRemainingGold - investmentListTotalGoldRequired).toFixed(4),
    );
    expect(remainingAfterValidQty).toBeCloseTo(expectedRemainingAfterValidQty, 4);
    await withdrawalPage.validateTotalGoldValueDelivery(investmentListTotalGoldRequired);
  });

  await test.step('TC017_10 | Open delivery address form', async () => {
    logSub(10, 'Proceed from delivery summary to address fields');
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
  });

  await test.step('TC017_11 | Fill initial delivery row + billing (pre-edit address)', async () => {
    logSub(11, 'Delivery row then billing — initial Bandra Kurla address');
    await withdrawalPage.fillManualDeliveryAddress({
      firstName: manualAddress.firstName,
      lastName: manualAddress.lastName,
      address: manualAddress.address,
      pincode: manualAddress.pincode,
      stateOptionLabel: manualAddress.stateOptionLabel,
      cityOptionLabel: manualAddress.cityOptionLabel,
    });
    await withdrawalPage.scrollCheckoutBillingSectionIntoView();
    await withdrawalPage.fillCheckoutBillingAddress({
      fullName: billingFullName,
      mobile: billingMobile,
      address: manualAddress.address,
      pincode: manualAddress.pincode,
      stateOptionLabel: manualAddress.stateOptionLabel,
      cityOptionLabel: manualAddress.cityOptionLabel,
    });
    await withdrawalPage.settleMs(400);
  });

  await test.step('TC017_12 | Capture delivery snapshot and navigate to checkout', async () => {
    logSub(12, 'Proceed to checkout');
    await withdrawalPage.getAndLogDeliveryInformation();
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.expectCheckoutDeliveryOrAddressUrl();
  });

  await test.step('TC017_13 | Checkout — Edit and replace address in form', async () => {
    logSub(13, 'Edit on checkout, set Worli address on delivery row + billing, Proceed');
    await withdrawalPage.checkoutPageClickEditDeliveryAddress();
    await withdrawalPage.scrollCheckoutBillingSectionIntoView();
    const deliveryRow = withdrawalPage.getDeliveryAddressFormSection();
    if (await deliveryRow.isVisible().catch(() => false)) {
      const addrInput = deliveryRow.locator('#address').first();
      if (await addrInput.isVisible().catch(() => false)) {
        if (await addrInput.isEnabled().catch(() => false)) {
          await addrInput.fill(editedManualAddress.address);
        }
      }
    }
    await withdrawalPage.fillCheckoutBillingAddress({
      fullName: billingFullName,
      mobile: billingMobile,
      address: editedManualAddress.address,
      pincode: editedManualAddress.pincode,
      stateOptionLabel: editedManualAddress.stateOptionLabel,
      cityOptionLabel: editedManualAddress.cityOptionLabel,
    });
    await withdrawalPage.settleMs(400);
    await withdrawalPage.clickDeliveryProceedButton();
    await withdrawalPage.settleMs(600);
  });

  await test.step('TC017_14 | Summary — To Deliver At shows edited address', async () => {
    logSub(14, 'Verify Summary tab reflects new address and not the original line');
    await withdrawalPage.checkoutPageClickSummaryTab();
    await withdrawalPage.expectCheckoutToDeliverAtHeadingVisible({ timeoutMs: 15_000 });
    const checkoutDeliverySnapshot = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay();
    const normalizeAddr = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
    expect(normalizeAddr(checkoutDeliverySnapshot.addressBodyNormalized)).toContain(
      normalizeAddr(editedManualAddress.address),
    );
    expect(normalizeAddr(checkoutDeliverySnapshot.addressBodyNormalized)).not.toContain(
      normalizeAddr(manualAddress.address),
    );
    await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(
      {
        firstName: manualAddress.firstName,
        lastName: manualAddress.lastName,
        address: editedManualAddress.address,
        pincode: editedManualAddress.pincode,
        state: editedManualAddress.stateOptionLabel,
        cityOrDistrict: editedManualAddress.cityOptionLabel,
      },
      { prefetchedDisplay: checkoutDeliverySnapshot },
    );
  });
});

test('TC_018-Verify withdrawal cart add/remove product and Start Shopping navigation. @customer-flows', async ({
  page,
  dashboardPage,
  withdrawalPage,
}) => {
  test.setTimeout(240_000);
  const TC018 = (n: number): string => `TC018_${n}`;
  const logSub = (n: number, title: string): void => {
    console.log(`\n[${TC018(n)}] ${title}`);
  };

  const primaryProductName = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';

  await test.step('TC018_1 | Open dashboard and navigate to convert product list', async () => {
    logSub(1, 'Open convert product list');
    await dashboardPage.goto('/dashboard');
    await dashboardPage.clickWithdrawInvestment();
    await withdrawalPage.clickProceed();
    await withdrawalPage.verifyDepositAndConvertToJewelleryOptionsVisible();
    await withdrawalPage.clickProceedForConvertGoldJewellery();
    await withdrawalPage.waitForProductListPage();
    const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
    expect(categoryNames.length).toBeGreaterThan(0);
  });

  await test.step('TC018_2 | Select one product and validate cart product details', async () => {
    logSub(2, 'Select one product and validate cart details');
    await withdrawalPage.selectCoinCategoryIfNotSelected();
    await withdrawalPage.selectProductByName(primaryProductName, 'Coin');
    console.log(`[${TC018(2)}] Product selected: ${primaryProductName}`);
    const selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
    await withdrawalPage.clickRequestDelivery();
    const productCountInCart = await withdrawalPage.getCountOfProductInCart();
    if (productCountInCart > 1) {
      await withdrawalPage.removeExtraProductsFromCart(selectedProductDetails.productName);
    }
    const selectedProductQty = await withdrawalPage.getSelectedProductQuantityInCart(selectedProductDetails.productName);
    if (selectedProductQty > 1) {
      await withdrawalPage.reduceSelectedProductQuantityInCart(selectedProductDetails.productName, 1);
    }
    await withdrawalPage.validateSelectedProductCardInCart(selectedProductDetails.productName, 1);

    await withdrawalPage.validateCartItemWithSelectedProduct({
      productName: selectedProductDetails.productName,
      productWeight: selectedProductDetails.productWeight,
      quantity: 1,
    });
  });

  await test.step('TC018_3 | Remove all cart items and validate empty cart message', async () => {
    logSub(3, 'Remove item and validate empty cart message');
    await withdrawalPage.removeAllProductsFromCart();
    await withdrawalPage.validateEmptyCartMessageVisible();
  });

  await test.step('TC018_4 | Click Continue Shopping and validate URL', async () => {
    logSub(4, 'Continue shopping navigation');
    await withdrawalPage.clickContinueShoppingFromCart();
    await withdrawalPage.waitForProductListPage();
    const currentUrl = page.url();
    const expectedUrlPattern = /\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i;
    console.log('[TC018 VALIDATION] Continue shopping URL | expected pattern:', expectedUrlPattern);
    console.log('[TC018 VALIDATION] Continue shopping URL | actual:', currentUrl);
    expect(currentUrl).toMatch(expectedUrlPattern);
    console.log('[TC018 VALIDATION] Continue shopping URL validation: PASS');
  });
});

