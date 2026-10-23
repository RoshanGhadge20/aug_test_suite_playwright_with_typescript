import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import fs from "fs";
/**
 * Port of Java: PO47_ZAHReview (locators) + Flow68_ValidateZAHReview.
 *
 * Omitted loginWith* calls:
 *   - Flow68_ValidateZAHReview.validateZahReview() had commented-out loginWithAppraiser() block — OMITTED.
 *     Role switching must be handled by the caller via loginAs(role).
 */
export class ZahReviewPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO47_ZAHReview) ───────────────────────────────────────

  private readonly btnAdvanceApproval = () =>
    this.page.locator("xpath=//span[normalize-space()='Advance Approval']");

  private readonly enterReason = () =>
    this.page.locator("xpath=//textarea[@placeholder='Enter Reason']");

  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );

  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");

  // ── Actions (from Flow68_ValidateZAHReview) ───────────────────────────────
  private readonly rowActionButton1 = (customerId: string) =>
    this.page
      .getByRole("row", { name: new RegExp(customerId) })
      .getByRole("button")
      .first();

  /** Reads the customer ID most recently written by CustomerManagementPage during onboarding. */
  getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  /**
   * Port of Flow68_ValidateZAHReview.validateZahReview().
   * Navigates to Funds and Approvals → Advance Approval, scrolls table, approves.
   *
   * NOTE: loginWithAppraiser() was commented out in the Java source — OMITTED.
   */
  async validateZahReview(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("xpath=//span[normalize-space()='Loan Management']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole("link", { name: "Applied BT Loan", exact: true })
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const currentCustomerId = this.getCurrentCustomerId();
    await this.page.waitForTimeout(2000);

    // Confirmed live: for a row in "Processing" status with earlier tiers already approved,
    // the row's own action button (clicked above) IS the "ZAH Review" button — a second,
    // separately-located click on it here was redundant and, after the app had already
    // navigated on, matched nothing (stale CSS-class locator, now removed).
    await this.jsClick(this.rowActionButton1(currentCustomerId));

    // Confirmed live: this opens a "View BT Loan" review page with 6 directly-clickable tabs
    // (Existing BT Info / Jewellery Details / Schemes / Bank Details / Regulatory Documents /
    // Approvals) — it's a read-only review of an already-submitted application, not a
    // sequential data-entry wizard. 5 blind "Next" clicks landed one tab short (on Regulatory
    // Documents, not Approvals). Click the "Approvals" tab directly instead of counting clicks.
    await this.page.getByRole("tab", { name: "Approvals" }).click();
    await this.page.waitForTimeout(2000);

    // Confirmed live: this tab's #approvalStatus select only ever offers "Incomplete"/"Rejected"
    // (see bt-loan.page.ts / bt-rejected-loan.page.ts, which reuse this same control for those two
    // outcomes) — "Approved" is never a valid option here, so selecting it always timed out. The
    // real approval action for this tier is the "Advance Approval" flow below, which has its own
    // instance of #approvalStatus where "Approved" is genuinely available.
    const element = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await element.click();

    await this.btnAdvanceApproval().click();
    await this.page.waitForTimeout(2000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);

    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);

    // Confirmed live: Advance Approval is a paginated table (one row per request, 727 total),
    // each with its OWN status select + Submit button and its own option set (some rows offer
    // "Approved"/"Incomplete", others offer bank-specific "APPROVE WITH ..." options depending on
    // request type) — there is no single page-wide #approvalStatus/#Submit. Scope both to the row
    // matching the current customer ID, same pattern as rowActionButton1 above.
    const approvalRow = this.page.getByRole("row", {
      name: new RegExp(currentCustomerId),
    });
    await approvalRow.getByRole("combobox").selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    const submitEl = approvalRow.getByRole("button", { name: "Submit" });
    await this.page.waitForTimeout(2000);
    await submitEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(2000);
    await submitEl.click();

    await this.enterReason().fill("Approved");
    await this.btnAdd().click();
    await this.btnYes().click();
  }
}
