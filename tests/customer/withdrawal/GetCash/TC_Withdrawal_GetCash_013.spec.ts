import { test, expect } from '../../../../fixtures/base.fixture';

const withdrawalQuantityInput = 0.1;

// NOTE: as of the last live check, the default .env UAT_CUSTOMER_USER_MOBILE account has
// 0 Gold Vault balance, so TC013_3's precondition assertion will fail until that account's
// Gold Vault is topped up. This test previously used a dedicated account (9561273901) that
// does have Vault balance; reverted to the default account per explicit instruction.
test.describe('TC_Withdrawal_GetCash_013 @customer-flows', () => {
  test(
    'TC_013-withdraw from Gold Vault and amount transfer to UPI',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
    }) => {
      const TC_013 = (n: number): string => `TC013_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_013(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let metalPrice: number;

      await test.step(
        'TC013_1 | Login & Dashboard — capture portfolio and total gold',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalGold: totalGoldBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_013(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_013(1)}] Total Gold:`, totalGoldBefore);
        },
      );

      await test.step(
        'TC013_2 | Open Get Cash and get Gold Summary from Investment List',
        async () => {
          logSub(2, 'Open Get Cash and get Gold Summary from Investment List');

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickGoldTab();

          const goldSummary = await withdrawalPage.getMetalSummary('Gold');

          console.log('Gold Summary:', goldSummary);

          expect(goldSummary.value).toBeCloseTo(
            goldSummary.total * goldSummary.livePrice,
            1,
          );
        },
      );

      await test.step(
        'TC013_3 | select Gold Vault for withdrawal and get vault detail',
        async () => {
          logSub(3, 'select Gold Vault for withdrawal and get vault detail');

          const goldVault = await withdrawalPage.getVaultDetailsAndClick('Gold');

          console.log('Withdrawal Gold:', goldVault.withdrawalMetal);
          console.log('Gold Vault Value:', goldVault.vaultValue);

          expect(
            goldVault.withdrawalMetal,
            `Not enough quantity available for withdrawal. Available Gold: ${goldVault.withdrawalMetal} gm`,
          ).toBeGreaterThan(0);
        },
      );

      await test.step(
        'TC013_4 | proceed for withdrawal and enter valid quantity',
        async () => {
          logSub(4, 'proceed for withdrawal and enter valid quantity');

          await withdrawalPage.clickProceed();

          const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Gold');

          console.log('Total Value:', withdrawalSummary.totalValue);
          console.log('Total Gold:', withdrawalSummary.totalMetal);

          if (withdrawalQuantityInput > withdrawalSummary.totalMetal) {
            throw new Error(
              `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`,
            );
          }

          await withdrawDetailPage.enterWithdrawalQuantity(withdrawalQuantityInput);
          await withdrawDetailPage.clickWithdraw();

          await expect(page).toHaveURL(/\/withdraw\/account-details$/);
        },
      );

      await test.step(
        'TC013_5 | get and validate Account Detail Page Summary, select UPI and confirm withdrawal',
        async () => {
          logSub(5, 'get and validate Account Detail Page Summary, select UPI and confirm withdrawal');

          const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain('Gold Vault');
          expect(accountDetails.quantity).toBe(withdrawalQuantityInput);

          console.log('account details', accountDetails);

          await withdrawAccountDetailPage.validateTransferOptions();
          await withdrawAccountDetailPage.clickUPI();

          const selectedUpi = await withdrawAccountDetailPage.selectUpi();
          console.log('Selected UPI:', selectedUpi);

          await withdrawAccountDetailPage.validateCounter();

          metalPrice = await withdrawAccountDetailPage.getLivePriceValue('Gold');

          await withdrawDetailPage.clickWithdraw();
          await withdrawAccountDetailPage.withdrawButtonClick();
        },
      );

      await test.step(
        'TC013_6 | Get and validate withdrawal success',
        async () => {
          logSub(6, 'Get and validate withdrawal success');

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(
            withdrawalQuantityInput,
            metalPrice,
            'Gold',
          );

          await withdrawPamentPage.clickContinue();
        },
      );

      await test.step(
        'TC013_7 | Validate dashboard details after Gold Vault withdrawal',
        async () => {
          logSub(7, 'Validate Dashboard After Gold Vault Withdrawal');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          const expectedGold = Number(
            (totalGoldBefore - withdrawalQuantityInput).toFixed(4),
          );

          console.log(`[${TC_013(7)}] Total Gold Before: ${totalGoldBefore}`);
          console.log(`[${TC_013(7)}] Withdrawal Quantity: ${withdrawalQuantityInput}`);
          console.log(`[${TC_013(7)}] Expected Gold: ${expectedGold}`);
          console.log(`[${TC_013(7)}] Actual Gold: ${dashboardAfter.totalGold}`);

          expect(dashboardAfter.totalGold).toBeCloseTo(expectedGold, 4);
        },
      );
    },
  );
});
