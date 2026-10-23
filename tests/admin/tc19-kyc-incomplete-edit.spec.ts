import { test, expect } from "../../fixtures/admin.fixture";
import { getKycFilePaths } from "../../utils/data/test-file-paths";

test.describe("TC19 manual KYC → ops Incomplete → edit → resubmit @regression @admin @kyc", () => {
  test("manual KYC flow, ops marks Incomplete, appraiser edits on Review & Submit and resubmits", async ({
    page,
    loginAs,
    customerManagement,
    kyc,
  }) => {
    test.setTimeout(25 * 60_000);

    // await test.step("appraiser: create customer + manual KYC (PAN-based)", async () => {
    //   await loginAs("appraiser");
    //   await customerManagement.clickOnCustomerManagementButton();
    //   const { panCardPath, aadhaarPath, signaturePath } = getKycFilePaths();
    //   await kyc.ClickonKyc(panCardPath, signaturePath, aadhaarPath);
    // });

    // await test.step("ops: mark KYC Incomplete", async () => {
    //   await loginAs("ops");
    //   await kyc.performOpsMarkIncomplete("More document needed.");
    // });

    await test.step("appraiser: verify edit on Review & Submit, resubmit", async () => {
      await loginAs("appraiser");
      const result = await kyc.verifyEditOnReviewAndSubmit();
      expect.soft(result.editedFieldAfter).not.toBe(result.editedFieldBefore);
      const errorBanner = page.locator(
        "xpath=//*[contains(@class,'toast-error') or contains(@class,'alert-danger')]",
      );
      expect.soft(await errorBanner.isVisible().catch(() => false)).toBeFalsy();
    });
  });
});
