import { test, expect } from '../../../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../../../utils/data/customer-excel-data';

/**
 * Positive-path coverage for the Home Goal-Based SIP creation flow with **Monthly** frequency,
 * covering both payment rails offered on a Monthly goal SIP. Unlike Daily/Weekly at typical
 * amounts (straight to a UPI QR), confirmed live for Wedding/Special Ones: a Monthly goal SIP
 * first shows a "Set Up Bank Mandate" dialog with an explicit Secure UPI (pre-selected) / Emandate
 * choice, and starts on the 1st of next month.
 *
 * - Secure UPI branch: selecting it still ends on a payment QR code, which needs a phone to scan
 *   and authorize — generating and validating that QR is the automation ceiling for this rail,
 *   same as every other UPI test in this suite.
 * - Emandate branch: fully completable headlessly (demo Aadhaar OTP + Razorpay-style Emandate
 *   authorization) using the same bank/contact test data (`getSipFlowsDataset()`) the plain
 *   SIP-flow specs use, via `paymentPage.completeEmandatePayment` — mirroring `TC_002` in
 *   `tests/customer/sipflow/sip-flows.spec.ts`.
 *
 * Runs on the shared `customer` storage state, same as every other goal-based-sip spec — unlike
 * those, the Emandate test here actually creates a live goal + recurring mandate (UAT sandbox),
 * it does not cancel/abandon at the end.
 */
test.describe('TC_GBSIP_Home_Positive_Monthly @regression @customer @goalwisesip', () => {
  const goalType = 'home';
  const targetYear = 2035;
  const targetBudget = 150_000;
  const frequency = 'Monthly';

  async function walkWizardToBankMandate(
    page: import('@playwright/test').Page,
    goalWiseSipPage: import('../../../../pages/customer/goal-wise-sip.page').GoalWiseSipPage,
    buySummaryPage: import('../../../../pages/customer/buy-summary.page').BuySummaryPage,
    logPrefix: string,
  ): Promise<number> {
    await goalWiseSipPage.selectGoalType(goalType);
    await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/home/i);

    await goalWiseSipPage.setYear(targetYear);
    expect((await goalWiseSipPage.getSliderBounds()).current).toBe(targetYear);
    await goalWiseSipPage.clickStartPlanning();
    await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/home/i);

    await goalWiseSipPage.setBudget(targetBudget);
    expect((await goalWiseSipPage.getSliderBounds()).current).toBe(targetBudget);
    await goalWiseSipPage.clickStartPlanning();
    await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/home/i);

    await goalWiseSipPage.selectFrequency(frequency);
    expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
    const monthlyAmount = await goalWiseSipPage.getComputedSipAmount();
    console.log(`[${logPrefix}] Computed Monthly SIP amount:`, monthlyAmount);
    expect(monthlyAmount).toBeGreaterThan(0);

    await goalWiseSipPage.clickProceedToPay();
    await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

    await expect(page.locator('#sip-information').getByText('Home', { exact: true })).toBeVisible();
    await expect(page.getByText('Monthly', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`₹ ${monthlyAmount}`, { exact: false }).first()).toBeVisible();

    // Confirmed live for Wedding/Special Ones: unlike Daily/Weekly (next calendar day), a
    // Monthly SIP's start date is the 1st of next month.
    const today = new Date();
    const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expectedSipStartDate = `${nextMonthFirst.getFullYear()}-${pad(nextMonthFirst.getMonth() + 1)}-${pad(nextMonthFirst.getDate())}`;
    const actualSipStartDate = await buySummaryPage.getSipStartDate();
    expect(actualSipStartDate).toBe(expectedSipStartDate);

    await buySummaryPage.clickProceedToPay();
    const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
    await expect(bankMandateDialog).toBeVisible({ timeout: 10_000 });

    return monthlyAmount;
  }

  test(
    'TC_GBSIP_Home_Monthly_UPI | Monthly Home goal SIP completes payment via Secure UPI (QR)',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage }) => {
      test.setTimeout(120_000);

      await test.step('Open goal wizard', async () => {
        await goalWiseSipPage.open();
      });

      await test.step('Walk the wizard to the "Set Up Bank Mandate" dialog', async () => {
        await walkWizardToBankMandate(page, goalWiseSipPage, buySummaryPage, 'TC_GBSIP_Home_Monthly_UPI');
      });

      await test.step('Choose Secure UPI and generate the payment QR', async () => {
        const { secureUpi, emandate } = await paymentPage.verifyUpiAndEmandateOptionsVisible();
        console.log('[TC_GBSIP_Home_Monthly_UPI] Set Up Bank Mandate options — Secure UPI visible:', secureUpi, '| Emandate visible:', emandate);
        expect(secureUpi).toBe(true);
        expect(emandate).toBe(true);

        await page.getByRole('button', { name: 'Secure UPI' }).click();

        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_Home_Monthly_UPI] UPI payment QR generated and validated — full authorization needs a phone scan, so this is the automation ceiling for the UPI rail.');
      });

      await test.step('Cleanup — close the QR and the bank-mandate dialog, then cancel', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });

        // The "Set Up Bank Mandate" dialog sits beneath the QR — its mask blocks the summary
        // page's Cancel button until it's closed too (confirmed live for the Wedding/Special
        // Ones Monthly specs).
        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        if (await bankMandateDialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape');
          await bankMandateDialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
        }

        await buySummaryPage.cancelSipFlow();
      });
    },
  );

  test(
    'TC_GBSIP_Home_Monthly_Emandate | Monthly Home goal SIP completes payment via Emandate',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage, addNewBankPage }) => {
      test.setTimeout(180_000);

      const dataset = getSipFlowsDataset();
      const bankDetails = {
        bankName: dataset.BankName,
        accountHolderName: dataset.AccountHolderName,
        accountNumber: dataset.AccountNumber,
        ifscCode: dataset.IFSCCode,
        accountType: dataset.AccountType,
      };

      let goalCountBefore = 0;

      await test.step('Capture existing Home goal count', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        goalCountBefore = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_Emandate] Home goal count before:', goalCountBefore);
      });

      await test.step('Walk the wizard to the "Set Up Bank Mandate" dialog', async () => {
        await walkWizardToBankMandate(page, goalWiseSipPage, buySummaryPage, 'TC_GBSIP_Home_Monthly_Emandate');
      });

      await test.step('Choose Emandate and complete the full bank-mandate payment', async () => {
        const { secureUpi, emandate } = await paymentPage.verifyUpiAndEmandateOptionsVisible();
        console.log('[TC_GBSIP_Home_Monthly_Emandate] Set Up Bank Mandate options — Secure UPI visible:', secureUpi, '| Emandate visible:', emandate);
        expect(secureUpi).toBe(true);
        expect(emandate).toBe(true);

        await paymentPage.clickEmandate();

        const hasExistingBank = await paymentPage.selectBankOrAddNew();
        console.log('[TC_GBSIP_Home_Monthly_Emandate] Existing saved bank found:', hasExistingBank);
        if (!hasExistingBank) {
          await addNewBankPage.fillAndSubmitBankForm(bankDetails);
        }
        await paymentPage.clickPayButton();
        await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
        console.log('[TC_GBSIP_Home_Monthly_Emandate] Emandate payment completed — redirected to dashboard.');
      });

      await test.step('A new Home goal now exists', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        const goalCountAfter = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Monthly_Emandate] Home goal count after:', goalCountAfter, '(before:', goalCountBefore, ')');
        expect(goalCountAfter).toBe(goalCountBefore + 1);
      });
    },
  );
});
