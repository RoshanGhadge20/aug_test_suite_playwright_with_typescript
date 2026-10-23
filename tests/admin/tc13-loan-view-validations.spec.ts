import { test, expect } from "../../fixtures/admin.fixture";

test.describe("Loan details page — View Loan validations @regression @admin @loans", () => {
  test("view loan details, view EMI logs, and view transaction history (appraiser)", async ({
    loanView,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");

    await test.step("validate loan details page — View Loan functionality", async () => {
      const opened = await loanView.openViewLoanDetails();
      expect.soft(opened).toBe(true);
    });

    await test.step("validate View Loan > View EMI Logs functionality", async () => {
      const interestPaid = await loanView.validateViewEmiLogs();
      expect.soft(interestPaid).not.toBe("");
    });

    await test.step("validate View Loan > View Transaction History functionality", async () => {
      const paidAmount = await loanView.validateViewTransactionHistory();
      expect.soft(paidAmount).not.toBe("");
    });
  });
});
