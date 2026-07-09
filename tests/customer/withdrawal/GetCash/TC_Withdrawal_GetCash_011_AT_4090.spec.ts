import { test, expect } from '../../../../fixtures/base.fixture';

const withdrawalQuantityInput = 0.1;
const sipSelectionThreshold = 0.001;

test.describe('TC_Withdrawal_GetCash_011 @customer-flows', () => {
  test(
    'TC_011-withdraw from Silver SIP and amount transfer to Bank Account',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
      withdrawsipPage,
    }) => {
      const TC_011 = (n: number): string => `TC011_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_011(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalSilverBefore = 0;
      let selectedSipName = '';
      let metalPrice: number;

      await test.step(
        'TC011_1 | Login & Dashboard — capture portfolio and total silver',
        async () => {
          logSub(1, 'Login & Dashboard');

          await page.goto('/dashboard');

          ({ portfolioValue, totalSilver: totalSilverBefore } =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            }));

          console.log(`[${TC_011(1)}] Portfolio Value:`, portfolioValue);
          console.log(`[${TC_011(1)}] Total Silver:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC011_2 | Open Get Cash, get Silver Summary and select Silver SIP',
        async () => {
          logSub(2, 'Open Get Cash, get Silver Summary and select Silver SIP');

          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickSilverTab();

          const silverSummary = await withdrawalPage.getMetalSummary('Silver');

          console.log('Silver Summary:', silverSummary);

          expect(silverSummary.value).toBeCloseTo(
            silverSummary.total * silverSummary.livePrice,
            1,
          );

          const silverSip = await withdrawsipPage.selectSipForWithdrawal(
            'Silver',
            sipSelectionThreshold,
          );

          console.log('Selected Silver SIP:', silverSip);

          selectedSipName = silverSip.sipName;

          expect(
            silverSip.quantity,
            `No Silver SIP found with withdrawable balance. Available: ${silverSip.quantity} gm`,
          ).toBeGreaterThan(0);
        },
      );

      await test.step(
        'TC011_3 | proceed for withdrawal and enter valid quantity',
        async () => {
          logSub(3, 'proceed for withdrawal and enter valid quantity');

          await withdrawalPage.clickProceed();

          const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Silver');

          console.log('Total Value:', withdrawalSummary.totalValue);
          console.log('Total Silver:', withdrawalSummary.totalMetal);

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
        'TC011_4 | get and validate Account Detail Page Summary, select bank and confirm withdrawal',
        async () => {
          logSub(4, 'get and validate Account Detail Page Summary, select bank and confirm withdrawal');

          const accountDetails = await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain(selectedSipName);
          expect(accountDetails.quantity).toBe(withdrawalQuantityInput);

          console.log('account details', accountDetails);

          await withdrawAccountDetailPage.validateTransferOptions();
          await withdrawAccountDetailPage.clickBankAccount();
          await withdrawAccountDetailPage.selectBank('ICICI BANK LIMITED');

          const bankDetails = await withdrawAccountDetailPage.getBankDetails('ICICI BANK LIMITED');
          console.log('Bank Details:', bankDetails);

          await withdrawAccountDetailPage.validateCounter();

          metalPrice = await withdrawAccountDetailPage.getLiveSilverPrice();

          await withdrawDetailPage.clickWithdraw();
          await withdrawAccountDetailPage.withdrawButtonClick();
        },
      );

      await test.step(
        'TC011_5 | Get and validate withdrawal success',
        async () => {
          logSub(5, 'Get and validate withdrawal success');

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(
            withdrawalQuantityInput,
            metalPrice,
            'Silver',
          );

          await withdrawPamentPage.clickContinue();
        },
      );

      await test.step(
        'TC011_6 | Validate dashboard details after Silver SIP withdrawal',
        async () => {
          logSub(6, 'Validate Dashboard After Silver SIP Withdrawal');

          await page.goto('/dashboard');

          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          const expectedSilver = Number(
            (totalSilverBefore - withdrawalQuantityInput).toFixed(4),
          );

          console.log(`[${TC_011(6)}] Total Silver Before: ${totalSilverBefore}`);
          console.log(`[${TC_011(6)}] Withdrawal Quantity: ${withdrawalQuantityInput}`);
          console.log(`[${TC_011(6)}] Expected Silver: ${expectedSilver}`);
          console.log(`[${TC_011(6)}] Actual Silver: ${dashboardAfter.totalSilver}`);

          expect(dashboardAfter.totalSilver).toBeCloseTo(expectedSilver, 4);
        },
      );
    },
  );
});
