import { test, expect } from '../../../../../fixtures/base.fixture';

/**
 * Negative-path coverage for the "Special Ones" Goal-Based SIP creation flow.
 *
 * Step 1 ("When is the special day?") is a `p-datepicker` text input, not a slider — it exposes
 * no ARIA min/max the way a slider does, so no date-range boundary is asserted here. Instead this
 * confirms the calendar can actually be driven to pick a specific date (via `setSpecialDate()`,
 * the same PrimeNG widget `setPrimeCalendarDate` drives for KYC/profile DOB fields) and that the
 * chosen date carries through to the input.
 *
 * From the budget step onward this reuses the same `p-slider` boundary-test approach used
 * elsewhere in this suite (read live ARIA bounds, confirm the floor guard).
 *
 * Uses the shared `customer` storage state.
 */
test.describe('TC_GBSIP_SpecialOnes_Negative @regression @customer @goalwisesip', () => {
  test('TC_GBSIP_SpecialOnes_002 | Special Ones date step accepts a picked date from the calendar', async ({
    page,
    goalWiseSipPage,
  }) => {
    const specialDate = { day: 20, month: 9, year: 2029 };

    await test.step('Open Special Ones date step', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('specialOnes');
      await expect(page).toHaveURL(/\/goal-wise-sip\/select-date\/special-ones/i);
    });

    await test.step('Pick a specific date via the calendar picker', async () => {
      await goalWiseSipPage.setSpecialDate(specialDate);
      const dateValue = await goalWiseSipPage.getSpecialDateValue();
      console.log('[TC_GBSIP_SpecialOnes_002] Special date selected:', dateValue);
      expect(dateValue).toContain(String(specialDate.year));
    });

    await test.step('"Select amount" proceeds with the picked date', async () => {
      await goalWiseSipPage.clickSelectAmount();
      await expect(page).toHaveURL(/\/goal-wise-sip\/select-amount\/special-ones/i);
    });
  });

  test('TC_GBSIP_SpecialOnes_004_005 | Special Ones budget selector range is exactly ₹1,00,000 – ₹1,00,00,000', async ({
    page,
    goalWiseSipPage,
  }) => {
    await test.step('Open Special Ones budget step', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('specialOnes');
      await goalWiseSipPage.setSpecialDate({ day: 10, month: 3, year: 2029 });
      await goalWiseSipPage.clickSelectAmount();
    });

    let bounds = { min: 0, max: 0, current: 0 };

    await test.step('Slider ARIA bounds match ₹1,00,000 min / ₹1,00,00,000 max', async () => {
      bounds = await goalWiseSipPage.getSliderBounds();
      console.log('[TC_GBSIP_SpecialOnes_004_005] Budget slider bounds:', bounds);
      expect(bounds.min).toBe(100_000);
      expect(bounds.max).toBe(10_000_000);
    });

    await test.step('A small "-" run moves the value down without going below the floor', async () => {
      const before = (await goalWiseSipPage.getSliderBounds()).current;
      const afterFloorAttempt = await goalWiseSipPage.pushToFloor(5);
      console.log('[TC_GBSIP_SpecialOnes_004_005] Budget before/after 5x "-":', before, afterFloorAttempt);
      expect(afterFloorAttempt).toBeLessThan(before);
      expect(afterFloorAttempt).toBeGreaterThanOrEqual(bounds.min);
    });
  });

  test('TC_GBSIP_SpecialOnes_010 | Abandoning payment creates no Special Ones goal', async ({
    page,
    goalWiseSipPage,
    buySummaryPage,
  }) => {
    const goalName = 'Special Ones';
    let countBefore = 0;

    await test.step('Capture existing Special Ones goal count', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      countBefore = await goalWiseSipPage.goalCardsByName(goalName).count();
      console.log('[TC_GBSIP_SpecialOnes_010] Special Ones goal count before:', countBefore);
    });

    await test.step('Walk through goal creation to the payment summary', async () => {
      await goalWiseSipPage.selectGoalType('specialOnes');
      await goalWiseSipPage.setSpecialDate({ day: 5, month: 11, year: 2028 });
      await goalWiseSipPage.clickSelectAmount();
      await goalWiseSipPage.setBudget(200_000);
      await goalWiseSipPage.clickStartPlanning();
      await goalWiseSipPage.selectFrequency('Daily');
      await goalWiseSipPage.clickProceedToPay();
      await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);
    });

    await test.step('Abandon via Cancel instead of paying', async () => {
      await buySummaryPage.cancelSipFlow();
    });

    await test.step('No new Special Ones goal was created', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      const countAfter = await goalWiseSipPage.goalCardsByName(goalName).count();
      console.log('[TC_GBSIP_SpecialOnes_010] Special Ones goal count after:', countAfter);
      expect(countAfter).toBe(countBefore);
    });
  });
});
