import { test, expect } from "../../fixtures/admin.fixture";

test.describe("TC23 verify auto PAN with auto Aadhaar @regression @admin @kyc", () => {
  test("appraiser: auto-verified PAN + auto-verified Aadhaar completes KYC", async ({
    loginAs,
    customerManagement,
    kyc,
    kycFilePaths,
  }) => {
    test.setTimeout(15 * 60_000);

    await test.step("appraiser: create customer, auto PAN + auto Aadhaar KYC", async () => {
      await loginAs("appraiser");
      await customerManagement.clickOnCustomerManagementButton();
      const result = await kyc.verifyAutoPanWithAutoAadhaar(
        undefined,
        kycFilePaths.panCardPath,
        kycFilePaths.signaturePath,
      );
      expect
        .soft(
          result.panVerifySucceeded,
          "PAN should auto-verify against the real backend, not fall back to manual continuation",)
        .toBe(true);
      expect.soft(result.panSwitchedToManual).toBe(false);
    });
  });
});
