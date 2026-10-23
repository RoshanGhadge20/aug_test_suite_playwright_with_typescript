import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

export class PacketSubmissionPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO08_PacketSubmissionAppraiser) ─────────────────────────

  // Confirmed live via screenshot: rows whose "SUBMIT PACKET" button is genuinely enabled
  // render as a plain bordered button with no icon. Rows that are locked (no permission /
  // not yet actionable) render the same text grayed-out with a padlock <img> overlaid on top
  // of it — exclude those. This is a plain HTML table (ARIA role "cell", i.e. a native <td>,
  // confirmed via error-context.md — NOT the mat-cell[@role='gridcell'] component used
  // elsewhere in this suite; that pattern doesn't apply to this table).
  private readonly btnSubmitPacket = () =>
    this.page
      .locator(
        "xpath=//td[.//button[normalize-space()='SUBMIT PACKET']][not(.//img)]",
      )
      .first()
      .locator("xpath=.//button[normalize-space()='SUBMIT PACKET']");
  private readonly selLocation = () =>
    this.page.locator("xpath=//select[@formcontrolname='packetLocationId']");
  private readonly inputField = () =>
    this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly selBranch = () =>
    this.page.locator("xpath=//select[@formcontrolname='partnerBranchId']");
  private readonly btnVerify = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
  private readonly inputMobileNumber = () =>
    this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly user = () =>
    this.page.locator("xpath=//label[normalize-space()='User']");
  private readonly btnOTP = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
  private readonly inputOTP = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");

  // Cross-page re-declarations
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  // Inline branch dropdown from Flow09
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");

  async packetSubmission(): Promise<void> {
    const data = getLoginData();

    // Confirmed live: clicking Verify hangs past "performing click action" with no further
    // progress — a native browser dialog (alert/confirm) blocks the page's JS execution
    // entirely, and Playwright's click() can never resolve without a handler to dismiss it.
    // Same pattern already used elsewhere in this suite (assign-packet.page.ts,
    // quick-payment.page.ts) for native dialogs triggered by app actions.
    this.page.on("dialog", (dialog) => dialog.accept().catch(() => {}));

    await this.page.waitForTimeout(5000);

    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // NOTE: does NOT select "Show All" branch scope — confirmed live (renew-zero.page.ts,
    // loan-defects.page.ts) that switching this account's branch scope gets the backend to
    // reject the session outright (403/401, forced redirect to /auth/login).
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Native <button type="submit"> — Angular's (ngSubmit) already handles this client-side,
    // so Playwright's default click() hangs waiting for a "scheduled navigation" that never
    // comes (confirmed live: click completes, then hangs on "waiting for scheduled
    // navigations to finish"). Same fix used elsewhere in this suite for native submit buttons.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmitPacket().click();
    await this.waitForLoaderToDisappear();

    await this.selLocation().waitFor({ state: "visible", timeout: 20000 });
    await this.selLocation().selectOption({ label: "Partner Branch In" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selBranch().selectOption({ label: "Nashik Road" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Read barcode text from the page
    const ele = this.page.locator(
      "xpath=//div[@class='col-7 d-flex align-items-center']",
    );
    const str = (await ele.innerText()).trim();
    await this.page.waitForTimeout(500);

    await this.inputField().fill(str);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    // Java used `partnerNumber` — mapped to accountNumber; update if needed
    await this.inputMobileNumber().fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.inputOTP().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
  }
}
