import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC24 verify Confirm Top Up consent modal @regression @admin @payments", () => {
  test("appraiser: Confirm Top Up triggers consent modal with two mandatory checkboxes before Send OTP", async ({
    loginAs,
    topUp,
  }) => {
    test.setTimeout(15 * 60_000);
    await loginAs("appraiser");

    await test.step("appraiser: verify Confirm Top Up consent modal — Cancel path", async () => {
      const result = await topUp.verifyCancelTopUpConsentModal();

      expect
        .soft(
          result.modalOpened,
          "'Confirm Top Up' consent modal should open after the top-up amount/purpose Confirm clicks",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Top Up' checkbox should end up checked",
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

    await test.step("appraiser: verify Confirm Top Up consent modal — accept path", async () => {
      const result = await topUp.verifyConfirmTopUpConsentModal();

      expect
        .soft(
          result.modalOpened,
          "'Confirm Top Up' consent modal should open after the top-up amount/purpose Confirm clicks",
        )
        .toBe(true);
      expect
        .soft(
          result.requestedCheckboxChecked,
          "'customer has personally requested this Top Up' checkbox should end up checked",
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
        .soft(result.otpEntered, "the backdoor OTP (123456) should be enterable into the OTP boxes")
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
