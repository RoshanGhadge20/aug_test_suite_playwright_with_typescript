import { test, expect } from '../../../../fixtures/base.fixture';

test.describe('TC_Withdrawal_GetCash_016 @customer-flows', () => {
  test(
    'TC_016-verify Proceed is blocked when selected vault has zero withdrawable balance',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
    }) => {
      const TC_016 = (n: number): string => `TC016_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_016(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalSilverBefore = 0;
      let totalSilverAfterDrain = 0;

      await test.step(
        'TC016_1 | Login & Dashboard — capture portfolio and total silver',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalSilver: totalSilverBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_016(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_016(1)}] Total Silver:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC016_2 | Open Get Cash and get Silver Summary from Investment List',
        async () => {
          logSub(2, 'Open Get Cash and get Silver Summary from Investment List');

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickSilverTab();

          const silverSummary = await withdrawalPage.getMetalSummary('Silver');
          console.log('Silver Summary:', silverSummary);
        },
      );

      await test.step(
        'TC016_3 | Drain Silver Vault to zero if it currently has a withdrawable balance',
        async () => {
          logSub(3, 'Drain Silver Vault to zero if it currently has a withdrawable balance');

          const silverVault = await withdrawalPage.getVaultDetailsAndClick('Silver');
          console.log(`[${TC_016(3)}] Withdrawal Silver:`, silverVault.withdrawalMetal);

          if (silverVault.withdrawalMetal <= 0) {
            console.log(`[${TC_016(3)}] Silver Vault already has zero withdrawable balance.`);
            totalSilverAfterDrain = totalSilverBefore;
            return;
          }

          console.log(`[${TC_016(3)}] Silver Vault has a balance — withdrawing it fully.`);

          await withdrawalPage.clickProceed();

          const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Silver');
          const fullSilverQuantity = withdrawalSummary.totalMetal;

          await withdrawDetailPage.tickWithdrawFullBalanceCheckbox();
          await withdrawDetailPage.clickWithdraw();

          await expect(page).toHaveURL(/\/withdraw\/account-details$/);

          await withdrawAccountDetailPage.validateTransferOptions();
          await withdrawAccountDetailPage.clickBankAccount();
          await withdrawAccountDetailPage.selectFirstBank();
          await withdrawAccountDetailPage.validateCounter();

          const metalPrice = await withdrawAccountDetailPage.getLiveSilverPrice();

          await withdrawDetailPage.clickWithdraw();
          await withdrawAccountDetailPage.withdrawButtonClick();

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(fullSilverQuantity, metalPrice, 'Silver');
          await withdrawPamentPage.clickContinue();

          await page.goto('/dashboard');
          const afterDrain = await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false });
          totalSilverAfterDrain = afterDrain.totalSilver;
          console.log(`[${TC_016(3)}] Total Silver after drain:`, totalSilverAfterDrain);

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickSilverTab();
        },
      );

      await test.step(
        'TC016_4 | select Silver Vault and confirm it has zero withdrawable balance',
        async () => {
          logSub(4, 'select Silver Vault and confirm it has zero withdrawable balance');

          const silverVault = await withdrawalPage.getVaultDetailsAndClick('Silver');

          console.log('Withdrawal Silver:', silverVault.withdrawalMetal);
          console.log('Silver Vault Value:', silverVault.vaultValue);

          expect(
            silverVault.withdrawalMetal,
            'Precondition failed: Silver Vault must have zero withdrawable balance for this test.',
          ).toBe(0);
        },
      );

      await test.step(
        'TC016_5 | click Proceed and verify the insufficient-quantity error toast',
        async () => {
          logSub(5, 'click Proceed and verify the insufficient-quantity error toast');

          await withdrawalPage.clickProceed();

          const errorToast = await withdrawalPage.getErrorToastMessage();

          console.log(`[${TC_016(5)}] Error toast title:`, errorToast.title);
          console.log(`[${TC_016(5)}] Error toast message:`, errorToast.message);

          expect(errorToast.title).toBe('Error');
          // Live copy uses a typographic apostrophe ("don’t").
          expect(errorToast.message).toBe('You don’t have enough quantity for transaction');

          console.log('URL after Proceed on zero-balance vault:', page.url());

          await expect(page).toHaveURL(/\/withdraw\/investment-list(?:\/)?(?:\?.*)?$/i);
        },
      );

      await test.step(
        'TC016_6 | Validate dashboard total silver is unchanged',
        async () => {
          logSub(6, 'Validate dashboard total silver is unchanged');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          console.log(`[${TC_016(6)}] Total Silver Before: ${totalSilverAfterDrain}`);
          console.log(`[${TC_016(6)}] Total Silver After: ${dashboardAfter.totalSilver}`);

          expect(dashboardAfter.totalSilver).toBeCloseTo(totalSilverAfterDrain, 4);
        },
      );
    },
  );
});
