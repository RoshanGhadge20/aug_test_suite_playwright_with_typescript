import { test, expect } from '../../../../fixtures/base.fixture';

test.describe('TC_Withdrawal_GetCash_012 @customer-flows', () => {
  test(
    'TC_012-verify Proceed is blocked when selected vault has zero withdrawable balance',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
    }) => {
      const TC_012 = (n: number): string => `TC012_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_012(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalSilverBefore = 0;

      await test.step(
        'TC012_1 | Login & Dashboard — capture portfolio and total silver',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalSilver: totalSilverBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_012(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_012(1)}] Total Silver:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC012_2 | Open Get Cash and get Silver Summary from Investment List',
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
        'TC012_3 | select Silver Vault and confirm it has zero withdrawable balance',
        async () => {
          logSub(3, 'select Silver Vault and confirm it has zero withdrawable balance');

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
        'TC012_4 | click Proceed and verify the insufficient-quantity error toast',
        async () => {
          logSub(4, 'click Proceed and verify the insufficient-quantity error toast');

          await withdrawalPage.clickProceed();

          const errorToast = await withdrawalPage.getErrorToastMessage();

          console.log(`[${TC_012(4)}] Error toast title:`, errorToast.title);
          console.log(`[${TC_012(4)}] Error toast message:`, errorToast.message);

          expect(errorToast.title).toBe('Error');
          expect(errorToast.message).toBe('You dont have enough quantity for transaction');

          console.log('URL after Proceed on zero-balance vault:', page.url());

          await expect(page).toHaveURL(/\/withdraw\/investment-list(?:\/)?(?:\?.*)?$/i);
        },
      );

      await test.step(
        'TC012_5 | Validate dashboard total silver is unchanged',
        async () => {
          logSub(5, 'Validate dashboard total silver is unchanged');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          console.log(`[${TC_012(5)}] Total Silver Before: ${totalSilverBefore}`);
          console.log(`[${TC_012(5)}] Total Silver After: ${dashboardAfter.totalSilver}`);

          expect(dashboardAfter.totalSilver).toBeCloseTo(totalSilverBefore, 4);
        },
      );
    },
  );
});
