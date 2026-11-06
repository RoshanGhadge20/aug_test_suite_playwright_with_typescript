import { test, expect } from "../../fixtures/admin.fixture";
import { onboardCustomerThroughKyc } from "../../flows/admin/onboarding.flow";

test.describe("TC06 BT loan @regression @admin @bt-loan", () => {
  test("BT loan — full flow, ZAH review, incomplete flow, rejected flow", async ({
    page,
    loginAs,
    btLoan,
    zahReview,
    btRejectedLoan,
  }) => {
    test.setTimeout(25 * 60_000);

    await test.step("validate BT loan functionality (appraiser)", async () => {
      await loginAs("appraiser");
      await btLoan.validateForBTLoan();
    });


    // await test.step("validate advance approval / ZAH review (appraiser)", async () => {
    //   await loginAs("appraiser");
    //   await zahReview.validateZahReview();
    // });

    await test.step("validate incomplete flow for BT loan (appraiser)", async () => {
      await loginAs("appraiser");
      await btLoan.validateIncompleteBTLaon();
    });

    await test.step("validate rejected flow for BT loan (appraiser)", async () => {
      await loginAs("appraiser");
      await btRejectedLoan.validateRejectBTLaon();
    });
  });
});
