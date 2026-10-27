import { Page, Locator } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { panelUrl } from "../../config/urls";

/**
 * Port of Java: PO17_AppraiserRequestPage (locators) + Flow20_AppraiserRequestPage (actions)
 *
 * Cross-page locator notes:
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `branchDropdown` re-declares inline Flow20 XPath.
 *   - `customerManagementBtn` re-declares PO_CustomerManagement.loc_customer (same XPath).
 *   - `allCustomers` re-declares PO_CustomerManagement.loc_allcustomer (same XPath).
 *   - `firstNameFilter` re-declares PO01_KycSel.loc_firstName (same XPath).
 *   - `filterbtn` re-declares PO01_KycSel.loc_filterbtn (same XPath).
 *   - `kebabMenu`, `startNewGL`, `btnAdd`, `appraisalRequest`, `textField` re-declared from PO04_NewGoldLoan.
 *
 * Omitted loginWith* calls:
 *   - Flow20_AppraiserRequestPage.validateAppraiserRequest() calls loginWithOPS() — OMITTED.
 *     Caller must inject loginAs('ops') before calling validateAppraiserRequest().
 */
export class AppraiserRequestPage extends AdminBasePage {
  // ── Locators (from PO17_AppraiserRequestPage + cross-page re-declarations) ─
  // Original was a hardcoded //mat-row[13]//mat-cell[12]//div[2]//button[1] positional path —
  // fragile against any change in row order/count. Confirmed live (raw HTML dump of the
  // Appraiser Requests / Lead Management > New Requests table) that every actionable row's
  // button reads exactly "Update Appraiser", so match on that instead of position.
  private readonly btnUpadateAppraiser: Locator;
  // Same formcontrolname is reused by both the request-creation dialog (Start New Gold Loan)
  // and the Update Appraiser dialog — confirmed live via raw HTML dumps of both.
  private readonly btnAppraiserName: Locator;
  // Internal Branch (Start New Gold Loan creation dialog only) — confirmed live via raw HTML
  // dump: formcontrolname='internalBranchId'.
  private readonly internalBranchId: Locator;
  private readonly moduleIdCreate: Locator;
  // "Update" submit button inside the Update Appraiser dialog (component is literally named
  // <kt-assign-appraiser> — confirmed live it's the same feature as "Assign Appraiser", just
  // labeled "Update" here). The original port selected an appraiser but never clicked this —
  // the selection was never actually saved.
  private readonly btnUpdateSubmit: Locator;
  // Cross-page re-declarations
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly kebabMenu: Locator;
  private readonly startNewGL: Locator;
  private readonly btnAdd: Locator;
  private readonly appraisalRequest: Locator;
  private readonly textField: Locator;
  private readonly scrollableTable: Locator;

  constructor(page: Page) {
    super(page);
    this.btnUpadateAppraiser = this.page.locator(
      "xpath=//mat-row//button[normalize-space()='Update Appraiser']",
    );
    this.btnAppraiserName = this.page.locator(
      "xpath=//select[@formcontrolname='appraiserId']",
    );
    this.internalBranchId = this.page.locator(
      "xpath=//select[@formcontrolname='internalBranchId']",
    );
    this.moduleIdCreate = this.page.locator(
      "xpath=//select[@formcontrolname='moduleId']",
    );
    this.btnUpdateSubmit = this.page.locator(
      "xpath=//button[normalize-space()='Update']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.customerManagementBtn = this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
    this.allCustomers = this.page.locator(
      "xpath=//span[normalize-space()='All Customers']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[text()='more_vert']])[1]",
    );
    this.startNewGL = this.page.locator(
      "xpath=//button[normalize-space()='Start New Gold Loan']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.appraisalRequest = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.scrollableTable = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow20_AppraiserRequestPage.validateAppraiserRequest().
   * Caller must first loginAs('ops').
   */
  async validateAppraiserRequest(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.branchDropdown.selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL.click();
    await this.waitForLoaderToDisappear();
    await this.btnAdd.click();
    await this.page.waitForTimeout(5000);

    await this.appraisalRequest.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField.fill(data.firstName);

    // Scroll table horizontally then back (Actions.scrollLeft/sendKeys.HOME equivalent)
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = (el as any).scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = 0;
    });
    await this.page.waitForTimeout(3000);

    await this.clickFirstAvailableUpdateAppraiser();
    await this.waitForLoaderToDisappear();
    await this.btnAppraiserName.waitFor({ state: "visible" });
    await this.selectOptionByPartialLabel(
      this.btnAppraiserName,
      "Priyanka Thorat",
    );

    // The original port stopped here — it selected an appraiser but never submitted, so the
    // change was never actually saved. Confirmed live via raw HTML dump: the dialog's submit
    // button reads "Update".
    await this.btnUpdateSubmit.click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Clicks the first clickable "Update Appraiser" button in the currently-filtered table.
   * Rows can be locked/unclickable (same "checked out by another session" pattern seen
   * elsewhere in this suite, e.g. ops-approval.page.ts's clickFirstUnlockedOpsTeamRating()),
   * so scan candidates instead of assuming the first match is usable.
   */
  private async clickFirstAvailableUpdateAppraiser(): Promise<void> {
    const buttons = this.btnUpadateAppraiser;
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      try {
        await buttons.nth(i).click({ timeout: 5000 });
        return;
      } catch {
        // Locked/unclickable row — try the next candidate.
      }
    }
    throw new Error(
      `No clickable "Update Appraiser" button found among ${count} candidates.`,
    );
  }

  /**
   * Resolves a select's full option label by substring match and selects it. Confirmed live
   * both the Internal Branch options ("Augmont (Mumbai City)") and Appraiser Name options
   * (rendered with `&nbsp;` between first/last name, e.g. "Priyanka Thorat") never
   * exactly equal the plain string a caller would naturally pass — an exact-label
   * selectOption() just times out against either.
   */
  private async selectOptionByPartialLabel(
    select: Locator,
    partial: string,
  ): Promise<void> {
    const firstWord = partial.split(/\s+/)[0];
    const matched = select.locator("option", { hasText: firstWord });
    const fullLabel = (await matched.first().textContent())?.trim();
    if (!fullLabel) {
      throw new Error(`No option matching "${partial}"`);
    }
    await select.selectOption({ label: fullLabel });
  }

  /**
   * Shared nav to All Customers (Customer Management hover-flyout submenu). Re-traversing
   * this same-session is flaky in a way that isn't fully deterministic — an element can pass
   * jsClick's own visibility wait and still fail the following interaction as the CSS
   * transition races (same pattern already confirmed live and fixed once in
   * customer-management.page.ts's openAddCustomerForm()). Retry the whole sequence rather
   * than chase the exact timing.
   */
  private async navigateToAllCustomers(): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.page.waitForTimeout(5000);
        await this.profile.click();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(5000);

        await this.branchDropdown.waitFor({ state: "visible" });
        await this.page.waitForTimeout(2000);

        await this.expandSidebar();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(500);
        await this.jsClick(this.customerManagementBtn);
        await this.waitForLoaderToDisappear();
        if (!(await this.allCustomers.isVisible().catch(() => false))) {
          await this.jsClick(this.customerManagementBtn);
          await this.waitForLoaderToDisappear();
        }
        await this.jsClick(this.allCustomers);
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(2000);
        return;
      } catch (err) {
        lastErr = err;
        await this.page.waitForTimeout(2000);
      }
    }
    throw lastErr;
  }

  /**
   * Creates a new gold-loan request for the customer matched by data.firstName, explicitly
   * choosing Internal Branch + Appraiser Name in the "Start New Gold Loan" dialog —
   * confirmed live via raw HTML dump: formcontrolname='internalBranchId' / 'appraiserId' /
   * 'moduleId'. The original validateAppraiserRequest() creates a request too, but never
   * selects branch or appraiser at creation time.
   *
   * Caller must first loginAs('ops') or loginAs('admin') — confirmed live both roles reach
   * this screen identically.
   */
  async createRequestWithBranchAndAppraiser(
    branchLabel: string,
    appraiserLabel: string,
  ): Promise<void> {
    const data = getLoginData();
    await this.navigateToAllCustomers();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.filterbtn.click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Confirmed live: options read "<Branch Name> (<City>)" (e.g. "Augmont (Mumbai City)",
    // "Dadar (Mumbai City)") — never the bare branch name Playwright's exact-label match
    // needs. Resolve the full label by substring match first.
    await this.selectOptionByPartialLabel(this.internalBranchId, branchLabel);
    await this.page.waitForTimeout(500);
    await this.selectOptionByPartialLabel(
      this.btnAppraiserName,
      appraiserLabel,
    );
    await this.page.waitForTimeout(500);
    await this.moduleIdCreate
      .selectOption({ label: "Gold Loan" })
      .catch(() => {});
    await this.page.waitForTimeout(500);

    await this.btnAdd.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async updateAppraiserFirstAvailable(
    searchText: string,
    appraiserLabel: string,
  ): Promise<string> {
    await this.page.goto(
      `${panelUrl("admin")}/admin/lead-management/new-requests`,
    );
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    const searchBox = this.textField;
    if (await searchBox.count()) {
      await searchBox.fill(searchText);
      await this.page.waitForTimeout(2000);
    }

    const buttons = this.btnUpadateAppraiser;
    const count = await buttons.count();
    let rowText = "";
    let clicked = false;
    for (let i = 0; i < count; i++) {
      try {
        rowText = (
          await buttons.nth(i).locator("xpath=ancestor::mat-row[1]").innerText()
        )
          .replace(/\s+/g, " ")
          .trim();
        await buttons.nth(i).click({ timeout: 5000 });
        clicked = true;
        break;
      } catch {
        // Locked/unclickable row — try the next candidate.
      }
    }
    if (!clicked) {
      throw new Error(
        `No clickable "Update Appraiser" button found among ${count} candidates.`,
      );
    }

    await this.btnAppraiserName.waitFor({ state: "visible" });
    await this.selectOptionByPartialLabel(
      this.btnAppraiserName,
      appraiserLabel,
    );
    await this.page.waitForTimeout(500);

    await this.btnUpdateSubmit.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    return rowText;
  }
}
