import { test, expect } from '../../../../fixtures/base.fixture';
import { SipDetails } from '@pages/customer/withdraw-sip.page';

const withdrawalQuantityInput = 0.1;
let selectedsipname = '';

test.describe('TC_Withdrawal_GetCash_003 @customer-flows', () => {

  test(
    'TC_003-withdrawal from gold SIP and amount transfer to UPI',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
      withdrawsipPage
    }) => {

      const TC_003 = (n: number): string => `TC003_${n}`;

      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_003(n)}] ${title}`);
      };

      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let totalSilverBefore = 0;
      let metalPrice: number;

      await test.step(
        'TC003_1 | Login & Dashboard — capture portfolio, total gold, total silver',
        async () => {
          await page.goto('/dashboard');

          ({
            portfolioValue,
            totalGold: totalGoldBefore,
            totalSilver: totalSilverBefore,
          } = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          }));
        }
      );


      await test.step(
        'TC003_2 | select get cash option and Get Gold Summary',
        async () => {
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.clickGetCashOption();
          await withdrawDetailPage.clickGoldTab();
          const goldSummary =
            await withdrawalPage.getMetalSummary('Gold');
          expect(goldSummary.value).toBeCloseTo(
            goldSummary.total * goldSummary.livePrice,
            1
          );
        }
      );

      await test.step(
        'TC003_4 | Select Gold SIP',
        async () => {

          const goldSip =
            await withdrawsipPage.selectSipForWithdrawal('Gold', withdrawalQuantityInput);
          console.log(goldSip);
          selectedsipname = goldSip.sipName;
          if (goldSip.amount <= 0) {
            throw new Error(
              `Not enough Gold SIP quantity available for withdrawal. Available: ${goldSip.quantity} gm`
            );
          }

          if (goldSip.quantity < withdrawalQuantityInput) {
            throw new Error(
              `Not enough Gold SIP quantity available for withdrawal. Available: ${goldSip.quantity} gm, Requested: ${withdrawalQuantityInput} gm`
            );
          }

        }
      );

      await test.step(
        'TC003_5 | Proceed for withdrawal',
        async () => {

          await withdrawalPage.clickProceed();

          const withdrawalSummary =
            await withdrawDetailPage.getWithdrawalSummary('Gold');

          if (
            withdrawalQuantityInput >
            withdrawalSummary.totalMetal
          ) {
            throw new Error(
              `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`
            );
          }

          await withdrawDetailPage.enterWithdrawalQuantity(
            withdrawalQuantityInput
          );

          await withdrawDetailPage.clickWithdraw();

          await expect(page).toHaveURL(
            /\/withdraw\/account-details$/
          );
        }
      );

      await test.step(
        'TC003_6 | Select UPI and validate details',
        async () => {

          const accountDetails =
            await withdrawAccountDetailPage.getAccountDetails();

          expect(accountDetails.withdrawalFrom).toContain(selectedsipname);

          expect(accountDetails.quantity).toBe(
            withdrawalQuantityInput
          );

          await withdrawAccountDetailPage.validateTransferOptions();
          await withdrawAccountDetailPage.clickUPI();
          const selectedUpi = await withdrawAccountDetailPage.selectUpi();
          console.log(selectedUpi);

          await withdrawAccountDetailPage.validateCounter();

          metalPrice =
            await withdrawAccountDetailPage.getLivePriceValue('Gold');

          await withdrawDetailPage.clickWithdraw();
        }
      );

      await test.step(
        'TC003_7 | Confirm withdrawal',
        async () => {

          await withdrawAccountDetailPage.validateWithdrawAndCancelOptions();

          await withdrawAccountDetailPage.withdrawButtonClick();
        }
      );

      await test.step(
        'TC003_8 | Validate success popup',
        async () => {

          await withdrawPamentPage.validateSuccessPopup();
          await withdrawPamentPage.validateSuccessPopupDetails(
            withdrawalQuantityInput,
            metalPrice,
            'Gold'
          );

          await withdrawPamentPage.clickContinue();
        }
      );

      await test.step(
        'TC003_9 | Validate dashboard after withdrawal',
        async () => {

          await page.goto('/dashboard');

          const dashboardAfter =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            });

          const expectedGold = Number(
            (totalGoldBefore - withdrawalQuantityInput).toFixed(4)
          );

          expect(
            dashboardAfter.totalGold
          ).toBeCloseTo(expectedGold, 4);
        }
      );
    }
  );
});