import * as os from "os";
import * as path from "path";
import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

/**
 * Port of Java: PO18_CRLPage (locators) + Flow21_CRLPage (actions)
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown`, `customerManagementBtn`, `allCustomers`,
 *     `addCustomerBtn`, `leadSourceDropdown`, `firstNameCustomer`, `lastNameCustomer`,
 *     `mobileNumberCustomer`, `sendOtp`, `enterOtp`, `verify`, `stateDropdown`, `cityDropdown`,
 *     `pinCode`, `selGoldloan`, `addButton` re-declared from PO_CustomerManagement / inline flow.
 *
 * Omitted loginWith* calls:
 *   - Flow21_CRLPage.CRLRequestPage() sets branch via profile — no login switch, uses current session.
 *   - Delegates to Flow01_Kyc.ClickonKyc() and Flow02_KycApproval.performOpsRatingActions() at end —
 *     those are NOT ported here; the spec should call kyc.ClickonKyc() and kycApproval.performOpsRatingActions().
 */
export class CrlPagePage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO18_CRLPage) ─────────────────────────────────────────

  private readonly customerRequestList = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Customer Request List']",
    );
  private readonly addLead = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Lead']");
  private readonly firstname = () =>
    this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastname = () =>
    this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly mobileNumber = () =>
    this.page.locator("xpath=//input[@placeholder='Mobile Number']");
  // Exact @class= match is fragile — this app's buttons consistently carry extra classes
  // (e.g. 'mat-primary ng-star-inserted') beyond this literal string, confirmed live
  // elsewhere in this suite. The 'submit mat-raised-button' class combo alone isn't unique
  // either — the Filter button on this same page shares it — so also match on the "Add"
  // label text to avoid ambiguity between the two.
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[contains(@class,'mat-raised-button')][normalize-space()='Add']",
    );
  private readonly nameField = () =>
    this.page.locator("xpath=//input[@id='mat-input-0']");
  private readonly view = () =>
    this.page.locator(
      "xpath=(//mat-icon[@role='img'][normalize-space()='visibility'])[1]",
    );
  private readonly close = () =>
    this.page.locator("xpath=//img[@class='kt-pointer']");
  // Original was a `//kt-button[@ng-reflect-value='Export']//button` wrapper locator — confirmed
  // live the current UI renders a plain <button>Export</button> with no <kt-button> ancestor.
  private readonly btnExport = () =>
    this.page.locator("xpath=//button[normalize-space()='Export']");
  // Original was a hardcoded (//button)[33] positional index — fragile against any change in
  // button count on the page. Confirmed live (raw HTML dump of the Reports/export-history
  // panel) the actual manual-download control is the button with icon="pi pi-download",
  // tooltip "Download" — a second, unrelated button in the same row is tooltipped "Download"
  // too but uses icon="pi pi-eye" (a filter-preview action), so match on the icon, not the
  // tooltip text.
  private readonly reportsDownloadBtn = () =>
    this.page.locator("xpath=//button[@icon='pi pi-download']");

  // ── Locators confirmed live on Customer Request List (ops role only — see note below) ────
  private readonly listTotalLabel = () =>
    this.page.locator(
      "xpath=//label[contains(@class,'kt-subheader__desc') and contains(normalize-space(),'Total')]",
    );
  private readonly requestStatusFilterIcon = () =>
    this.page.locator(
      "xpath=//th[.//span[normalize-space()='Request Status']]//img[contains(@src,'filter.svg')]",
    );
  // Opens the actual checkbox option list inside the already-open filter overlay panel.
  private readonly statusMultiselectTrigger = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'ui-multiselect-trigger')])[1]",
    );
  private readonly statusMultiselectItems = () =>
    this.page.locator(
      "xpath=//div[contains(@class,'ui-multiselect-items')]//li",
    );
  private readonly applyNowBtn = () =>
    this.page.locator("xpath=//button[normalize-space()='Apply Now']");
  // "Reports" (export history) is the page's second PrimeNG <p-table> — confirmed live via
  // ng-reflect-state-key="customer-request-report"; reading ng-reflect-total-records off it is
  // far more reliable than counting rendered <tr>s (PrimeNG splits header/body into separate
  // scrollable <table>s, and rows are paginated).
  private readonly reportsTable = () =>
    this.page.locator("xpath=(//p-table)[2]");
  private readonly reportsRefreshBtn = () =>
    this.page.locator("xpath=//button[@mattooltip='Refresh']");
  private readonly viewCustomerDialogTitle = () =>
    this.page.locator(
      "xpath=//h2[normalize-space()='View Customer'] | //*[normalize-space()='View Customer']",
    );

  // Cross-page re-declarations
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly branchDropdown = () =>
    this.page.locator("xpath=//select[@id='branch']");
  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  private readonly allCustomers = () =>
    this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly addCustomerBtn = () =>
    this.page.locator("xpath=//button[normalize-space()='Add Customer']");
  private readonly leadSourceDropdown = () =>
    this.page.locator("xpath=//select[@formcontrolname='leadSource']");
  // Confirmed live: formcontrolname='firstName' alone is a strict-mode violation — the
  // underlying "All Customers" list's own quick-filter field shares the same formcontrolname
  // (placeholder "Enter First Name") alongside the Add Customer dialog's real field
  // (placeholder "First Name", no "Enter " prefix — this codebase's consistent convention for
  // dialog fields vs. list filter fields). Disambiguate by the bare placeholder.
  private readonly firstNameCustomer = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='firstName' and @placeholder='First Name']",
    );
  private readonly lastNameCustomer = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='lastName' and @placeholder='Last Name']",
    );
  // Confirmed live: unlike firstName/lastName, this field doesn't follow the bare "Mobile
  // Number" convention — its real placeholder is "Enter mobile number" (lowercase, with the
  // "Enter " prefix normally reserved for list-filter fields in this app).
  private readonly mobileNumberCustomer = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber' and @placeholder='Enter mobile number']",
    );
  // Confirmed live: button text is "Send Otp" (mixed case), not "Send OTP".
  private readonly sendOtp = () =>
    this.page.locator("xpath=//button[normalize-space()='Send Otp']");
  private readonly enterOtp = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly verify = () =>
    this.page.locator("xpath=//button[normalize-space()='Verify']");
  private readonly stateDropdown = () =>
    this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly cityDropdown = () =>
    this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly branchDropdownInternal = () =>
    this.page.locator("xpath=//select[@formcontrolname='internalBranchId']");
  private readonly pinCode = () =>
    this.page.locator("xpath=//input[@formcontrolname='pinCode']");
  private readonly selGoldloan = () =>
    this.page.locator("xpath=//select[option[normalize-space()='Gold Loan']]");
  private readonly addButton = () =>
    this.page.locator("xpath=//button[normalize-space()='Add']");
  private readonly crlMobileResult = () =>
    this.page.locator(
      "xpath=(//td[contains(@class,'ui-resizable-column')]/span[last()][normalize-space(text())])[4]",
    );
  async CRLRequestPage(): Promise<void> {
    const data = getLoginData();
    const mobileNumber = TestDataFactory.mobile();
    const pinCode = String(Math.floor(100000 + Math.random() * 900000));

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.customerRequestList().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(500);
    await this.addLead().click();
    await this.page.waitForTimeout(1500);

    await this.firstname().fill(data.firstName);
    await this.lastname().fill(data.lastName);
    await this.mobileNumber().fill(mobileNumber);

    await this.stateDropdown().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown().selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.branchDropdownInternal().selectOption({
      label: data.branchName,
    });
    await this.page.waitForTimeout(500);

    await this.btnAdd().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

    // Capture the CRL mobile number from the result table row
    const crlMobile = await this.crlMobileResult()
      .innerText()
      .then((t) => t.trim())
      .catch(() => mobileNumber);

    await this.page.waitForTimeout(3000);
    await this.page.reload();
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    await this.jsClick(this.customerManagementBtn());
    await this.waitForLoaderToDisappear();
    if (
      !(await this.allCustomers()
        .isVisible()
        .catch(() => false))
    ) {
      await this.jsClick(this.customerManagementBtn());
      await this.waitForLoaderToDisappear();
    }
    await this.jsClick(this.allCustomers());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.addCustomerBtn().waitFor({ state: "visible", timeout: 15000 });
    await this.addCustomerBtn().click();
    await this.page.waitForTimeout(1000);

    await this.leadSourceDropdown().selectOption({ label: data.leadName });
    await this.page.waitForTimeout(500);

    await this.firstNameCustomer().fill(data.firstName);
    await this.lastNameCustomer().fill(data.lastName);
    await this.mobileNumberCustomer().fill(crlMobile);
    await this.sendOtp().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.enterOtp().fill("1234");
    await this.verify().click();
    await this.waitForLoaderToDisappear();

    await this.stateDropdown().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.cityDropdown().selectOption({ label: data.city });
    await this.page.waitForTimeout(500);
    await this.pinCode().fill(pinCode);
    await this.selGoldloan().selectOption({ label: "Gold Loan" });
    await this.addButton().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Port of Flow21_CRLPage.viewFunctionality().
   */
  async viewFunctionality(): Promise<void> {
    const data = getLoginData();
    await this.nameField().fill(data.firstName);
    await this.view().click();
    await this.waitForLoaderToDisappear();
    await this.close().click();
    await this.waitForLoaderToDisappear();
  }

  private async navigateToCustomerRequestList(): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.page.waitForTimeout(5000);
        await this.profile().click();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);

        await this.branchDropdown().waitFor({ state: "visible" });
        await this.page.waitForTimeout(2000);

        await this.expandSidebar();
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(500);
        await this.jsClick(this.customerManagementBtn());
        await this.waitForLoaderToDisappear();
        if (
          !(await this.customerRequestList()
            .isVisible()
            .catch(() => false))
        ) {
          await this.jsClick(this.customerManagementBtn());
          await this.waitForLoaderToDisappear();
        }
        await this.jsClick(this.customerRequestList());
        await this.waitForLoaderToDisappear();
        await this.page.waitForTimeout(3000);
        return;
      } catch (err) {
        lastErr = err;
        await this.page.waitForTimeout(2000);
      }
    }
    throw lastErr;
  }

  async validateAllDataWithRequest(): Promise<number> {
    // await this.navigateToCustomerRequestList();
    await this.listTotalLabel().waitFor({ state: "visible", timeout: 20000 });
    const totalText = await this.listTotalLabel().innerText();
    return parseInt(totalText.replace(/\D/g, ""), 10) || 0;
  }

  /**
   * Validates the "View" (eye icon) action on the first row of the Customer Request List opens
   * the "View Customer" details dialog, then closes it. Caller must first loginAs('ops').
   */
  async validateViewFunctionality(): Promise<boolean> {
    //await this.navigateToCustomerRequestList();
    await this.view().first().click();
    await this.waitForLoaderToDisappear();
    const dialogVisible = await this.viewCustomerDialogTitle()
      .first()
      .isVisible()
      .catch(() => false);
    await this.close().first().click();
    await this.waitForLoaderToDisappear();
    return dialogVisible;
  }

  async validateExportFunctionality(): Promise<{
    before: number;
    after: number;
  }> {
    // await this.navigateToCustomerRequestList();
    const before = parseInt(
      (await this.reportsTable().getAttribute("ng-reflect-total-records")) ||
        "0",
      10,
    );
    await this.page
      .locator(".cdk-overlay-backdrop")
      .click({ force: true })
      .catch(() => {});
    await this.page.waitForTimeout(500);
    await this.btnExport().click({ force: true });
    await this.page.waitForTimeout(4000);

    await this.reportsRefreshBtn()
      .click()
      .catch(() => {});
    await this.page.waitForTimeout(3000);
    const after = parseInt(
      (await this.reportsTable().getAttribute("ng-reflect-total-records")) ||
        "0",
      10,
    );

    return { before, after };
  }

  async validateManualDocumentDownload(): Promise<string> {
    await this.navigateToCustomerRequestList();

    const downloadBtn = this.reportsDownloadBtn().first();
    try {
      await downloadBtn.waitFor({ state: "visible", timeout: 15000 });
      const [download] = await Promise.all([
        this.page.waitForEvent("download", { timeout: 30_000 }),
        downloadBtn.click(),
      ]);
      const filePath = path.join(
        os.tmpdir(),
        download.suggestedFilename() || `crl-report-${Date.now()}.xlsx`,
      );
      await download.saveAs(filePath);
      return filePath;
    } catch {
      return "";
    }
  }

  async filterByRequestStatus(
    status: "OPEN" | "PROCESSING" | "CONVERTED" | "NOT INTERESTED" | "CLOSED",
  ): Promise<number> {
    // await this.navigateToCustomerRequestList();

    await this.requestStatusFilterIcon().scrollIntoViewIfNeeded();
    await this.requestStatusFilterIcon().click();
    await this.page.waitForTimeout(1000);
    await this.statusMultiselectTrigger().click();
    await this.page.waitForTimeout(1000);

    await this.statusMultiselectItems()
      .filter({ hasText: status })
      .first()
      .click();
    await this.page.waitForTimeout(500);

    // Close the option-list dropdown so it stops covering "Apply Now".
    await this.statusMultiselectTrigger().click();
    await this.page.waitForTimeout(500);

    await this.applyNowBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    const totalText = await this.listTotalLabel().innerText();
    return parseInt(totalText.replace(/\D/g, ""), 10) || 0;
  }
}
