import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { RenewLoanPage } from "./renew-loan.page";
import fs from "fs";
import { TestDataFactory } from "../../utils/data/test-data.factory";

/**
 * Port of Java: PO23_PartReleaseOffline (locators) + Flow36_PartReleaseOffline (actions)
 *
 * PO23_PartReleaseOffline provides offline-payment locators (bank name, branch name, transaction ID,
 * status selects, update buttons, camera, Yes button) reused across many TC04 flows.
 *
 * Methods ported:
 *   - validatePartReleaseOffline()  ← Flow36.validatePartReleaseOffline()
 *   - deposit()                     ← Flow36.deposit()
 *
 * Cross-page locator notes:
 *   - All navigation locators re-declared locally following house style.
 *   - PO08_PacketSubmissionAppraiser locators re-declared for update().
 *   - PO15_PartRelease locators re-declared for approval portion.
 *   - PO16_FullRelease locators re-declared for navigation.
 *   - PO10_QuickPayment.loc_btnFilter re-declared as btnFilter.
 *
 * Omitted loginWith* calls:
 *   - validatePartReleaseOffline() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *   - deposit() called loginWithAppraiser() — OMITTED. Role = appraiser.
 *
 * Data note: Java used static `partnerNumber` → mapped to getLoginData().accountNumber.
 * Java C:\\ file paths omitted (upload is optional / guarded).
 */
export class PartReleaseOfflinePage extends AdminBasePage {
  private renewLoanPage = new RenewLoanPage(this.page);
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO23_PartReleaseOffline) ───────────────────────────────

  private readonly inputBankName = () =>
    this.page.locator("xpath=//input[@formcontrolname='bankName']");
  private readonly inputBranchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='branchName']");
  private readonly inputBankTransactionID = () =>
    this.page.locator("xpath=//input[@formcontrolname='transactionId']");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnUpdate = () =>
    this.page.locator("xpath=(//button[contains(.,'Update Appraiser')] )[1]");
  private readonly selStatus = () =>
    this.page.locator("xpath=//select[@formcontrolname='amountStatus']");
  private readonly btnCamera = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );

  private readonly btnDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  private readonly btncutomRadio = () =>
    this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[3]");
  private readonly btnNextduedateRadio = () =>
    this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[2]");
  private readonly paymentAmount = () =>
    this.page.locator("xpath=//input[@type='text']");
  private readonly updatebtn = () =>
    this.page.locator("xpath=(//button[contains(.,'Update')])[1] ");
  private readonly btupdate = () =>
    this.page.locator("xpath=//span[contains(.,'Update')]");

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
  private readonly btnDoneAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // Inline branch dropdown
  private readonly branchDropdown = () =>
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  private readonly appraisalRequest = () =>
    this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly selectAppraiser = () =>
    this.page.locator("xpath=//select[@formcontrolname='appraiserId']");

  private readonly customerManagementBtn = () =>
    this.page.locator(
      "xpath=(//span[normalize-space()='Customer Management'])[1]",
    );
  // PO08_PacketSubmissionAppraiser locators (re-declared)
  private readonly textField = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  // PO_Common.loc_loanManagement
  private readonly loanManagement = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Management']");
  // PO01_KycSel.loc_firstName
  private readonly firstNameFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  // PO01_KycSel.loc_filterbtn
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  // PO10_QuickPayment.loc_LoanDetails
  private readonly loanDetails = () =>
    this.page.locator("xpath=//span[normalize-space()='Loan Details']");
  // PO10_QuickPayment.loc_btnDone (payment done button)
  private readonly btnPaymentDone = () =>
    this.page.locator("xpath=//span[normalize-space()='Done']");
  // PO10_QuickPayment.loc_btnConfirm
  // Scoped to a <button> — a bare span[text()='Confirm'] also matches an unrelated stray span
  // elsewhere on the Jewellery Release page, causing a strict-mode violation.
  private readonly btnConfirm = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Confirm']]");
  // PO10_QuickPayment.loc_btnFilter
  private readonly btnFilter = () =>
    this.page.locator("xpath=//span[normalize-space()='Filter']");
  // PO10_QuickPayment.loc_selPayment
  private readonly selPayment = () =>
    this.page.locator("xpath=//select[@name='showPaymentValue']");
  // PO15_PartRelease.loc_partRelease
  private readonly partRelease = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Part Release Approval']",
    );
  // PO15_PartRelease.loc_customerIDfield
  private readonly customerIDfield = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique ID']");
  // PO15_PartRelease.loc_btnUpdte
  private readonly btnUpdte = () =>
    this.page.locator("xpath=(//span[contains(.,'Update')] )[1]");
  // PO15_PartRelease.loc_btnJwellaryReleaseFinalProcess
  private readonly btnJwellaryReleaseFinalProcess = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    );
  // PO15_PartRelease.loc_partReleaseFinalProcess
  private readonly partReleaseFinalProcess = () =>
    this.page.locator("xpath=//span[normalize-space()='Final Part Release']");
  // PO15_PartRelease.loc_btnCollect
  private readonly btnCollect = () =>
    this.page.locator("xpath=//button[normalize-space()='Collect']");
  // PO15_PartRelease.loc_customerHomeIn
  private readonly customerHomeIn = () =>
    this.page.locator("xpath=//button[normalize-space()='Customer Home In']");
  // PO15_PartRelease.loc_btnCamera (fa-camera)
  private readonly btnCameraFa = () =>
    this.page.locator("xpath=//i[@class='fas fa-camera']");
  // PO15_PartRelease.loc_btnAttach
  private readonly btnAttach = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
  // PO15_PartRelease.loc_btnUpdateAppraiser
  private readonly btnUpdateAppraiser = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='apply-kyc'][normalize-space()='Update Appraiser'])[1]",
    );
  // PO16_FullRelease.loc_jewllaryRelease
  private readonly jewllaryRelease = () =>
    this.page.locator("xpath=//button[normalize-space()='Jewellery Release']");
  // PO16_FullRelease.loc_jwellaryReleaseApproval
  private readonly jwellaryReleaseApproval = () =>
    this.page.locator(
      "xpath=//span[normalize-space()='Jewellery Release Approval']",
    );

  // PO16_FullRelease.loc_btnProced
  private readonly btnProced = () =>
    this.page.locator("xpath=//button[.//span[normalize-space()='Proceed']]");
  // Date/time pickers (re-declared from PO16_FullRelease)
  private readonly selDate = () =>
    this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow = () =>
    this.page.locator("xpath=//div[@class='mat-calendar-arrow']");
  private readonly selYear = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[1]",
    );
  private readonly selMonth = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
  private readonly selDay = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-calendar-body-cell-content'])[2]",
    );
  private readonly selTimeFrom = () =>
    this.page.locator("xpath=//input[@placeholder='From']");
  private readonly selTime = () =>
    this.page.locator("xpath=//span[@class='active']");
  private readonly btnOk = () =>
    this.page.locator("xpath=//span[normalize-space()='Ok']");
  private readonly selTimeTo = () =>
    this.page.locator("xpath=//input[@placeholder='To']");
  private readonly selTimeINPM = () =>
    this.page.locator("xpath=//button[normalize-space()='PM']");
  private readonly selTimeTHour = () =>
    this.page.locator("xpath=//span[@class='active']");
  // PO04_NewGoldLoan.loc_btnNext (re-declared for part release final process)
  private readonly btnNext = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Next']]");
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
  private readonly btnOTPUpdate = () =>
    this.page.locator("xpath=//span[normalize-space()='Update']");
  private readonly AssignPacket = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='red-button'][normalize-space()='Assign Packet'])[1]",
    );
  private readonly selectPacket = () =>
    this.page.locator("xpath=//select[@formcontrolname='packetId']");
  private readonly btnAddPacket = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly ornamenttype = () =>
    this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly btnSave = () =>
    this.page.locator("xpath=//span[contains(.,'Save')]");
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer Unique Id']");
  // Jewellery Type dropdown's "Select All" option. The native checkbox <input> is zero-size/hidden
  // (custom-checkbox CSS pattern) — target the visible <label> wrapper instead, which natively
  // toggles the nested checkbox. Matched by "Select All" text rather than position (index [1])
  // so this doesn't silently pick a different ornament if the dropdown's option order changes.
  // NOTE: class attribute is actually "custom-checkbox ng-star-inserted" — use contains(), not an
  // exact @class= match, or Angular's appended ng-star-inserted class breaks the match entirely.
  private readonly checkbox = () =>
    this.page.locator("xpath=//label[contains(@class,'custom-checkbox')][contains(normalize-space(.),'Select All')]");
  private readonly btnUploadDocuments = () =>
    this.page.locator(
      "xpath=(//button[@ng-reflect-klass='primary-button'][normalize-space()='UPLOAD DOCUMENTS'])[1]",
    );
  private readonly btnYesAssign = () =>
    this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly partnerApproval = () =>
    this.page.locator("xpath=//button[contains(.,'PARTNER APPROVAL')]");
  // PO07_OpsTeamLoanApproval.loc_checkClick
  private readonly checkClick = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectApplicationFormForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_checkClick1
  private readonly checkClick1 = () =>
    this.page.locator(
      "xpath=//img[contains(@name,'incorrectGoldValuationForOperatinalTeam')]",
    );
  // PO07_OpsTeamLoanApproval.loc_btnSubmit
  private readonly btnSubmitOps = () =>
    this.page.locator("xpath=//button[span[normalize-space()='Submit']]");
  // ── Actions (from Flow17_PartReleaseLoan.partRelease) ─────────────────────

  /**
   * Port of Java Flow1
  // ── Helper ────────────────────────────────────────────────────────────────
 */ getRandomAPacketCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  /** Reads the customer ID most recently written by CustomerManagementPage during onboarding. */
  private getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

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

  async validatePartReleaseOffline(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();

    // paymentPartRelease
    // await this.loanManagement().click();
    // await this.page.waitForTimeout(2000);
    // const el = this.loanDetails();
    // await el.scrollIntoViewIfNeeded();
    // await el.click();
    // await this.waitForLoaderToDisappear();

    // await this.firstNameFilter().fill(data.firstName);
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // await this.filterbtn().click();
    // await this.waitForLoaderToDisappear();

    // // Scan rows for one that still offers "Jewellery Release" in its kebab menu — a loan already
    // // released by a prior run only shows View Loan/Pawn Copy/FincareReport and must be skipped.
    // const kebabButtons = this.page.locator("xpath=//button[.//mat-icon[normalize-space(text())='more_vert']]");
    // const rowCount = await kebabButtons.count();
    // let customerId = '';
    // let foundEligibleRow = false;
    // for (let i = 0; i < rowCount; i++) {
    //   await kebabButtons.nth(i).click();
    //   await this.waitForLoaderToDisappear();

    //   if ((await this.jewllaryRelease().count()) > 0) {
    //     const idCell = this.page.locator(`xpath=(//td[@class='ui-resizable-column p-element p-frozen-column ng-star-inserted'])[${i + 1}]`);
    //     customerId = (await idCell.innerText()).trim();
    //     await this.jewllaryRelease().click();
    //     await this.waitForLoaderToDisappear();
    //     foundEligibleRow = true;
    //     break;
    //   }

    //   await this.page.keyboard.press('Escape');
    //   await this.page.waitForTimeout(300);
    // }
    // if (!foundEligibleRow) {
    //   throw new Error(`No loan row with "Jewellery Release" available was found among ${rowCount} filtered rows for firstName="${data.firstName}".`);
    // }
    // await this.page.waitForTimeout(5000);

    // // The native checkbox <input> is zero-size/hidden (custom-checkbox CSS pattern) — click the
    // // visible <label> wrapper instead, which natively toggles the nested checkbox.
    // const elem = this.page.locator("xpath=(//label[@class='custom-checkbox'])[1]");
    // await this.page.waitForTimeout(500);
    // await elem.click();

    // await this.page.locator("xpath=//button[.//span[normalize-space()='Release']]").click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);

    // const loanAmountText = await this.page.evaluate(() => {
    //   const tables = Array.from(document.querySelectorAll('table, [role="table"]'));
    //   for (const table of tables) {
    //     const headers = Array.from(table.querySelectorAll('th, [role="columnheader"]')).map((h) => h.textContent?.trim());
    //     const idx = headers.findIndex((h) => h === 'Loan Amount');
    //     if (idx >= 0) {
    //       const rows = Array.from(table.querySelectorAll('tr, [role="row"]'));
    //       const dataRow = rows.find((r) => r.querySelectorAll('td, [role="cell"]').length > 0);
    //       const cells = dataRow ? Array.from(dataRow.querySelectorAll('td, [role="cell"]')) : [];
    //       if (cells[idx]?.textContent) return cells[idx].textContent;
    //     }
    //   }
    //   return null;
    // });
    // const loanAmount = loanAmountText ? parseFloat(loanAmountText.replace(/[₹,]/g, '')) : NaN;
    // console.log(`DEBUG loanAmountText=${JSON.stringify(loanAmountText)} loanAmount=${loanAmount}`);

    // const selScheme = this.page.locator("xpath=//select[@formcontrolname='schemeId']");
    // const schemeOptions = await selScheme.locator('option').allTextContents();
    // let schemeIndex = -1;
    // if (!Number.isNaN(loanAmount)) {
    //   schemeIndex = schemeOptions.findIndex((o) => {
    //     const match = o.match(/\(([\d,]+)\s*-\s*([\d,]+)\)/);
    //     if (!match) return false;
    //     const min = parseFloat(match[1].replace(/,/g, ''));
    //     const max = parseFloat(match[2].replace(/,/g, ''));
    //     return loanAmount >= min && loanAmount <= max;
    //   });
    // }
    // if (schemeIndex < 0) {
    //   schemeIndex = schemeOptions.findIndex((o) => o.trim().includes('ONLY_SECUAT_TS_32'));
    // }
    // console.log(`DEBUG schemeIndex=${schemeIndex} chosenOption=${JSON.stringify(schemeOptions[schemeIndex >= 0 ? schemeIndex : 1])}`);
    // await selScheme.selectOption({ index: schemeIndex >= 0 ? schemeIndex : 1 });
    // await this.page.waitForTimeout(1000);

    // // Select loan purpose. formcontrolname is 'loanPurpose'; options only populate after a
    // // scheme is selected. Required field — the Proceed button won't render without it.
    // const selPurpose = this.page.locator("xpath=//select[@formcontrolname='loanPurpose']");
    // await selPurpose.selectOption({ index: 1 });
    // await this.page.waitForTimeout(500);

    // const proceedBtn = this.btnProced();
    // await proceedBtn.scrollIntoViewIfNeeded();
    // await proceedBtn.dblclick();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);

    // const selectStatusDropdown = this.selPayment();
    // await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView({ block: 'nearest', inline: 'center' }));
    // await selectStatusDropdown.click();
    // await selectStatusDropdown.selectOption({ label: 'IMPS' });

    // await this.inputBankName().fill(this.getRandomBankName());
    // await this.inputBranchName().fill(this.getRandomBranchName());
    // await this.page.waitForTimeout(2000);
    // await this.inputBankTransactionID().fill(this.generateTransactionId());
    // await this.page.waitForTimeout(2000);
    // await this.btnPaymentDone().click();
    // await this.waitForLoaderToDisappear();
    // await this.btnConfirm().click();
    // await this.waitForLoaderToDisappear();
    // await this.btnYes().click();
    await this.waitForLoaderToDisappear();

    // await this.page.waitForTimeout(15000);

    // Funds and Approvals → Jewellery Release Approval → Part Release
    // const element1 = this.page.locator(
    //   "xpath=//span[normalize-space()='Funds and Approvals']",
    // );
    // await element1.evaluate((el: any) =>
    //   el.scrollIntoView({ block: "center" }),
    // );
    // await element1.click();
    // await this.page.waitForTimeout(5000);

    // const ele = this.page.locator(
    //   "xpath=//span[normalize-space()='Jewellery Release Approval']",
    // );
    // await ele.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    // await this.page.waitForTimeout(5000);
    // await this.jwellaryReleaseApproval().click();
    // await this.waitForLoaderToDisappear();
    // await this.partRelease().click();
    // await this.waitForLoaderToDisappear();
    // await this.textField().fill(customerData.customerId.trim());
    // await this.page.waitForTimeout(2000);
    // console.log(customerData.customerId);
    // //await this.customerIDfield().fill(customerId);
    // const element2 = this.page.locator(
    //   "xpath=//span[normalize-space()='Filter']",
    // );
    // await element2.evaluate((el: any) =>
    //   el.scrollIntoView({ block: "center" }),
    // );
    // await this.page.waitForTimeout(5000);
    // await element2.click();
    // await this.waitForLoaderToDisappear();

    // await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    // await this.page.waitForTimeout(5000);

    // const scrollContainer = this.page.locator(
    //   "xpath=//div[@class='mat-table__wrapper']",
    // );
    // await scrollContainer.evaluate((el: any) => {
    //   el.scrollLeft = el.scrollWidth;
    // });
    // await this.page.waitForTimeout(3000);

    // await this.btnUpdate().click();
    // // await this.waitForLoaderToDisappear();

    // // await this.page.waitForTimeout(2000);
    // // await this.selStatus().selectOption({ label: "Completed" });
    // await this.page.waitForTimeout(5000);
    // await this.waitForLoaderToDisappear();
    // await this.btnUpdte().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // const ele1 = this.page.locator(
    //   "xpath=//span[normalize-space()='Jewellery Release Final Process']",
    // );
    // await ele1.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    // await this.page.waitForTimeout(10000);
    // await this.btnJwellaryReleaseFinalProcess().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);
    // await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    // await this.page.waitForTimeout(2000);
    // await this.partReleaseFinalProcess().click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // await this.waitForLoaderToDisappear();
    // await this.textField().fill(customerData.customerId.trim());
    // await this.page.waitForTimeout(2000);
    // console.log(customerData.customerId);
    // //await this.customerIDfield().fill(customerId);
    // const element3 = this.page.locator(
    //   "xpath=//span[normalize-space()='Filter']",
    // );
    // await element3.evaluate((el: any) =>
    //   el.scrollIntoView({ block: "center" }),
    // );
    // await this.page.waitForTimeout(5000);
    // await element3.click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);
    // await this.update();
    await this.page.waitForTimeout(2000);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.appraisalRequest().waitFor({ state: "visible" });
    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const customerIdForOffline = this.getCurrentCustomerId();
    await this.textField().fill(customerIdForOffline);
    console.log(customerIdForOffline);
    await this.page.waitForTimeout(5000);
    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await this.page.evaluate(
      (el) => {
        (el as any).scrollLeft = (el as any).scrollWidth;
      },
      await scrollDiv.elementHandle(),
    );
    await this.page.waitForTimeout(3000);
    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);
    await this.page
      .locator("//button[contains(@class,'mat-menu-trigger')]")
      .first()
      .click();
    await this.page.waitForTimeout(2000);
    await this.page.getByRole("menuitem", { name: "Apply Loan" }).click();
    await this.page.waitForTimeout(4000);
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(3000);
    await this.clickNextSafely(3);
    const calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    await calculateBtn.waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(3000);
    await calculateBtn.click();
    await this.page.waitForTimeout(3000);

    const el1 = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    await el1.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);
    await this.btnNext().click();
    await this.page.waitForTimeout(5000);

    const ele2 = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    await ele2.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);
    await this.btnNext().click();
  }

  // ── Actions: update (from Flow36_PartReleaseOffline.update) ──────────────

  /**
   * Port of Java Flow36_PartReleaseOffline.update().
   * Clicks Collect, reads barcode, fills field, verifies, OTP, updates, Customer Home In.
   */
  async update(): Promise<void> {
    const data = getLoginData();

    const btnCollect = this.page.locator(
      "xpath=//button[normalize-space()='Collect']",
    );
    await this.page.waitForTimeout(2000);
    await btnCollect.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await btnCollect.waitFor({ state: "visible" });
    await btnCollect.click();
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
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnOTPUpdate().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const btnCustomerHomeIn = this.page.locator(
      "xpath=//button[normalize-space()='Customer Home In']",
    );
    await this.page.waitForTimeout(2000);
    await btnCustomerHomeIn.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await btnCustomerHomeIn.waitFor({ state: "visible" });
    await btnCustomerHomeIn.click();
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
    await this.btnCameraFa().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnAttach().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.btnOTP().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.inputOTP().fill("1234");
    await this.page.waitForTimeout(500);
    await this.btnVerify().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnOTPUpdate().click();
    await this.waitForLoaderToDisappear();
  }
  async assignPacket(packetCode: string): Promise<void> {
    const data1 = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    const customerIdForAssignPacket = this.getCurrentCustomerId();
    await this.customerUniqID().fill(customerIdForAssignPacket);
    console.log(customerIdForAssignPacket);
    // await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.AssignPacket().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.selectPacket().click();
    await this.waitForLoaderToDisappear();

    //     // Select the packet option containing the code (Java line 109: String code = packetCode.trim())
    const code = packetCode.trim();

    const options = await this.selectPacket()
      .locator("option")
      .allTextContents();

    console.log("Packet Code:", code);
    console.log("Dropdown Options:", options);

    await this.selectPacket().selectOption({
      label: `${code} (${code})`,
    });
    await this.page.waitForTimeout(5000);

    await this.ornamenttype().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.checkbox().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAddPacket().click();
    await this.waitForLoaderToDisappear();

    //await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(2000);

    for (let i = 0; i < 4; i++) {
      const placeholder = this.page
        .locator("//img[contains(@src,'image-placeholder.png')]")
        .first();

      await placeholder.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await placeholder.click();

      const cameraBtn = this.page.locator("//img[contains(@src,'camera.svg')]");

      await cameraBtn.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await cameraBtn.click();

      await this.page.waitForTimeout(5000);
    }

    await this.page.waitForTimeout(2000);

    await this.btnSave().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();

    await this.btnUploadDocuments().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    console.log("Before validateUploadDocuments");
    await this.renewLoanPage.validateUploadDocumnets();
    console.log("After validateUploadDocuments");
    await this.page.waitForTimeout(15000);
    // await this.assignPacketPage.downloadAndUploadCashReceipt();
    // await this.page.waitForTimeout(5000);
    // // Download and re-upload Cash Declaration
    // await this.assignPacketPage.downloadAndUploadCashDeclaration();
    // await this.page.waitForTimeout(5000);
    // Save
    const saveBtn = this.page.locator(
      "xpath=//button[normalize-space()='Save']",
    );
    await saveBtn.waitFor({ state: "attached", timeout: 30000 });
    //await saveBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await this.jsClick(saveBtn);
    await this.page.waitForTimeout(2000);
    await this.waitForLoaderToDisappear();

    // Yes
    await this.btnYesAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // // Lead converter dropdown
    const dropdownEle = this.page.locator(
      "xpath=//select[@formcontrolname='leadConverterId']",
    );
    await dropdownEle.waitFor({ state: "visible", timeout: 20000 });
    await this.page.waitForTimeout(1000);
    try {
      await dropdownEle.selectOption({ label: "Priyanka Thorat" });
    } catch {
      // option not available — skip
    }
    await this.page.waitForTimeout(1000);
    await this.btnDoneAssign().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }

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
    await this.partRelease().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(5000);
    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@ng-reflect-name='amountStatus']",
    );
    await selectStatusDropdown.evaluate((el: any) => el.scrollIntoView(true));
    await selectStatusDropdown.selectOption({ label: "Pending" });
    await this.btnFilter().click();
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
  async partnerPartReleaseApproval(): Promise<void> {
    const data = getLoginData();

    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.loanManagement().click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    //await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter().fill(data.firstName);
    await this.page.waitForTimeout(2500);
    await this.filterbtn().click();
    await this.page.waitForTimeout(5000);

    await this.partnerApproval().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1000);

    await this.clickNextSafely(7);
    await this.page.waitForTimeout(5000);

    await this.checkClick().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.checkClick1().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    const statusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForPartner']",
    );
    await statusDropdown.selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    await this.btnSubmitOps().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
  }
  async clickNextSafely(times: number = 1) {
    for (let i = 0; i < times; i++) {
      const nextBtn = this.page
        .locator("//button[span[normalize-space()='Next']]")
        .first();

      await nextBtn.waitFor({
        state: "visible",
        timeout: 30000,
      });

      await nextBtn.scrollIntoViewIfNeeded();

      console.log(`Clicking Next button: ${i + 1}`);

      await nextBtn.click();

      await this.page.waitForTimeout(1000);
    }
  }
}
