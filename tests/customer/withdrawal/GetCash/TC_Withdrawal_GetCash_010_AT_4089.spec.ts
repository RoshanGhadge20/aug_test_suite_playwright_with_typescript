import { test, expect } from '../../../../fixtures/base.fixture';

const withdrawalQuantityInput = 0.1;
const sipSelectionThreshold = 0.001;

test.describe('TC_Withdrawal_GetCash_010 @customer-flows', () => {
  test(
    'TC_010-verify Cancel on withdrawal confirmation popup does not debit balance',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawsipPage,
    }) => {
      const TC_010 = (n: number): string => `TC010_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_010(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let selectedSipName = '';

      await test.step(
        'TC010_1 | Login & Dashboard — capture portfolio and total gold',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalGold: totalGoldBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_010(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_010(1)}] Total Gold:`, totalGoldBefore);
        },
      );

      await test.step(
        'TC010_2 | Open Get Cash, get Gold Summary and select Gold SIP',
        async () => {
          logSub(2, 'Open Get Cash, get Gold Summary and select Gold SIP');

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickGoldTab();

          const goldSummary = await withdrawalPage.getMetalSummary('Gold');

          console.log('Gold Summary:', goldSummary);

          expect(goldSummary.value).toBeCloseTo(
            goldSummary.total * goldSummary.livePrice,
            1,
          );

          const goldSip = await withdrawsipPage.selectSipForWithdrawal(
            'Gold',
            sipSelectionThreshold,
          );

          console.log('Selected Gold SIP:', goldSip);

          selectedSipName = goldSip.sipName;

          expect(
            goldSip.quantity,
            `No Gold SIP found with withdrawable balance. Available: ${goldSip.quantity} gm`,
          ).toBeGreaterThan(0);
        },
      );

      await test.step(
        'TC010_3 | proceed for withdrawal and enter valid quantity',
        async () => {
          logSub(3, 'proceed for withdrawal and enter valid quantity');

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
        'TC010_4 | get Account Detail Page Summary and select UPI',
        async () => {
          logSub(4, 'get Account Detail Page Summary and select UPI');

          const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain(selectedSipName);
          expect(accountDetails.quantity).toBe(withdrawalQuantityInput);

          console.log('account details', accountDetails);

          await withdrawAccountDetailPage.clickUPI();

          const selectedUpi = await withdrawAccountDetailPage.selectUpi();
          console.log('Selected UPI:', selectedUpi);
        },
      );

      await test.step(
        'TC010_5 | Open withdrawal confirmation popup and click Cancel',
        async () => {
          logSub(5, 'Open withdrawal confirmation popup and click Cancel');

          await withdrawDetailPage.clickWithdraw();

          await withdrawAccountDetailPage.validateWithdrawAndCancelOptions();

          await withdrawAccountDetailPage.cancelButtonClick();
        },
      );

      await test.step(
        'TC010_6 | Validate confirmation popup closed and withdrawal was not submitted',
        async () => {
          logSub(6, 'Validate confirmation popup closed and withdrawal was not submitted');

          const dialogVisible = await withdrawAccountDetailPage.isWithdrawalConfirmationDialogVisible();
          expect(dialogVisible).toBe(false);

          await expect(page).toHaveURL(/\/withdraw\/account-details$/);
        },
      );

      await test.step(
        'TC010_7 | Validate dashboard total gold is unchanged after cancel',
        async () => {
          logSub(7, 'Validate dashboard total gold is unchanged after cancel');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          console.log(`[${TC_010(7)}] Total Gold Before: ${totalGoldBefore}`);
          console.log(`[${TC_010(7)}] Total Gold After Cancel: ${dashboardAfter.totalGold}`);

          expect(dashboardAfter.totalGold).toBeCloseTo(totalGoldBefore, 4);
        },
      );
    },
  );
});
