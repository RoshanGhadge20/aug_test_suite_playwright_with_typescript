import { test, expect } from "../../fixtures/admin.fixture";
import { getLoginData } from "../../utils/data/admin-excel-data";

test.describe("Appraiser Request validations @regression @admin @loans", () => {
  test("create request with branch+appraiser, existing-data same/different branch, update appraiser (ops & admin)", async ({
    appraiserRequest,
    loginAs,
  }) => {
    test.setTimeout(15 * 60_000);
    const data = getLoginData();

    await test.step("create request with branch + appraiser — existing customer, same branch (Augmont)", async () => {
      await loginAs("ops");
      await appraiserRequest.createRequestWithBranchAndAppraiser(
        "Augmont",
        "Priyanka Thorat",
      );
    });

    await test.step("create request with branch + appraiser — existing customer, different branch (Dadar)", async () => {
      await appraiserRequest.createRequestWithBranchAndAppraiser(
        "Dadar",
        "Roshan Appraiser",
      );
    });

    await test.step("update appraiser (ops)", async () => {
      const rowText = await appraiserRequest.updateAppraiserFirstAvailable(
        data.firstName,
        "Priyanka Thorat",
      );
      expect.soft(rowText).not.toBe("");
    });

    await test.step("update appraiser (admin)", async () => {
      await loginAs("admin");
      const rowText = await appraiserRequest.updateAppraiserFirstAvailable(
        data.firstName,
        "Roshan Appraiser",
      );
      expect.soft(rowText).not.toBe("");
    });
  });
});
