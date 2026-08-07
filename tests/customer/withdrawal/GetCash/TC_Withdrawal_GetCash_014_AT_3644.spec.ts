import { test, expect } from '../../../../fixtures/base.fixture';

const BANK_NAME = 'ICICI BANK LIMITED';
// Real, verified ICICI account confirmed to complete a withdrawal in this UAT environment —
// used as a fallback when no bank account is linked yet.
const ICICI_ACCOUNT_NUMBER = '624401537051';
const ICICI_IFSC_CODE = 'ICIC0006244';

test.describe('TC_Withdrawal_GetCash_014 @customer-flows', () => {
  test(
    'TC_014-withdraw full available silver amount from vault and amount transfer to bank account',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
      addNewBankWithdrawalPage,
    }) => {
      const TC_014 = (n: number): string => `TC014_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_014(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let totalSilverBefore = 0;
      let metalPrice: number;
      let fullSilverQuantity = 0;

      await test.step(
        'TC014_1 | Login & Dashboard — capture portfolio, total gold, total silver',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({
            portfolioValue,
            totalGold: totalGoldBefore,
            totalSilver: totalSilverBefore,
          } = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          }));

          console.log(`[${TC_014(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_014(1)}] Total Gold:`, totalGoldBefore);
          console.log(`[${TC_014(1)}] Total Silver:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC014_2 | Open Get Cash and get Silver Summary from Investment List',
        async () => {
          logSub(2, 'Open Get Cash and get Silver Summary from Investment List');

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickSilverTab();

          const silverSummary = await withdrawalPage.getMetalSummary('Silver');

          console.log('Silver Summary:', silverSummary);

          expect(silverSummary.value).toBeCloseTo(
            silverSummary.total * silverSummary.livePrice,
            1,
          );
        },
      );

      await test.step(
        'TC014_3 | select Silver Vault for withdrawal and get vault detail',
        async () => {
          logSub(3, 'select Silver Vault for withdrawal and get vault detail');

          const silverVault = await withdrawalPage.getVaultDetailsAndClick('Silver');

          console.log('Withdrawal Silver:', silverVault.withdrawalMetal);
          console.log('Silver Vault Value:', silverVault.vaultValue);

          expect(
            silverVault.withdrawalMetal,
            `Not enough quantity available for withdrawal. Available Silver: ${silverVault.withdrawalMetal} gm`,
          ).toBeGreaterThan(0);
        },
      );

      await test.step(
        'TC014_4 | proceed for withdrawal and withdraw full available Silver amount',
        async () => {
          logSub(4, 'proceed for withdrawal and withdraw full available Silver amount');

          await withdrawalPage.clickProceed();

          const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Silver');

          console.log('Total Value:', withdrawalSummary.totalValue);
          console.log('Total Silver:', withdrawalSummary.totalMetal);

          fullSilverQuantity = withdrawalSummary.totalMetal;

          expect(
            fullSilverQuantity,
            'No Silver quantity available for withdrawal.',
          ).toBeGreaterThan(0);

          await withdrawDetailPage.tickWithdrawFullBalanceCheckbox();
          await withdrawDetailPage.clickWithdraw();

          await expect(page).toHaveURL(/\/withdraw\/account-details$/);
        },
      );

      await test.step(
        'TC014_5 | get and validate Account Detail Page Summary, select bank and confirm withdrawal',
        async () => {
          logSub(5, 'get and validate Account Detail Page Summary, select bank and confirm withdrawal');

          const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain('Silver Vault');
          expect(accountDetails.quantity).toBe(fullSilverQuantity);

          console.log('account details', accountDetails);

          await withdrawAccountDetailPage.validateTransferOptions();
          await withdrawAccountDetailPage.clickBankAccount();

          const bankAvailable = await withdrawAccountDetailPage.isBankAvailable(BANK_NAME);
          if (!bankAvailable) {
            console.log(`[${TC_014(5)}] ${BANK_NAME} not linked yet — adding a new bank account.`);
            await addNewBankWithdrawalPage.addBankDetails(ICICI_ACCOUNT_NUMBER, ICICI_IFSC_CODE);
            await addNewBankWithdrawalPage.clickSaveBank();
            // Dismiss the "Bank added successfully" toast so it isn't mistaken later for the
            // withdrawal-success toast.
            await addNewBankWithdrawalPage.getSuccessToastTitle();
            await addNewBankWithdrawalPage.closeToast();
            await withdrawAccountDetailPage.clickBankAccount();
          }

          await withdrawAccountDetailPage.selectBank(BANK_NAME);

          const bankDetails = await withdrawAccountDetailPage.getBankDetails(BANK_NAME);
          console.log('Bank Details:', bankDetails);

          await withdrawAccountDetailPage.validateCounter();

          metalPrice = await withdrawAccountDetailPage.getLiveSilverPrice();

          await withdrawDetailPage.clickWithdraw();
          await withdrawAccountDetailPage.withdrawButtonClick();
        },
      );

      await test.step(
        'TC014_6 | Get and validate withdrawal success',
        async () => {
          logSub(6, 'Get and validate withdrawal success');

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(
            fullSilverQuantity,
            metalPrice,
            'Silver',
          );

          await withdrawPamentPage.clickContinue();
        },
      );

      await test.step(
        'TC014_7 | Validate dashboard details after full silver withdrawal',
        async () => {
          logSub(7, 'Validate Dashboard After Full Silver Withdrawal');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          const expectedSilver = Number((totalSilverBefore - fullSilverQuantity).toFixed(4));

          console.log(`[${TC_014(7)}] Total Silver Before: ${totalSilverBefore}`);
          console.log(`[${TC_014(7)}] Withdrawal Quantity: ${fullSilverQuantity}`);
          console.log(`[${TC_014(7)}] Expected Silver: ${expectedSilver}`);
          console.log(`[${TC_014(7)}] Actual Silver: ${dashboardAfter.totalSilver}`);

          expect(dashboardAfter.totalSilver).toBeCloseTo(expectedSilver, 4);
        },
      );
    },
  );
});
