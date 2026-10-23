import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Full Release Loan validations @regression @admin @loans", () => {
  test("validate cron payment type (appraiser)", async ({
    fullRelease,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");
    await fullRelease.fullReleaseCronPay();
  });
});
