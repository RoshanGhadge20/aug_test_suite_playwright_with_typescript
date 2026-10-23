import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";
/**
 * Port of Java: PO24_FullReleaseOffline (empty class) + Flow35_FullReleaseOffline (actions)
 *
 * Methods ported:
 *   - validateFullRelease()  ← Flow35.validateFullRelease()
 *   - deposit()              ← Flow35.deposit()
 *
 * Note: Flow35.validateFullRelease() calls Flow10_QuickPayment.quikPaymentsuccess() at the
 * start — that precondition is handled by the spec (createDisbursedLoan covers the pre-state).
 * The method continues with navigating to Jewellery Release Final Process → Final Full Release
 * → update(), which are implemented here.
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally.
 *   - PO08_PacketSubmissionAppraiser locators re-declared for update().
 *   - PO15_PartRelease / PO16_FullRelease locators re-declared as needed.
 *   - PO23_PartReleaseOffline.loc_updatebtn / loc_btupdate re-declared.
 *
 * Omitted loginWith* calls:
 *   - validateFullRelease() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - deposit() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * C:\\ file paths in upload helpers omitted (guarded).
 */
export class FullReleaseOfflinePage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Cross-page re-declarations ────────────────────────────────────────────

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
  // Inline branch dropdown
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
  // PO16_FullRelease.loc_fullReleaseFinalProcess
  private readonly fullReleaseFinalProcess = () =>
    this.page.locator("xpath=//span[normalize-space()='Final Full Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
  // PO16_FullRelease.loc_fullReleaseApproval
  private readonly fullReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Full Release Approval']",
    );
  // Placeholder casing varies by screen ("Enter Customer Unique Id" vs "...Unique ID") — match
  // on the stable prefix instead of the exact (case-sensitive) full string.
  private readonly textField = () =>
    this.page.locator(
      "xpath=//input[contains(@placeholder,'Customer Unique')]",
    );
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // Row action — only rendered once Full Release Amount Status = Completed (while Pending,
  // the row shows "Update" instead; confirmed against live UAT).
  private readonly assignReleaser = () =>
    this.page.locator("xpath=//button[contains(.,'Assign Releaser')]");
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  // PO10_QuickPayment.loc_btnFilter
  private readonly btnFilter = () =>
    this.page.locator("xpath=//span[normalize-space()='Filter']");
  // PO23_PartReleaseOffline.loc_updatebtn
  private readonly updatebtn = () =>
    this.page.locator("xpath=(//button[contains(.,'Update')])[1] ");
  // PO23_PartReleaseOffline.loc_btupdate
  private readonly btupdate = () =>
    this.page.locator("xpath=//span[contains(.,'Update')]");
  // PO15_PartRelease.loc_btnCollect
  private readonly btnCollect = () =>
    this.page.locator("xpath=//button[normalize-space()='Collect']");
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () =>
    this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera
  private readonly btnCamera = () =>
    this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
  // PO08_PacketSubmissionAppraiser locators (re-declared for update())
  private readonly inputField = () =>
    this.page.locator("xpath=//input[@formcontrolname='Barcode']");
  private readonly btnVerify = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Verify']//button[@type='button']",
    );
  private readonly inputMobileNumber = () =>
    this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly btnOTP = () =>
    this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Send OTP']//button[@type='button']",
    );
  private readonly inputOTP = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnUpdateOTP = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly updatePayment = () =>
    this.page.locator(
      "xpath=//kt-modal-footer//button[.//span[normalize-space()='Update']]",
    );
  private readonly jewllaryRelease = () =>
    this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");

  private readonly btnProced = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  private readonly fullReleaseBtn = () =>
    this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Full Release']]",
    );
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO10_QuickPayment.loc_btnDone (payment done button)
  private readonly btnPaymentDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO10_QuickPayment.loc_btnConfirm — scoped to the containing <button>, since a bare
  // span[text()='Confirm'] also matches an unrelated stray span elsewhere on this page.
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Confirm']]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  // PO23_PartReleaseOffline offline bank-detail fields
  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly selStatus = () =>
    this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
  private generateTransactionId(): string {
    return "TXN-" + Math.random().toString(36).substring(2, 14).toUpperCase();
  }

  private getRandomBankName(): string {
    const banks = [
      "State Bank of India",
      "HDFC Bank",
      "ICICI Bank",
      "Axis Bank",
      "Punjab National Bank",
      "Bank of Baroda",
      "Kotak Mahindra Bank",
      "Yes Bank",
      "IDFC First Bank",
      "Union Bank of India",
    ];
    return banks[Math.floor(Math.random() * banks.length)];
  }

  private getRandomBranchName(): string {
    const branches = [
      "MG Road Branch",
      "Andheri Branch",
      "Connaught Place Branch",
      "Koramangala Branch",
      "Bandra Branch",
      "Chandni Chowk Branch",
      "Jayanagar Branch",
      "Indiranagar Branch",
      "Santacruz Branch",
      "Pune Camp Branch",
    ];
    return branches[Math.floor(Math.random() * branches.length)];
  }

  // ── Actions (initiate offline full release — missing from the original port) ──

  /**
   * Submits an offline (IMPS) full-release request via Loan Details → Jewellery Release →
   * Full Release → Proceed → bank details → Done → Confirm → Yes. This is the offline
   * counterpart of Java Flow18_FullReleaseLoan.fullReleaseOnlinePay() (see full-release.page.ts),
   * which the original port never added — without it there is no pending record for
   * validateFullRelease()'s approval/final-process screens to find (both list "No records found").
   *
   * NOTE: No loginWith* call. Caller must be logged in as appraiser.
   */
  async initiateFullReleaseOffline(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    await this.loanManagement().click();
    await this.page.waitForTimeout(2000);
    const el = this.loanDetails();
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    // noWaitAfter: this button is type="submit" inside a <form> — Playwright detects a real
    // navigation attempt from the native submit and hangs waiting for it to "finish" even though
    // Angular's (ngSubmit) handler already intercepted it client-side. Don't wait for it.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();

    // Scan rows for one that still offers "Jewellery Release" in its kebab menu — a loan already
    // released (or otherwise processed) by a prior run only shows View Loan/Pawn Copy/FincareReport
    // and must be skipped. See the identical fix in part-release-offline.page.ts.
    const kebabButtons = this.page.locator(
      "xpath=//button[.//mat-icon[normalize-space(text())='more_vert']]",
    );
    const rowCount = await kebabButtons.count();
    let foundEligibleRow = false;
    for (let i = 0; i < rowCount; i++) {
      await kebabButtons.nth(i).click();
      await this.waitForLoaderToDisappear();

      if ((await this.jewllaryRelease().count()) > 0) {
        await this.jewllaryRelease().click();
        await this.waitForLoaderToDisappear();
        foundEligibleRow = true;
        break;
      }

      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
    if (!foundEligibleRow) {
      throw new Error(
        `No loan row with "Jewellery Release" available was found among ${rowCount} filtered rows for firstName="${data.firstName}".`,
      );
    }
    await this.page.waitForTimeout(5000);

    await this.fullReleaseBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnProced().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.selPayment().selectOption({ label: "IMPS" });
    await this.page.waitForTimeout(2000);

    await this.inputBankName().fill(this.getRandomBankName());
    await this.inputBranchName().fill(this.getRandomBranchName());
    await this.page.waitForTimeout(2000);
    await this.inputBankTransactionID().fill(this.generateTransactionId());
    await this.page.waitForTimeout(2000);

    await this.btnPaymentDone().click();
    await this.waitForLoaderToDisappear();
    await this.btnConfirm().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(10000);
  }

  // ── Actions (from Flow35_FullReleaseOffline.validateFullRelease) ──────────

  /**
   * Port of Java Flow35_FullReleaseOffline.validateFullRelease().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   * NOTE: Flow10_QuickPayment.quikPaymentsuccess() call at start is OMITTED —
   *       precondition handled by createDisbursedLoan() in the spec.
   *
   * Navigates to Funds and Approvals (arrow click), then to Jewellery Release Final Process
   * → Final Full Release → update(). The heavily commented-out approval block is skipped.
   */
  async validateFullRelease(): Promise<void> {
    await this.page.waitForTimeout(5000);
    //await this.initiateFullReleaseOffline();
    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    // Confirmed live: selecting any branch scope other than the appraiser account's own
    // assigned branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.fullReleaseApproval().click();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(5000);
    console.log(customerData.customerId);
    await this.waitForLoaderToDisappear();
    // noWaitAfter: see the fix in initiateFullReleaseOffline() above.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();

    if ((await this.updatebtn().count()) > 0) {
      await this.updatebtn().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(2000);
      // await this.selStatus().selectOption({ label: "Completed" });
      await this.page.waitForTimeout(2000);
      await this.updatePayment().click();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(5000);
    }

    await this.assignReleaser().click();
    await this.page.waitForTimeout(5000);
    const userType = this.page.locator("//select[@formcontrolname='userType']");
    await userType.waitFor({ state: "visible", timeout: 30000 });
    await userType.selectOption("appraiser");
    await this.page.waitForTimeout(5000);

    const appraiser = this.page.locator(
      "//select[@formcontrolname='appraiserId']",
    );
    await appraiser.waitFor({ state: "visible", timeout: 30000 });
    await appraiser.selectOption("2717");
    await appraiser.dispatchEvent("change");
    await this.page.waitForTimeout(5000);
    await this.btnAdd().click();
    await this.page.waitForTimeout(5000);

    const ele1 = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
    await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(2000);
    await this.btnJwellaryReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(2000);
    await this.fullReleaseFinalProcess().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // "Full Release Final Process" also defaults to an empty ("No records found") grid —
    // same Customer Unique ID + Filter pattern as every other approval screen in this flow.
    await this.textField().fill(customerData.customerId.trim());
    await this.page.waitForTimeout(2000);
    // noWaitAfter: see the fix in initiateFullReleaseOffline() above.
    await this.filterbtn().click({ noWaitAfter: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.update();
    await this.page.waitForTimeout(2000);
  }

  // ── Actions: update (from Flow35_FullReleaseOffline.update) ──────────────

  /**
   * Port of Java Flow35_FullReleaseOffline.update() (same as PO15/PO16 pattern).
   */
  async update(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    const element = this.btnCollect();
    await element.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await element.waitFor({ state: "visible" });
    await element.click();
    await this.waitForLoaderToDisappear();

    const eleme = this.page.locator(
      "xpath=//div[@class='col-7 d-flex align-items-center']",
    );
    const str1 = (await eleme.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(str1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.inputMobileNumber().fill(data.partnerNumber);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateOTP().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(15000);
    const element1 = this.customerHomeIn();
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.waitFor({ state: "visible" });
    await element1.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const elemen = this.page.locator(
      "xpath=//div[@class='col-7 d-flex align-items-center']",
    );
    const strng1 = (await elemen.innerText()).trim();
    await this.page.waitForTimeout(2000);
    await this.inputField().fill(strng1);

    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.btnCamera().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill("1234");
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnUpdateOTP().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Actions (from Flow35_FullReleaseOffline.deposit) ─────────────────────

  /**
   * Port of Java Flow35_FullReleaseOffline.deposit().
   *
   * NOTE: loginWithAppraiser() is OMITTED. Caller must loginAs('appraiser') first.
   *
   * Navigates to Funds and Approvals → Jewellery Release Approval → Full Release Approval,
   * filters Pending, scrolls to Update, marks Completed.
   */
  async deposit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    const element1 = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await element1.click();
    await this.page.waitForTimeout(5000);

    const ele = this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );
    await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await this.page.waitForTimeout(5000);
    await this.jwellaryReleaseApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.fullReleaseApproval().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });

    await this.page.waitForTimeout(2000);
    const filterEl = this.btnFilter();
    await filterEl.evaluate((el: any) => el.scrollIntoView(true));
    filterEl.waitFor({ state: "visible" });
    await this.page.mouse.dblclick(0, 0); // double-click as in Java (actions.doubleClick)
    // use explicit double click on the element
    const filterRect = await filterEl.boundingBox();
    if (filterRect) {
      await this.page.mouse.dblclick(
        filterRect.x + filterRect.width / 2,
        filterRect.y + filterRect.height / 2,
      );
    }
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);

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

    const elee = this.updatebtn();
    await elee.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await elee.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(3000);
    const selectStatusDropdown1 = this.page.locator(
      "xpath=//select[@formcontrolname='amountStatus']",
    );
    await selectStatusDropdown1.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown1.selectOption({ label: "Completed" });
    await this.page.waitForTimeout(2000);
    await this.btupdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
  }
}
