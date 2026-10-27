import { test, expect } from "../../fixtures/admin.fixture";
import { TRANSACTION_HISTORY_HEADERS } from "../../pages/admin/transaction-log.page";

test.describe("Loan details — Transaction History validations @regression @admin @payments", () => {
  test("open Transaction History, validate columns and each transaction, close (appraiser)", async ({
    transactionLog,
    loginAs,
  }) => {
    test.setTimeout(10 * 60_000);
    await loginAs("appraiser");

    await test.step("open the loan's View Loan page", async () => {
      await transactionLog.openLoanView();
    });

    await test.step("open the Transaction History modal", async () => {
      expect(await transactionLog.openTransactionHistory()).toBe(true);
      expect.soft(await transactionLog.isModalHeadingVisible()).toBe(true);
    });

    await test.step("validate columns and transactions", async () => {
      const history = await transactionLog.readTransactionHistory();

      for (const header of TRANSACTION_HISTORY_HEADERS) {
        expect.soft(history.headers, `column "${header}"`).toContain(header);
      }

      if (history.noRecords) {
        // A loan with no payments yet (e.g. "Packet Submitted") shows the empty state only.
        expect(history.records).toHaveLength(0);
        return;
      }

      expect(history.records.length).toBeGreaterThan(0);
      for (const [i, t] of history.records.entries()) {
        expect
          .soft(t.transactionId, `row ${i + 1} transaction id`)
          .not.toBe("");
        expect.soft(t.paidAmount, `row ${i + 1} paid amount`).toMatch(/\d/);
        expect.soft(t.paymentDate, `row ${i + 1} payment date`).not.toBe("");
        expect.soft(t.paymentType, `row ${i + 1} payment type`).not.toBe("");
        expect.soft(t.status, `row ${i + 1} status`).not.toBe("");
      }
      // Transaction IDs must be unique.
      const ids = history.records.map((t) => t.transactionId);
      expect
        .soft(new Set(ids).size, "duplicate transaction ids")
        .toBe(ids.length);
    });

    await test.step("close the Transaction History modal", async () => {
      expect(await transactionLog.closeTransactionHistory()).toBe(true);
    });
  });
});
