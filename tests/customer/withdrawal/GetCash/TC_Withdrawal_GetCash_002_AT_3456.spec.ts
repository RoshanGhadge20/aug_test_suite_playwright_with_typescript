import { WithdrawalPage } from '@pages/customer/withdrawal.page';
import { test, expect } from '../../../../fixtures/base.fixture';


const withdrawalQuantityInput = 0.1;
test.describe('TC_Withdrawal_GetCash_002 @customer-flows', () => {

  test('TC_002-withdrawal from silver vault and amount transfer to bank account',
    async ({ page, dashboardPage, withdrawalPage, withdrawDetailPage, withdrawAccountDetailPage, withdrawPamentPage }) => {

      const TC_002 = (n: number): string => `TC001_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC_002(n)}] ${title}`);
      };
      let portfolioValue = 0;
      let totalGoldBefore = 0;
      let totalSilverBefore = 0;
      let metalPrice: any;

      await test.step('TC002_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
        logSub(1, 'Login & Dashboard');
        await page.goto('/dashboard');
        ({ portfolioValue, totalGold: totalGoldBefore, totalSilver: totalSilverBefore } =
          await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false }));
        console.log(`[${TC_002(1)}] Portfolio Value:`, portfolioValue);
        console.log(`[${TC_002(1)}] Total Gold:`, totalGoldBefore);
        console.log(`[${TC_002(1)}] Total Silver:`, totalSilverBefore);
      });

      await test.step('TC002_2 | verify two options are visible get cash and get coins and bars', async () => {
        logSub(2, 'verify two options are visible get cash and get coins and bars');
        await dashboardPage.clickWithdrawInvestment();
        await withdrawalPage.verifyGetCoinAndCashOptionVisible();
        await withdrawalPage.clickGetCashOption();
        await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
      });

      await test.step('TC002_3 | Get Silver Summary from Investment List and validate Silver Value',
        async () => {
          logSub(3, 'Get Silver Summary from Investment List and validate Silver Value');
          await withdrawDetailPage.clickSilverTab();
          await expect(
            page.locator('p:has-text("Total Silver")').locator('xpath=following-sibling::p[1]')
          ).not.toHaveText(/^\s*gm\s*$/, {
            timeout: 15000,
          });

          await expect(
            page.locator('p:has-text("Silver Value")').locator('xpath=following-sibling::p[1]')
          ).not.toHaveText('₹ 0', {
            timeout: 15000,
          });

          const silverSummary = await withdrawalPage.getMetalSummary('Silver');

          console.log('Silver Summary:', silverSummary);

          expect(silverSummary.value).toBeCloseTo(
            silverSummary.total * silverSummary.livePrice,
            1,
          );
        },
      );

      await test.step('TC002_4 | select Silver Vault for withdrawal and get vault detail', async () => {
        logSub(4, 'select Silver Vault for withdrawal and get vault detail');

        const silverVault = await withdrawalPage.getVaultDetailsAndClick('Silver');

        console.log('Withdrawal Silver:', silverVault.withdrawalMetal);
        console.log('Silver Vault Value:', silverVault.vaultValue);
      }
      )


      await test.step('TC_002_5| proceed for withdrawal and get withdrwal detail', async () => {
        logSub(5, 'proceed for withdrawal and get withdrwal detail');

        await withdrawalPage.clickProceed();
        const withdrawalSummary =
          await withdrawDetailPage.getWithdrawalSummary('Silver');
        console.log('Total Value:', withdrawalSummary.totalValue);
        console.log('Total Gold:', withdrawalSummary.totalMetal);

        console.log(`Entered withdrawal quantity: ${withdrawalQuantityInput}`);

        if (withdrawalQuantityInput > withdrawalSummary.totalMetal) {
          throw new Error(
            `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`,
          );
        }

        await withdrawDetailPage.enterWithdrawalQuantity(withdrawalQuantityInput);
        console.log(`Entered withdrawal quantity: ${withdrawalQuantityInput}`);
        await withdrawDetailPage.clickWithdraw();
        await expect(page).toHaveURL(
          /\/withdraw\/account-details$/
        );
      }
      )


      await test.step('TC_002_6|get and validate Account Detail Page Summary', async () => {
        logSub(6, 'get and validate Acoount Detail Page Summary,select bank,get bank account details and proceed to withdraw');
        const withdrawalAmountAccount = await withdrawAccountDetailPage.getWithdrawalAmount();
        console.log('Withdrawal Amount Account detail:', withdrawalAmountAccount);
        const accountDetails =
         await withdrawAccountDetailPage.getAccountDetails();
        expect(accountDetails.withdrawalFrom).toContain('Silver Vault');
        expect(accountDetails.quantity).toBe(withdrawalQuantityInput);
        console.log('account details', accountDetails);
        await withdrawAccountDetailPage.validateTransferOptions();
        await withdrawAccountDetailPage.clickBankAccount();
        await withdrawAccountDetailPage.selectBank('ICICI BANK LIMITED');
        const bankDetails = await withdrawAccountDetailPage.getBankDetails(
          'ICICI BANK LIMITED'
        );
        await withdrawAccountDetailPage.validateCounter();
        metalPrice = await withdrawAccountDetailPage.getLiveSilverPrice();
        await withdrawDetailPage.clickWithdraw();
      })

      await test.step('TC_002_7|Withdrawal confirmation Popup option varify and Select withdraw', async () => {
        logSub(7, 'Withdrawal confirmation Popup option varify and Select withdraw');

        await withdrawAccountDetailPage.validateWithdrawAndCancelOptions();
        await withdrawAccountDetailPage.withdrawButtonClick();

      })

      await test.step('TC_002_8| Get and validate withdrawal success', async () => {
        logSub(8, 'Get and validate withdrawal success');

        await withdrawPamentPage.validateSuccessPopup();
        await withdrawPamentPage.validateSuccessPopupDetails(withdrawalQuantityInput, metalPrice,'Silver');
        await withdrawPamentPage.clickContinue();
      })

      await test.step(
        'TC002_9 | Validate dashboard details after silver withdrawal',
        async () => {
          logSub(9, 'Validate Dashboard After Withdrawal');
          await page.goto('/dashboard');
          const dashboardAfter =
            await dashboardPage.captureWithdrawalDashboardSnapshot({
              requireGoldFd: false,
            });

          const expectedSilver = Number(
            (totalSilverBefore - withdrawalQuantityInput).toFixed(4)
          );

          console.log(`[${TC_002(9)}] Total Silver Before: ${totalSilverBefore}`);
          console.log(`[${TC_002(9)}] Withdrawal Quantity: ${withdrawalQuantityInput}`);
          console.log(`[${TC_002(9)}] Expected Silver: ${expectedSilver}`);
          console.log(
            `[${TC_002(9)}] Actual Silver: ${dashboardAfter.totalSilver}`
          );
          expect(dashboardAfter.totalSilver).toBeCloseTo(expectedSilver, 4);
        }
      );

    })

})


