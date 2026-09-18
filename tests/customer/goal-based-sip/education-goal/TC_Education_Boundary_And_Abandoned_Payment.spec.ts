import { test, expect } from '../../../../fixtures/base.fixture';

/**
 * Negative-path coverage for the Education Goal-Based SIP creation flow (GBSIP-001), mirroring
 * `TC_Wedding_Boundary_And_Abandoned_Payment.spec.ts` / `TC_Home_Boundary_And_Abandoned_Payment.spec.ts`
 * against `tests/customer/Goal-Based SIP Test Plan.md` TC_GBSIP_002/004/005/010.
 *
 * Uses the shared `customer` storage state (not a fresh registration) — goal tracking is
 * meaningless without the account's existing investment history, matching this repo's other SIP
 * flow specs (`tests/customer/sipflow/sip-flows.spec.ts`) rather than the KYC/registration specs'
 * always-blank-storageState pattern.
 */
test.describe('TC_GBSIP_Education_Negative @regression @customer @goalwisesip', () => {
  test('TC_GBSIP_Education_002 | Education year selector clamps to 2030-2050', async ({ page, goalWiseSipPage }) => {
    await test.step('Open Education year step', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('education');
    });

    await test.step('Slider ARIA bounds match the CR (2030-2050)', async () => {
      const bounds = await goalWiseSipPage.getSliderBounds();
      console.log('[TC_GBSIP_Education_002] Year slider bounds:', bounds);
      expect(bounds.min).toBe(2030);
      expect(bounds.max).toBe(2050);
    });

    await test.step('"-" clamps at the floor (2030), does not go below', async () => {
      const floor = await goalWiseSipPage.pushToFloor(30);
      console.log('[TC_GBSIP_Education_002] Year after pushing to floor:', floor);
      expect(floor).toBe(2030);
    });

    await test.step('"+" clamps at the ceiling (2050), does not go above', async () => {
      const ceiling = await goalWiseSipPage.pushToCeiling(30);
      console.log('[TC_GBSIP_Education_002] Year after pushing to ceiling:', ceiling);
      expect(ceiling).toBe(2050);
    });
  });

  test('TC_GBSIP_Education_004_005 | Education budget selector range matches the CR (₹1,00,000 – ₹1,00,00,000)', async ({
    page,
    goalWiseSipPage,
  }) => {
    await test.step('Open Education budget step', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.selectGoalType('education');
      await goalWiseSipPage.setYear(2035);
      await goalWiseSipPage.clickStartPlanning();
    });

    await test.step('Slider ARIA bounds match the CR (₹1,00,000 min / ₹1,00,00,000 max)', async () => {
      const bounds = await goalWiseSipPage.getSliderBounds();
      console.log('[TC_GBSIP_Education_004_005] Budget slider bounds:', bounds);
      expect(bounds.min).toBe(100_000);
      expect(bounds.max).toBe(10_000_000);
    });

    await test.step('A small "-" run moves the value down without going below the floor', async () => {
      const before = (await goalWiseSipPage.getSliderBounds()).current;
      const afterFloorAttempt = await goalWiseSipPage.pushToFloor(5);
      console.log('[TC_GBSIP_Education_004_005] Budget before/after 5x "-":', before, afterFloorAttempt);
      expect(afterFloorAttempt).toBeLessThan(before);
      expect(afterFloorAttempt).toBeGreaterThanOrEqual(100_000);
    });
  });

  test('TC_GBSIP_Education_010 | Abandoning payment creates no Education goal', async ({
    page,
    goalWiseSipPage,
    buySummaryPage,
  }) => {
    let educationCountBefore = 0;

    await test.step('Capture existing Education goal count', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      educationCountBefore = await goalWiseSipPage.goalCardsByName('Education').count();
      console.log('[TC_GBSIP_Education_010] Education goal count before:', educationCountBefore);
    });

    await test.step('Walk through goal creation to the payment summary', async () => {
      await goalWiseSipPage.selectGoalType('education');
      await goalWiseSipPage.setYear(2035);
      await goalWiseSipPage.clickStartPlanning();
      await goalWiseSipPage.setBudget(150_000);
      await goalWiseSipPage.clickStartPlanning();
      await goalWiseSipPage.selectFrequency('Daily');
      await goalWiseSipPage.clickProceedToPay();
      await expect(page).toHaveURL(/digital-gold\/buy\/summary/i);
    });

    await test.step('Abandon via Cancel instead of paying', async () => {
      await buySummaryPage.cancelSipFlow();
    });

    await test.step('No new Education goal was created', async () => {
      await goalWiseSipPage.open();
      await goalWiseSipPage.waitForGoalListing();
      const educationCountAfter = await goalWiseSipPage.goalCardsByName('Education').count();
      console.log('[TC_GBSIP_Education_010] Education goal count after:', educationCountAfter);
      expect(educationCountAfter).toBe(educationCountBefore);
    });
  });
});
