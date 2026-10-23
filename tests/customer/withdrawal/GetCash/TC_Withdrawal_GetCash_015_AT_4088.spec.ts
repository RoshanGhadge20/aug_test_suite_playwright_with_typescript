import { test, expect } from '../../../../fixtures/base.fixture';

const sipSelectionThreshold = 0.001;
// UPI isn't offered for large withdrawals — pick a Gold SIP whose full balance is below this.
const upiMaxSipAmount = 15000;

test.describe('TC_Withdrawal_GetCash_015 @customer-flows', () => {
  test(
    'TC_015-withdraw full available Gold SIP amount and amount transfer to UPI',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
      withdrawsipPage,
    }) => {
      const TC_015 = (n: number): string => `TC015_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_015(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let selectedSipName = '';
      let metalPrice: number;
      let fullGoldQuantity = 0;

      await test.step(
        'TC015_1 | Login & Dashboard — capture portfolio and total gold',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalGold: totalGoldBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_015(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_015(1)}] Total Gold:`, totalGoldBefore);
        },
      );

      await test.step(
        'TC015_2 | Open Get Cash, get Gold Summary and select Gold SIP',
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
            upiMaxSipAmount,
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
        'TC015_3 | proceed for withdrawal and withdraw full available Gold SIP amount',
        async () => {
          logSub(3, 'proceed for withdrawal and withdraw full available Gold SIP amount');

          await withdrawalPage.clickProceed();

          const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Gold');

          console.log('Total Value:', withdrawalSummary.totalValue);
          console.log('Total Gold:', withdrawalSummary.totalMetal);

          fullGoldQuantity = withdrawalSummary.totalMetal;

          expect(
            fullGoldQuantity,
            'No Gold SIP quantity available for withdrawal.',
          ).toBeGreaterThan(0);

          await withdrawDetailPage.tickWithdrawFullBalanceCheckbox();
          await withdrawDetailPage.clickWithdraw();

          await expect(page).toHaveURL(/\/withdraw\/account-details$/);
        },
      );

      await test.step(
        'TC015_4 | get and validate Account Detail Page Summary, select UPI and confirm withdrawal',
        async () => {
          logSub(4, 'get and validate Account Detail Page Summary, select UPI and confirm withdrawal');

          const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain(selectedSipName);
          expect(accountDetails.quantity).toBe(fullGoldQuantity);

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
        'TC015_5 | Get and validate withdrawal success',
        async () => {
          logSub(5, 'Get and validate withdrawal success');

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(
            fullGoldQuantity,
            metalPrice,
            'Gold',
          );

          await withdrawPamentPage.clickContinue();
        },
      );

      await test.step(
        'TC015_6 | Validate dashboard details after full Gold SIP withdrawal',
        async () => {
          logSub(6, 'Validate Dashboard After Full Gold SIP Withdrawal');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          const expectedGold = Number((totalGoldBefore - fullGoldQuantity).toFixed(4));

          console.log(`[${TC_015(6)}] Total Gold Before: ${totalGoldBefore}`);
          console.log(`[${TC_015(6)}] Withdrawal Quantity: ${fullGoldQuantity}`);
          console.log(`[${TC_015(6)}] Expected Gold: ${expectedGold}`);
          console.log(`[${TC_015(6)}] Actual Gold: ${dashboardAfter.totalGold}`);

          expect(dashboardAfter.totalGold).toBeCloseTo(expectedGold, 4);
        },
      );
    },
  );
});
