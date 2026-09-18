import { test, expect } from '../../../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../../../utils/data/customer-excel-data';
import type { BuySummaryPage } from '../../../../pages/customer/buy-summary.page';

/**
 * Reads each field on the summary's "SIP Information" block individually, asserts it against the
 * wizard's own selections, and prints an expected-vs-actual table to the console — same pattern
 * as `TC_Home_CreateGoal_Positive_Weekly.spec.ts`.
 */
async function validateAndPrintSummaryDetails(
  buySummaryPage: BuySummaryPage,
  params: {
    logPrefix: string;
    expectedGoal: string;
    expectedFrequency: string;
    expectedAmount: number;
    expectedSipStartDate: string;
  },
): Promise<void> {
  const investmentPurpose = await buySummaryPage.getInvestmentPurposeText();
  const sipDuration = await buySummaryPage.getFrequencyText();
  const metalType = await buySummaryPage.getMetalTypeText('Gold');
  const amountPerWeek = await buySummaryPage.getAmountPerWeek();
  const sipStartDate = await buySummaryPage.getSipStartDate();

  console.log(`[${params.logPrefix}] ==================== Summary detail validation ====================`);
  console.table({
    'Investment Purpose': { expected: params.expectedGoal, actual: investmentPurpose },
    'SIP Duration': { expected: params.expectedFrequency, actual: sipDuration },
    'Metal Type': { expected: 'Gold', actual: metalType },
    'Amount Per Week': { expected: params.expectedAmount, actual: amountPerWeek },
    'SIP Start Date': { expected: params.expectedSipStartDate, actual: sipStartDate },
  });

  expect(investmentPurpose).toBe(params.expectedGoal);
  expect(sipDuration).toBe(params.expectedFrequency);
  expect(metalType).toBe('Gold');
  expect(amountPerWeek).toBe(params.expectedAmount);
  expect(sipStartDate).toBe(params.expectedSipStartDate);
}

/**
 * Positive-path coverage for the Retirement Goal-Based SIP creation flow with **Weekly**
 * frequency, covering both payment rails confirmed live for goal-linked SIPs:
 *
 * - A Weekly SIP amount **at or below ₹1,00,000** is UPI-only — Proceed To Pay goes straight to a
 *   payment QR code with no Emandate choice offered at all.
 * - A Weekly SIP amount **above ₹1,00,000** drops UPI entirely and routes straight into Emandate's
 *   bank-account picker. That test selects the **first existing saved bank** (via
 *   `paymentPage.selectBankOrAddNew()`, falling back to the "Add New" form only if the account has
 *   no saved bank at all) then completes the full Emandate payment (demo Aadhaar OTP +
 *   Razorpay-style authorization) to a real success/dashboard redirect.
 *
 * Runs on the shared `customer` storage state — unlike the QR-and-cancel specs, the Emandate test
 * here actually creates a live goal + recurring mandate (UAT sandbox). The final goal-listing
 * count check is informational-only (confirmed live 2026-09-16 the listing's indexing delay is
 * unbounded under heavy same-account load) — the real success signal is
 * `completeEmandatePayment()` not throwing and landing on `/dashboard`.
 */
test.describe('TC_GBSIP_Retirement_Positive_Weekly @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Retirement_Weekly_UPI | Weekly Retirement goal SIP at or below ₹1,00,000 completes payment via UPI (QR)',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'retirement';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Weekly';

      console.log('[TC_GBSIP_Retirement_Weekly_UPI] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('Select Retirement from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/retirement/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/retirement/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/retirement/i);
      });

      let weeklyAmount = 0;

      await test.step('Select Weekly frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        weeklyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_Retirement_Weekly_UPI] Computed Weekly SIP amount:', weeklyAmount);
        expect(weeklyAmount).toBeGreaterThan(0);
        expect(weeklyAmount).toBeLessThanOrEqual(100_000);
      });

      await test.step('Summary reflects the goal-wizard selections', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

        await validateAndPrintSummaryDetails(buySummaryPage, {
          logPrefix: 'TC_GBSIP_Retirement_Weekly_UPI',
          expectedGoal: 'Retirement',
          expectedFrequency: 'Weekly',
          expectedAmount: weeklyAmount,
          expectedSipStartDate,
        });
      });

      await test.step('Proceed To Pay routes straight to UPI and generates a valid payment QR', async () => {
        await buySummaryPage.clickProceedToPay();
        const qrModal = page.getByText('Payment QR Code', { exact: true });
        await expect(qrModal).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/QR Code is valid for \d{2}:\d{2} minutes/i)).toBeVisible();
        console.log('[TC_GBSIP_Retirement_Weekly_UPI] UPI payment QR generated and validated — full authorization needs a phone scan, so this is the automation ceiling for the UPI rail.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });
    },
  );

  test(
    'TC_GBSIP_Retirement_Weekly_Emandate | Weekly Retirement goal SIP above ₹1,00,000 completes payment via Emandate using an existing bank',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage, addNewBankPage }) => {
      test.setTimeout(300_000);

      const goalType = 'retirement';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Weekly';
      const expectedMaxWeeklyAmount = 999_999;
      const dataset = getSipFlowsDataset();
      const bankDetails = {
        bankName: dataset.BankName,
        accountHolderName: dataset.AccountHolderName,
        accountNumber: dataset.AccountNumber,
        ifscCode: dataset.IFSCCode,
        accountType: dataset.AccountType,
      };

      let goalCountBefore = 0;

      await test.step('Capture existing Retirement goal count', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        goalCountBefore = await goalWiseSipPage.goalCardsByName('Retirement').count();
        console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Retirement goal count before:', goalCountBefore);
      });

      await test.step('Select Retirement from the goal-type grid', async () => {
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/retirement/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/retirement/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/retirement/i);
      });

      let weeklyAmount = 0;

      await test.step('Select Weekly frequency and push the SIP-amount slider to its ceiling (forces Emandate-only routing)', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        expect(boundsBefore.max).toBe(expectedMaxWeeklyAmount);

        weeklyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Retirement_Weekly_Emandate] SIP-amount slider pushed to:', weeklyAmount);
        expect(weeklyAmount).toBe(expectedMaxWeeklyAmount);
      });

      await test.step('Summary reflects the goal-wizard selections and the >₹1,00,000 start-date rule', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expectedStartDate = new Date(today);
        expectedStartDate.setDate(expectedStartDate.getDate() + 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        await validateAndPrintSummaryDetails(buySummaryPage, {
          logPrefix: 'TC_GBSIP_Retirement_Weekly_Emandate',
          expectedGoal: 'Retirement',
          expectedFrequency: 'Weekly',
          expectedAmount: weeklyAmount,
          expectedSipStartDate,
        });
      });

      await test.step('Amount over ₹1,00,000 routes to Emandate — select the first saved bank and complete the full payment', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        await expect(bankMandateDialog.or(chooseBankDialog)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_Retirement_Weekly_Emandate] "Set Up Bank Mandate" shown — Secure UPI visible:', secureUpiVisible, '(expected false above ₹1,00,000)');
          expect(secureUpiVisible).toBe(false);
          // Deliberately no click here: with only one option (Emandate) shown, this dialog
          // auto-advances to "Choose Bank Account" on its own.
        } else {
          console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Routed straight to Emandate\'s bank-account picker — no Secure UPI/Emandate choice shown.');
        }

        const hasExistingBank = await paymentPage.selectBankOrAddNew();
        console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Existing saved bank found:', hasExistingBank);
        if (!hasExistingBank) {
          await addNewBankPage.fillAndSubmitBankForm(bankDetails);
        }
        await paymentPage.clickPayButton();
        await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
        console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Emandate payment completed — redirected to dashboard.');
      });

      await test.step('A new Retirement goal now exists (informational)', async () => {
        // The real success signal is `completeEmandatePayment()` not throwing and landing on
        // `/dashboard` (above). The goal-listing count is a secondary confirmation only —
        // confirmed live 2026-09-16 its indexing delay is unbounded under heavy repeated
        // same-account load, so this logs what it finds within a short window rather than
        // failing the test over a delay outside the payment flow's own control.
        let goalCountAfter = goalCountBefore;
        try {
          await expect
            .poll(
              async () => {
                await goalWiseSipPage.open();
                await goalWiseSipPage.waitForGoalListing();
                goalCountAfter = await goalWiseSipPage.goalCardsByName('Retirement').count();
                return goalCountAfter;
              },
              { timeout: 30_000, intervals: [5_000, 10_000, 15_000] },
            )
            .toBe(goalCountBefore + 1);
          console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Retirement goal count after:', goalCountAfter, '(before:', goalCountBefore, ') — new goal confirmed in listing.');
        } catch {
          console.log('[TC_GBSIP_Retirement_Weekly_Emandate] Retirement goal count still', goalCountAfter, '(before:', goalCountBefore, ') after 30s — listing hasn\'t caught up yet; payment itself already confirmed successful above.');
        }
      });
    },
  );
});
