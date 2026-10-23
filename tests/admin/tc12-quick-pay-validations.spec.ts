import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Quick Pay screen validations @regression @admin @payments", () => {
  test("till date, next due date, cancel, logs, proceed/cancel, and amount validations (appraiser)", async ({
    quickPayment,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");

    // await test.step("validate Amount Till Date functionality", async () => {
    //   const amount = await quickPayment.validateTillDateOption();
    //   expect.soft(amount).not.toBe("");
    // });

    // await test.step("validate Next Due Date functionality", async () => {
    //   const amount = await quickPayment.validateNextDueDateOption();
    //   expect.soft(amount).not.toBe("");
    // });

    // await test.step("validate Cancel button functionality", async () => {
    //   const dismissed = await quickPayment.validateCancelButtonFunctionality();
    //   expect.soft(dismissed).toBe(true);
    // });

    // await test.step("validate View Interest EMI Logs functionality", async () => {
    //   const opened = await quickPayment.validateViewInterestEmiLogsButton();
    //   expect.soft(opened).toBe(true);
    // });

    // await test.step("validate view Transaction History functionality", async () => {
    //   const opened = await quickPayment.validateTransactionHistoryButton();
    //   expect.soft(opened).toBe(true);
    // });

    // await test.step("validate Quick Pay Transaction History functionality", async () => {
    //   const opened =
    //     await quickPayment.validateQuickPayTransactionHistoryButton();
    //   expect.soft(opened).toBe(true);
    // });

    // await test.step("validate Proceed and Cancel buttons", async () => {
    //   const { proceedVisible, proceedEnabled, cancelVisible } =
    //     await quickPayment.validateProceedAndCancelButtons();
    //   expect.soft(proceedVisible).toBe(true);
    //   expect.soft(proceedEnabled).toBe(true);
    //   expect.soft(cancelVisible).toBe(true);
    // });

    // await test.step("validate 0 amount is rejected on Proceed", async () => {
    //   const errorMsg = await quickPayment.validateZeroAmount();
    //   expect.soft(errorMsg).toContain("Amount should be atleast");
    // });

    // await test.step("validate minimum amount (₹10) is accepted", async () => {
    //   const accepted = await quickPayment.validateMinAmountTen();
    //   expect.soft(accepted).toBe(true);
    // });

    // await test.step("validate ₹500 custom amount is accepted", async () => {
    //   const accepted = await quickPayment.validateAmountFiveHundred();
    //   expect.soft(accepted).toBe(true);
    // });

    // await test.step("validate amount over the next-due maximum is rejected", async () => {
    //   const errorMsg = await quickPayment.validateAmountOverMax();
    //   expect
    //     .soft(errorMsg)
    //     .toContain("Please opt for Part Payment option to pay more amount");
    // });
    await test.step("validate crown payment", async () => {
     await quickPayment.quikPaymentsuccessCron();
    });
  });
});
