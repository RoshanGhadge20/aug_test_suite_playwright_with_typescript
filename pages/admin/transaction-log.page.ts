import { Locator, Page } from "@playwright/test";
import fs from "fs";
import { AdminBasePage } from "./admin-base.page";

export const TRANSACTION_HISTORY_HEADERS = [
  "Transaction ID",
  "Paid Amount",
  "Payment Date",
  "Payment Type",
  "Status",
  "Receipt",
] as const;

export interface TransactionRecord {
  transactionId: string;
  paidAmount: string;
  paymentDate: string;
  paymentType: string;
  status: string;
}

export interface TransactionHistory {
  /** Column headers as rendered in the modal. */
  headers: string[];
  /** Data rows; empty when the modal shows "No Records Found". */
  records: TransactionRecord[];
  /** True when the modal shows the "No Records Found" empty state. */
  noRecords: boolean;
}

export class TransactionLogPage extends AdminBasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly loanManagement: Locator;
  private readonly loanDetails: Locator;
  private readonly customerUniqID: Locator;
  private readonly filterbtn: Locator;
  private readonly kebabMenu: Locator;
  private readonly viewLoan: Locator;
  private readonly transactionHistoryBtn: Locator;
  private readonly modalHeading: Locator;
  private readonly historyTable: Locator;
  private readonly headerCells: Locator;
  private readonly bodyRows: Locator;
  private readonly btnClose: Locator;

  constructor(page: Page) {
    super(page);
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.loanDetails = this.page.locator(
      "xpath=//span[normalize-space()='Loan Details']",
    );
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[normalize-space(text())='more_vert']])[1]",
    );
    this.viewLoan = this.page.locator(
      "xpath=//button[normalize-space()='View Loan']",
    );
    // "Transaction History" button on the Loan Details page (the modal's own heading is not a <span>).
    this.transactionHistoryBtn = this.page
      .locator("xpath=//span[normalize-space()='Transaction History']")
      .first();
    this.modalHeading = this.page
      .locator(
        "xpath=//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::div or self::span][normalize-space(text())='Transaction History'][ancestor::*[contains(@class,'modal') or contains(@class,'dialog')]]",
      )
      .first();
    this.historyTable = this.page
      .locator(
        "xpath=//table[.//th[normalize-space()='Transaction ID'] or .//td[normalize-space()='Transaction ID']]",
      )
      .first();
    this.headerCells = this.historyTable.locator("xpath=.//th");
    this.bodyRows = this.historyTable.locator("xpath=.//tbody/tr");
    this.btnClose = this.page
      .locator(
        "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
      )
      .first();
  }

  /** Reads the customer ID fresh — a static JSON import goes stale once onboarding rewrites it. */
  private currentCustomerId(): string {
    return String(
      JSON.parse(
        fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
      ).customerId,
    ).trim();
  }

 
  async openLoanView(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.loanManagement.click();
    await this.page.waitForTimeout(2000);
    await this.loanDetails.scrollIntoViewIfNeeded();
    await this.loanDetails.click();
    await this.waitForLoaderToDisappear();

    await this.customerUniqID.fill(this.currentCustomerId());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    // The table keeps re-rendering: bypass stability polling for the Filter click.
    await this.filterbtn
      .first()
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.filterbtn.first().click({ force: true, noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.viewLoan.click();
    await this.waitForLoaderToDisappear();
    await this.transactionHistoryBtn.waitFor({
      state: "visible",
      timeout: 20000,
    });
  }

  /** Clicks "Transaction History" on Loan Details and waits for the modal table. */
  async openTransactionHistory(): Promise<boolean> {
    await this.transactionHistoryBtn.evaluate((el) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.jsClick(this.transactionHistoryBtn);
    await this.waitForLoaderToDisappear();
    return this.historyTable
      .waitFor({ state: "visible", timeout: 15000 })
      .then(() => true)
      .catch(() => false);
  }

  /** Reads the open Transaction History modal: headers, rows, and the empty-state flag. */
  async readTransactionHistory(): Promise<TransactionHistory> {
    const headers = (await this.headerCells.allInnerTexts()).map((h) =>
      h.trim(),
    );
    const rowCount = await this.bodyRows.count();
    const records: TransactionRecord[] = [];
    let noRecords = false;

    for (let i = 0; i < rowCount; i++) {
      const cells = (
        await this.bodyRows.nth(i).locator("xpath=./td").allInnerTexts()
      ).map((c) => c.trim());
      if (cells.length === 1 || /no records found/i.test(cells.join(" "))) {
        noRecords = /no records found/i.test(cells.join(" "));
        continue;
      }
      records.push({
        transactionId: cells[0] ?? "",
        paidAmount: cells[1] ?? "",
        paymentDate: cells[2] ?? "",
        paymentType: cells[3] ?? "",
        status: cells[4] ?? "",
      });
    }
    return { headers, records, noRecords };
  }

  async closeTransactionHistory(): Promise<boolean> {
    if (await this.btnClose.isVisible().catch(() => false)) {
      await this.btnClose.click();
    } else {
      await this.page.keyboard.press("Escape");
    }
    await this.waitForLoaderToDisappear();
    return this.historyTable
      .waitFor({ state: "hidden", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
  }

  async isModalHeadingVisible(): Promise<boolean> {
    return this.modalHeading.isVisible().catch(() => false);
  }
}
