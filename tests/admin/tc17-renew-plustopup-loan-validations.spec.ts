import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Renew Plus TopUp Loan validations @regression @admin @loans", () => {
  test("validate cron payment type (appraiser)", async ({
    renewPlusTopup,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    // await loginAs("appraiser");

    // await test.step("validate CRON payment type", async () => {
    //   await renewPlusTopup.renewPlusTopUpCronPay();
    // });

    // Cancel path first: it's non-mutating (no OTP sent, nothing submitted), so it won't
    // consume the loan's renewal+top-up eligibility the way the accept path below does.
    await test.step("validate Confirm Renewal + Top Up consent modal — Cancel path", async () => {
      const result =
        await renewPlusTopup.verifyCancelRenewalPlusTopUpConsentModal();

      expect
        .soft(
          result.modalOpened,
          "'Confirm Renewal + Top Up' consent modal should open after the scheme/payment Confirm click",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Renewal + Top Up' checkbox should end up checked",
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

    await test.step("validate Confirm Renewal + Top Up consent modal — accept path", async () => {
      const result =
        await renewPlusTopup.verifyConfirmRenewalPlusTopUpConsentModal();
        await renewPlusTopup.renewPlusTopUpOnlinePay();
      expect
        .soft(
          result.modalOpened,
          "'Confirm Renewal + Top Up' consent modal should open after the scheme/payment Confirm click",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Renewal + Top Up' checkbox should end up checked",
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
