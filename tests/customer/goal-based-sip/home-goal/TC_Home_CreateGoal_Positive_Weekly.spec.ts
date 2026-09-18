import { test, expect } from '../../../../fixtures/base.fixture';
import { getSipFlowsDataset } from '../../../../utils/data/customer-excel-data';
import type { BuySummaryPage } from '../../../../pages/customer/buy-summary.page';

/**
 * Reads each field on the summary's "SIP Information" block individually (rather than the coarse
 * "is this text visible anywhere" checks the other goal-based-sip specs use), asserts it against
 * the wizard's own selections, and prints an expected-vs-actual table to the console.
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
 * Positive-path coverage for the Home Goal-Based SIP creation flow with **Weekly** frequency,
 * covering both payment rails confirmed live for goal-linked SIPs (see
 * `tests/customer/Goal-Based SIP Test Plan.md` and the sibling
 * `TC_Wedding_Weekly_MaxAmount.spec.ts`, which first established the amount-based routing rule):
 *
 * - A Weekly SIP amount **at or below ₹1,00,000** is UPI-only — Proceed To Pay goes straight to a
 *   payment QR code with no Emandate choice offered at all. A QR requires a phone to scan and
 *   authorize, so "complete via UPI" here means generating and validating that QR — the actual
 *   automation ceiling for this rail, same as every other UPI test in this suite.
 * - A Weekly SIP amount **above ₹1,00,000** flips the other way: UPI is dropped entirely and the
 *   flow routes straight into Emandate's bank-account picker. That IS fully completable headlessly
 *   (demo Aadhaar OTP + Razorpay-style Emandate authorization), so that test runs the whole thing
 *   to a real success/dashboard redirect using the same bank/contact test data
 *   (`getSipFlowsDataset()`) the plain SIP-flow specs use, via `paymentPage.completeEmandatePayment`
 *   after adding/selecting a bank — mirroring `TC_002` in `tests/customer/sipflow/sip-flows.spec.ts`.
 *
 * Runs on the shared `customer` storage state, same as every other goal-based-sip spec — unlike
 * those, the Emandate test here actually creates a live goal + recurring mandate (UAT sandbox),
 * it does not cancel/abandon at the end.
 */
test.describe('TC_GBSIP_Home_Positive_Weekly @regression @customer @goalwisesip', () => {
  test(
    'TC_GBSIP_Home_Weekly_UPI | Weekly Home goal SIP at or below ₹1,00,000 completes payment via UPI (QR)',
    async ({ page, goalWiseSipPage, buySummaryPage }) => {
      test.setTimeout(120_000);

      const goalType = 'home';
      const targetYear = 2035;
      const targetBudget = 150_000;
      const frequency = 'Weekly';

      console.log('[TC_GBSIP_Home_Weekly_UPI] Input data — goalType:', goalType, '| targetYear:', targetYear, '| targetBudget:', targetBudget, '| frequency:', frequency);

      await test.step('Select Home from the goal-type grid', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/home/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/home/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/home/i);
      });

      let weeklyAmount = 0;

      await test.step('Select Weekly frequency and read the computed SIP amount', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);
        weeklyAmount = await goalWiseSipPage.getComputedSipAmount();
        console.log('[TC_GBSIP_Home_Weekly_UPI] Computed Weekly SIP amount:', weeklyAmount);
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
          logPrefix: 'TC_GBSIP_Home_Weekly_UPI',
          expectedGoal: 'Home',
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
        console.log('[TC_GBSIP_Home_Weekly_UPI] UPI payment QR generated and validated — full authorization needs a phone scan, so this is the automation ceiling for the UPI rail.');
      });

      await test.step('Cleanup — close the QR and cancel rather than leaving a stray pending payment', async () => {
        await page.keyboard.press('Escape');
        await expect(page.getByText('Payment QR Code', { exact: true })).toBeHidden({ timeout: 10_000 });
        await buySummaryPage.cancelSipFlow();
      });
    },
  );

  test(
    'TC_GBSIP_Home_Weekly_Emandate | Weekly Home goal SIP above ₹1,00,000 completes payment via Emandate',
    async ({ page, goalWiseSipPage, buySummaryPage, paymentPage, addNewBankPage }) => {
      test.setTimeout(180_000);

      const goalType = 'home';
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

      await test.step('Capture existing Home goal count', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        goalCountBefore = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Weekly_Emandate] Home goal count before:', goalCountBefore);
      });

      await test.step('Select Home from the goal-type grid', async () => {
        await goalWiseSipPage.selectGoalType(goalType);
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-year\/home/i);
      });

      await test.step('Select a valid year within 2030-2050', async () => {
        await goalWiseSipPage.setYear(targetYear);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetYear);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/home/i);
      });

      await test.step('Select a valid budget within ₹1,00,000-₹1,00,00,000', async () => {
        await goalWiseSipPage.setBudget(targetBudget);
        const { current } = await goalWiseSipPage.getSliderBounds();
        expect(current).toBe(targetBudget);
        await goalWiseSipPage.clickStartPlanning();
        await expect(page).toHaveURL(/\/goal-wise-sip\/select-investment-type\/home/i);
      });

      let weeklyAmount = 0;

      await test.step('Select Weekly frequency and push the SIP-amount slider to its ceiling (forces Emandate-only routing)', async () => {
        await goalWiseSipPage.selectFrequency(frequency);
        expect(await goalWiseSipPage.getSelectedFrequency()).toBe(frequency);

        const boundsBefore = await goalWiseSipPage.getSliderBounds();
        expect(boundsBefore.max).toBe(expectedMaxWeeklyAmount);

        weeklyAmount = await goalWiseSipPage.jumpSliderToCeiling();
        console.log('[TC_GBSIP_Home_Weekly_Emandate] SIP-amount slider pushed to:', weeklyAmount);
        expect(weeklyAmount).toBe(expectedMaxWeeklyAmount);
      });

      await test.step('Summary reflects the goal-wizard selections and the >₹1,00,000 start-date rule', async () => {
        await goalWiseSipPage.clickProceedToPay();
        await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);

        // Confirmed live for Wedding: a Weekly SIP amount over ₹1,00,000 starts 5 calendar days
        // out instead of "tomorrow" — a payment-gateway rule, not goal-type-specific.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expectedStartDate = new Date(today);
        expectedStartDate.setDate(expectedStartDate.getDate() + 5);
        const pad = (n: number) => String(n).padStart(2, '0');
        const expectedSipStartDate = `${expectedStartDate.getFullYear()}-${pad(expectedStartDate.getMonth() + 1)}-${pad(expectedStartDate.getDate())}`;

        await validateAndPrintSummaryDetails(buySummaryPage, {
          logPrefix: 'TC_GBSIP_Home_Weekly_Emandate',
          expectedGoal: 'Home',
          expectedFrequency: 'Weekly',
          expectedAmount: weeklyAmount,
          expectedSipStartDate,
        });
      });

      await test.step('Amount over ₹1,00,000 routes to Emandate — complete the full bank-mandate payment', async () => {
        await buySummaryPage.clickProceedToPay();

        const bankMandateDialog = page.getByRole('dialog', { name: 'Set Up Bank Mandate' });
        const chooseBankDialog = page.getByRole('dialog', { name: 'Choose Bank Account' });
        await expect(bankMandateDialog.or(chooseBankDialog)).toBeVisible({ timeout: 15_000 });

        if (await bankMandateDialog.isVisible().catch(() => false)) {
          const secureUpiVisible = await page.getByRole('button', { name: 'Secure UPI' }).isVisible({ timeout: 2_000 }).catch(() => false);
          console.log('[TC_GBSIP_Home_Weekly_Emandate] "Set Up Bank Mandate" shown — Secure UPI visible:', secureUpiVisible, '(expected false above ₹1,00,000)');
          expect(secureUpiVisible).toBe(false);
          // Deliberately no click here: with only one option (Emandate) shown, this dialog
          // auto-advances to "Choose Bank Account" on its own — confirmed live via
          // TC_Wedding_Weekly_MaxAmount.spec.ts. Clicking the Emandate button races against that
          // auto-transition and fails with "element detached from the DOM".
        } else {
          console.log('[TC_GBSIP_Home_Weekly_Emandate] Routed straight to Emandate\'s bank-account picker — no Secure UPI/Emandate choice shown.');
        }

        const hasExistingBank = await paymentPage.selectBankOrAddNew();
        console.log('[TC_GBSIP_Home_Weekly_Emandate] Existing saved bank found:', hasExistingBank);
        if (!hasExistingBank) {
          await addNewBankPage.fillAndSubmitBankForm(bankDetails);
        }
        await paymentPage.clickPayButton();
        await paymentPage.completeEmandatePayment(dataset.ContactNumber, dataset.EmandateBankName);
        console.log('[TC_GBSIP_Home_Weekly_Emandate] Emandate payment completed — redirected to dashboard.');
      });

      await test.step('A new Home goal now exists', async () => {
        await goalWiseSipPage.open();
        await goalWiseSipPage.waitForGoalListing();
        const goalCountAfter = await goalWiseSipPage.goalCardsByName('Home').count();
        console.log('[TC_GBSIP_Home_Weekly_Emandate] Home goal count after:', goalCountAfter, '(before:', goalCountBefore, ')');
        expect(goalCountAfter).toBe(goalCountBefore + 1);
      });
    },
  );
});
