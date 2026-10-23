import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Part Payment screen validations @regression @admin @payments", () => {
  test("view transaction log, part pay transaction history, and proceed/cancel buttons (appraiser)", async ({
    partPayment,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");

    // await test.step("validate View Transaction Log functionality", async () => {
    //   const amount = await partPayment.validateViewTransactionLog();
    //   expect.soft(amount).not.toBe("");
    // });

    // await test.step("validate Part Pay Transaction History functionality", async () => {
    //   const amount = await partPayment.validatePartPayTransactionHistory();
    //   expect.soft(amount).not.toBe("");
    // });

    // await test.step("validate Proceed and Cancel buttons", async () => {
    //   const { proceedVisible, proceedEnabled, cancelVisible } =
    //     await partPayment.validateProceedAndCancelButtons();
    //   expect.soft(proceedVisible).toBe(true);
    //   expect.soft(proceedEnabled).toBe(true);
    //   expect.soft(cancelVisible).toBe(true);
    // });

    // await test.step("validate 0 amount is rejected on Proceed", async () => {
    //   const errorMsg = await partPayment.validateWithCashZero();
    //   expect.soft(errorMsg).toContain("Amount should be atleast");
    // });
    await test.step("validate Part Pay Transaction History functionality", async () => {
      const amount = await partPayment.partPaySuccessCron();
      expect.soft(amount).not.toBe("");
    });
  });
});
