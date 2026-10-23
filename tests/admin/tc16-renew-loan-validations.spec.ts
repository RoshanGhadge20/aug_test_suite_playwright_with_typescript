import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Renew Loan validations @regression @admin @loans", () => {
  test("validate proceed/cancel buttons, Cash With 0, and offline (RTGS) payment type (appraiser)", async ({
    renewLoan,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");

    // await test.step("validate Proceed and Cancel buttons", async () => {
    //   const { proceedVisible, proceedEnabled, cancelVisible } =
    //     await renewLoan.validateProceedAndCancelButtons();
    //   expect.soft(proceedVisible).toBe(true);
    //   expect.soft(proceedEnabled).toBe(true);
    //   expect.soft(cancelVisible).toBe(true);
    // });

    // await test.step("validate CASH WITH 0 payment type", async () => {
    //   const { doneVisible } = await renewLoan.validateWithCashZero();
    //   expect.soft(doneVisible).toBe(true);
    // });

    // await test.step("validate offline (RTGS) payment type", async () => {
    //   const { bankNameValue, branchNameValue, transactionIdValue, doneVisible } =
    //     await renewLoan.validateWithOffline();
    //   expect.soft(bankNameValue).not.toBe("");
    //   expect.soft(branchNameValue).not.toBe("");
    //   expect.soft(transactionIdValue).not.toBe("");
    //   expect.soft(doneVisible).toBe(true);
    // });
    //  await test.step("validate CASH WITH Cron payment type", async () => {
    //    await renewLoan.renewCronPay();

    //  });

    // Cancel path first: it's non-mutating (no OTP sent, nothing submitted), so it won't
    // consume the loan's renewal eligibility the way the accept path below does.
    await test.step("validate Confirm Renewal consent modal — Cancel path", async () => {
      const result = await renewLoan.verifyCancelRenewalConsentModal();

      expect
        .soft(
          result.modalOpened,
          "'Confirm Renewal' consent modal should open after the renewal scheme/payment Confirm click",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Renewal' checkbox should end up checked",
        )
        .toBe(true);
      expect
        .soft(
          result.revisedTermsCheckboxChecked,
          "'agrees to the revised rate, charges and tenure' checkbox should end up checked",
        )
        .toBe(true);
      expect
        .soft(
          result.modalClosedAfterCancel,
          "the consent modal should close after clicking Cancel, without sending an OTP",
        )
        .toBe(true);
    });

    await test.step("validate Confirm Renewal consent modal — accept path", async () => {
      const result = await renewLoan.verifyConfirmRenewalConsentModal();

      expect
        .soft(
          result.modalOpened,
          "'Confirm Renewal' consent modal should open after the renewal scheme/payment Confirm click",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Renewal' checkbox should end up checked",
        )
        .toBe(true);
      expect
        .soft(
          result.revisedTermsCheckboxChecked,
          "'agrees to the revised rate, charges and tenure' checkbox should end up checked",
        )
        .toBe(true);
      expect
        .soft(
          result.otpSent,
          "'Send OTP' should be clickable once both consent checkboxes are checked",
        )
        .toBe(true);
      expect
        .soft(
          result.otpEntered,
          "the backdoor OTP (123456) should be enterable into the OTP boxes",
        )
        .toBe(true);
      expect
        .soft(
          result.otpAccepted,
          "the backdoor OTP (123456) should be accepted — no error banner and the consent modal should close",
        )
        .toBe(true);
    });
  });
});
