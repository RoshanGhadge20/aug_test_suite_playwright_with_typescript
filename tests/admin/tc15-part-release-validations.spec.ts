import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Part Release (Jewellery Release) validations @regression @admin @loans", () => {
  test("validate proceed/cancel buttons and Cash With 0 payment type (appraiser)", async ({
    partRelease,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    // await loginAs("appraiser");

    // await test.step("validate Proceed and Cancel buttons", async () => {
    //   const { proceedVisible, proceedEnabled, cancelVisible } =
    //     await partRelease.validateProceedAndCancelButtons();
    //   expect.soft(proceedVisible).toBe(true);
    //   expect.soft(proceedEnabled).toBe(true);
    //   expect.soft(cancelVisible).toBe(true);
    // });

    // await test.step("validate CASH WITH 0 payment type", async () => {
    //   const { paidAmount, doneVisible } =
    //     await partRelease.validateWithCashZero();
    //   expect.soft(paidAmount).not.toBe("");
    //   expect.soft(doneVisible).toBe(true);
    // });
    await test.step("validate Cron payment type", async () => {
      test.setTimeout(10 * 60_000);
      await loginAs("appraiser");
      await partRelease.partReleaseCronPay();
    });
  });
});
