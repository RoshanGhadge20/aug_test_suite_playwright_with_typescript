import { test, expect } from '../../../fixtures/base.fixture';

/**
 * End-to-end withdrawal coverage for a goal's linked SIP, entered via the goal card's own
 * "Withdraw" button rather than the dashboard's general Withdraw entry point.
 *
 * Confirmed live 2026-09-17: clicking "Withdraw" on a goal card navigates straight to
 * `/withdraw/investment-list` — the exact same screen `WithdrawalPage.clickGetCashOption()`
 * reaches from the dashboard, skipping the "Choose Withdrawal Option" (Get Cash / Get Coins and
 * Bars) dialog entirely. The goal's linked SIP appears there as a "SIP Plan: {goal name}" card
 * alongside Gold Vault and every other SIP, so it must be located by name
 * (`Withdrawsip.selectSipForWithdrawalByName`) rather than assumed to be the first/only one —
 * the account carries several unrelated SIPs (other goals, plain SIPs, Gold Vault) on the same
 * screen. From there this test follows the exact same flow already established and passing in
 * `tests/customer/withdrawal/GetCash/TC_Withdrawal_GetCash_003_AT_3604.spec.ts` (partial Gold SIP
 * withdrawal to UPI): select Gold tab, proceed, enter a partial quantity, choose UPI, confirm,
 * validate the success popup, and validate the dashboard's Total Gold (g) afterward.
 */
test.describe('TC_GoalWiseSip_Withdrawal @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_WD_001 | Withdraw from an Approved goal\'s linked SIP via the goal card\'s Withdraw button',
    async ({
      page,
      dashboardPage,
      goalWiseSipPage,
      withdrawalPage,
      withdrawDetailPage,
      withdrawAccountDetailPage,
      withdrawPamentPage,
      withdrawsipPage,
    }) => {
      test.setTimeout(120_000);

      const withdrawalQuantityInput = 0.1;
      let totalGoldBefore = 0;
      let goalName = '';
      let selectedSipName = '';
      let metalPrice = 0;

      await test.step('Dashboard — capture total gold (g) before withdrawal', async () => {
        await page.goto('/dashboard');
        const snapshot = await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false });
        totalGoldBefore = snapshot.totalGold;
        console.log('[TC_GBSIP_WD_001] Total gold on dashboard before (g):', totalGoldBefore);
      });

      await test.step('Goal Wise SIP — find an Approved goal with saved value > 0, paginating forward if needed', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();

        const card = await goalWiseSipPage.findApprovedGoalCardWithSavedValue();
        if (!card) {
          throw new Error(
            'No Approved goal SIP with saved value greater than 0 is available for withdrawal.',
          );
        }

        const details = await goalWiseSipPage.getGoalCardDetails(card);
        goalName = details.name;
        console.log(
          `[TC_GBSIP_WD_001] Approved goal with saved > 0 — name: ${goalName} | saved: ₹${details.savedAmount} | ` +
            `target: ₹${details.targetAmount} | status: ${details.status}`,
        );
        expect(details.status.trim()).toBe('Approved');
        expect(details.savedAmount).toBeGreaterThan(0);

        await goalWiseSipPage.clickWithdraw(card);
        await expect(page).toHaveURL(/\/withdraw\/investment-list/i);
      });

      await test.step('Investment list — select Gold tab and validate the Gold summary', async () => {
        await withdrawDetailPage.clickGoldTab();
        const goldSummary = await withdrawalPage.getMetalSummary('Gold');
        expect(goldSummary.value).toBeCloseTo(goldSummary.total * goldSummary.livePrice, 1);
      });

      await test.step('Investment list — search for the goal\'s own SIP Plan card by name', async () => {
        const goalSip = await withdrawsipPage.selectSipForWithdrawalByName(goalName, withdrawalQuantityInput);
        console.log('[TC_GBSIP_WD_001] Selected SIP:', goalSip);
        selectedSipName = goalSip.sipName;
      });

      await test.step('Proceed for withdrawal', async () => {
        await withdrawalPage.clickProceed();

        const withdrawalSummary = await withdrawDetailPage.getWithdrawalSummary('Gold');
        if (withdrawalQuantityInput > withdrawalSummary.totalMetal) {
          throw new Error(
            `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`,
          );
        }

        await withdrawDetailPage.enterWithdrawalQuantity(withdrawalQuantityInput);
        await withdrawDetailPage.clickWithdraw();

        await expect(page).toHaveURL(/\/withdraw\/account-details$/);
      });

      await test.step('Select UPI and validate account details', async () => {
        const accountDetails = await withdrawAccountDetailPage.getAccountDetails();
        expect(accountDetails.withdrawalFrom).toContain(selectedSipName);
        expect(accountDetails.quantity).toBe(withdrawalQuantityInput);

        await withdrawAccountDetailPage.validateTransferOptions();
        await withdrawAccountDetailPage.clickUPI();
        const selectedUpi = await withdrawAccountDetailPage.selectUpi();
        console.log('[TC_GBSIP_WD_001] Selected UPI:', selectedUpi);

        await withdrawAccountDetailPage.validateCounter();

        metalPrice = await withdrawAccountDetailPage.getLivePriceValue('Gold');

        await withdrawDetailPage.clickWithdraw();
      });

      await test.step('Confirm withdrawal', async () => {
        await withdrawAccountDetailPage.validateWithdrawAndCancelOptions();
        await withdrawAccountDetailPage.withdrawButtonClick();
      });

      await test.step('Validate success popup', async () => {
        await withdrawPamentPage.validateSuccessPopup();
        await withdrawPamentPage.validateSuccessPopupDetails(withdrawalQuantityInput, metalPrice, 'Gold');
        await withdrawPamentPage.clickContinue();
      });

      await test.step('Dashboard — validate total gold (g) after withdrawal', async () => {
        await page.goto('/dashboard');
        const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false });

        const expectedGold = Number((totalGoldBefore - withdrawalQuantityInput).toFixed(4));
        console.log(
          `[TC_GBSIP_WD_001] Total gold after (g): ${dashboardAfter.totalGold} | expected: ${expectedGold}`,
        );
        expect(dashboardAfter.totalGold).toBeCloseTo(expectedGold, 4);
      });
    },
  );
});
