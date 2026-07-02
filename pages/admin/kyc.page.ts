import { Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";
import { existsSync } from "fs";
import customerData from "../../testdata/admin/documents/customerData.json";
import fs from "fs";

/**
 * Port of Java: PO01_KycSel (locators) + Flow01_Kyc (actions)
 *
 * Cross-page locator notes:
 *   - `arrow` re-declares PO_CustomerManagement.loc_arrow (same XPath).
 *   - `btnNextFromPO04` re-declares PO04_NewGoldLoan.loc_btnNext (same XPath) — used in
 *     ValidatePersonalDetails() via Flow04_NewGoldLoan.safeClick().
 *   - `profile` re-declares PO_LoginLogout.loc_Profile (same XPath).
 *
 * File upload TODOs:
 *   - ClickonKyc(): PAN card upload was done via Java AWT Robot / sendKeys to hidden input.
 *     Best-effort Playwright implementation uses setInputFiles(); requires a real file path at runtime.
 *   - addressandIdentity(): Aadhaar front-face upload was done via sendKeys to input#file.
 *     Best-effort Playwright implementation uses setInputFiles(); requires a real file path at runtime.
 *   - ValidatePersonalDetails(): Signature upload was done via sendKeys to (//input[@type='file'])[2].
 *     Best-effort Playwright implementation uses setInputFiles(); requires a real file path at runtime.
 *   All three are flagged DONE_WITH_CONCERNS — paths must be wired from test config/env vars.
 */
export class KycPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO01_KycSel) ────────────────────────────────────────────

  private readonly mobileNumber = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Mobile Number']");
  private readonly firstName_kycFilter = () =>
    this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly applyKyc = () =>
    this.page.locator("xpath=//button[normalize-space()='Apply KYC']").first(); // select first match to avoid strict mode violation
  private readonly radiobtn = () =>
    this.page.locator(
      "xpath=//mat-radio-button[.//div[contains(normalize-space(),'Manual')]]",
    );
  private readonly panfield = () =>
    this.page.locator("xpath=//input[@placeholder='PAN']");
  private readonly selPan = () =>
    this.page.locator("xpath=//select[@formcontrolname='panType']");
  private readonly btnNext = () =>
    this.page
      .locator("xpath=//button[.//span[normalize-space()='Next']]")
      .first();
  private readonly btnYes = () =>
    this.page
      .locator("xpath=//button[.//span[normalize-space()='Yes']]")
      .first();
  private readonly aadharfield = () =>
    this.page.locator("xpath=//input[@class='form-control']");
  private readonly checkMark = () =>
    this.page.locator("xpath=//span[@class='checkmark top-0']");
  private readonly seladhar = () =>
    this.page.locator(
      "xpath=(//select[@formcontrolname='addressProofTypeId'])[1]",
    );
  private readonly addresField = () =>
    this.page.locator("xpath=//textarea[@id='permanent-address']");
  private readonly uniqueCusyomerNumber = () =>
    this.page.locator(
      "xpath=(//label[@class='mandatory font-weight-500 text-color'][normalize-space()='Unique Identity No.']//following::input)[1]",
    );
  private readonly landMark = () =>
    this.page.locator("xpath=//input[@id='permanent-landmark']");
  private readonly landMarkField = () =>
    this.page.locator("xpath=//input[@id='permanent-landmark']");
  private readonly radiobtn1 = () =>
    this.page.locator("xpath=(//div[@class='mat-radio-inner-circle'])[2]");
  private readonly btnyes = () =>
    this.page
      .locator("xpath=//button[@type='submit' and contains(., 'Yes')]")
      .first();
  private readonly profileLink = () =>
    this.page.locator(
      "xpath=//label[normalize-space()='Upload Profile Picture']",
    );
  private readonly imgCamera = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
  private readonly Radio = () =>
    this.page.locator("xpath=(//div[@class='mat-radio-outer-circle'])[1]");
  private readonly dateInput = () =>
    this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow = () =>
    this.page.locator("xpath=(//div[@class='mat-calendar-arrow'])[1]");
  private readonly dateArrow1 = () =>
    this.page.locator("xpath=//button[@aria-label='Previous 20 years']");
  private readonly dateYear = () =>
    this.page.locator("xpath=//div[normalize-space()='2003']");
  private readonly dateMonth = () =>
    this.page.locator("xpath=//div[normalize-space()='JAN']");
  private readonly dateDay = () =>
    this.page.locator(
      "xpath=//div[@class='mat-calendar-body-cell-content'][normalize-space()='1']",
    );
  private readonly Radio1 = () =>
    this.page.locator(
      "xpath=//label[@for='mat-radio-10-input']//div[@class='mat-radio-inner-circle']",
    );
  private readonly occupation = () =>
    this.page.locator("xpath=//input[@role='combobox']");
  private readonly txtSpouseName = () =>
    this.page.locator("xpath=//input[@formcontrolname='spouseName']");
  private readonly txtMotherName = () =>
    this.page.locator("xpath=//input[@formcontrolname='motherName']");
  private readonly mobileField = () =>
    this.page.locator("xpath=//input[@placeholder='Mobile Number']");
  private readonly qualification = () =>
    this.page.locator("xpath=//select[@formcontrolname='qualificationId']");
  private readonly btnok = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly img = () =>
    this.page.locator(
      "xpath=(//div[@class='offset-4 img-container ng-star-inserted'])[2]",
    );
  private readonly btnReviewandSubmit = () =>
    this.page
      .locator("xpath=//button[.//span[normalize-space()='Review & Submit']]")
      .first();
  private readonly clickUserMangaement = () =>
    this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly clickInternalUser = () =>
    this.page.locator("xpath=//span[normalize-space()='Internal User']");
  private readonly ArrowNavi = () =>
    this.page.locator(
      "xpath=//select[@id='branch']//following::option[contains(.,'Augmont Amritsar')]",
    );
  private readonly searchField = () =>
    this.page.locator(
      "xpath=//div[@class='d-none d-md-inline']//following::input[@placeholder='Search...'][1]",
    );
  private readonly btnEdit = () =>
    this.page.locator("xpath=//div[@class='kt-pointer ng-star-inserted']");
  private readonly selArrow = () =>
    this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly chkRadio = () =>
    this.page.locator(
      "xpath=//div[@id='a789ec98fd87-5']//span[@class='checkmark checkmark-custom']",
    );
  private readonly btnUpdate = () =>
    this.page.locator(
      "xpath=//button[contains(.,'Update') and contains(@class,'submit')]",
    );
  private readonly selBranch = () =>
    this.page.locator(
      "xpath=(//span[contains(.,'Augmont Amritsar')]//following::input[@type='checkbox'][6])[1]",
    );
  private readonly customerUniqID = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Customer ID']");

  // Cross-page re-declarations
  // PO_CustomerManagement.loc_arrow
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  // PO_LoginLogout.loc_Profile
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  // PO04_NewGoldLoan.loc_btnNext (used via Flow04_NewGoldLoan.safeClick in ValidatePersonalDetails)
  private readonly btnNextPO04 = () =>
    this.page
      .locator("xpath=//button[span[normalize-space() = 'Next']]")
      .first();

  // ── File Upload Helper ──────────────────────────────────────────────────────

  /**
   * Upload a file with proper error handling and logging.
   * @param filePath Absolute or relative file path (relative paths resolved from project root)
   * @param fileInputSelector XPath or selector for the file input element
   * @param description Human-readable description (e.g., "PAN card", "Aadhaar", "Signature")
   * @param fileInputIndex Optional 0-based index when multiple file inputs match the selector (default: 0)
   */
  public async uploadFileWithValidation(
    filePath: string | undefined,
    fileInputSelector: string,
    description: string,
    fileInputIndex: number = 0,
  ): Promise<void> {
    if (!filePath) {
      console.log(`⊘ ${description} upload skipped (no file path provided)`);
      return;
    }

    // Resolve relative paths from project root
    const resolvedPath =
      filePath.startsWith("/") || filePath.match(/^[A-Z]:/)
        ? filePath
        : require("path").resolve(process.cwd(), filePath);

    if (!existsSync(resolvedPath)) {
      console.warn(
        `⚠ ${description} file not found: ${resolvedPath}\n` +
          `  Skipping upload. Configure path in .env: *_${description.toUpperCase().replace(/ /g, "_")}_PATH`,
      );
      return;
    }

    try {
      const fileInput = this.page.locator(fileInputSelector);
      const count = await fileInput.count();

      if (count === 0) {
        console.warn(
          `⚠ ${description} file input not found on page (selector: ${fileInputSelector})`,
        );
        return;
      }

      if (fileInputIndex >= count) {
        console.warn(
          `⚠ ${description} file input index ${fileInputIndex} out of range (found ${count} input(s))`,
        );
        return;
      }

      console.log(`↗ Uploading ${description}: ${resolvedPath}`);
      const targetInput = fileInput.nth(fileInputIndex);

      // Ensure the input is in the DOM and ready
      await targetInput.waitFor({ state: "attached" });
      console.log(`  → File input at index ${fileInputIndex} is ready`);

      // Attempt upload with error details
      await targetInput.setInputFiles(resolvedPath);
      console.log(`✓ ${description} uploaded successfully`);

      await this.page.waitForTimeout(2000);
    } catch (err: any) {
      console.error(
        `✗ Failed to upload ${description}:\n` +
          `  Path: ${resolvedPath}\n` +
          `  Selector: ${fileInputSelector}\n` +
          `  Index: ${fileInputIndex}\n` +
          `  Error: ${err.message}\n` +
          `  Stack: ${err.stack}`,
      );
      throw err;
    }
  }

  // ── Actions (from Flow01_Kyc) ───────────────────────────────────────────────

  /**
   * Port of Java Flow01_Kyc.filterCustomer().
   */
  async filterCustomer(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(5000);

    await this.customerUniqID().fill(customerData.customerId);
    console.log(customerData.customerId);
    //await this.firstName_kycFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow01_Kyc.ClickonKyc().
   *
   * TODO(port): PAN card file upload — Java used sendKeys to a hidden input after making it visible
   * via JS. Best-effort uses setInputFiles(). Caller must supply panCardPath.
   * TODO(port): Signature upload — same pattern; caller must supply signaturePath.
   * TODO(port): Aadhaar file upload — caller may supply aadhaarPath; defaults to panCardPath if omitted.
   */
  async ClickonKyc(
    panCardPath?: string,
    signaturePath?: string,
    aadhaarPath?: string,
    imagePath?: string,
  ): Promise<void> {
    const randomPan = this.randomPanGenerator();
    await this.page.waitForTimeout(5000);
    await this.waitForLoaderToDisappear();
    await this.applyKyc().click();
    await this.page.waitForTimeout(5000);
    await this.radiobtn().click();
    await this.waitForLoaderToDisappear();

    await this.selPan().click();
    await this.waitForLoaderToDisappear();
    await this.selectAsPan();
    await this.selPan().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Upload PAN card document (JPG, PNG, or PDF supported)
    await this.uploadFileWithValidation(
      panCardPath,
      "xpath=//input[@type='file']",
      "PAN card",
    );
    await this.page.waitForTimeout(5000);

    await this.panfield().fill(randomPan);

    await this.page.waitForTimeout(1000);

    const btnNextEl = this.btnNext();
    await btnNextEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1500);
    await this.btnNext().click();
    await this.waitForLoaderToDisappear();
    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    // Click second mat-radio-button
    await this.page
      .locator(
        "xpath=//mat-radio-button[contains(@class,'mat-radio-button')][2]",
      )
      .click();
    await this.waitForLoaderToDisappear();

    await this.addressandIdentity(aadhaarPath);
    await this.ValidatePersonalDetails(signaturePath);
    await this.page.waitForTimeout(4000);
    await this.reviewAndSubmit();
  }

  /**
   * Port of Java Flow01_Kyc.parameterSelection().
   */
  async parameterSelection(parameter: string): Promise<void> {
    await this.selPan().selectOption({ label: parameter });
  }

  /**
   * Port of Java Flow01_Kyc.selectAsPan().
   */
  async selectAsPan(): Promise<void> {
    await this.parameterSelection("PAN");
  }

  /**
   * Port of Java Flow01_Kyc.randomPanGenerator().
   */
  randomPanGenerator(): string {
    return TestDataFactory.pan();
  }

  /**
   * Port of Java Flow01_Kyc.addressandIdentity().
   *
   * TODO(port): Aadhaar file upload — Java used sendKeys to input#file (first instance).
   * Best-effort: setInputFiles. Caller supplies aadhaarPath; omit to skip the upload step.
   */
  async addressandIdentity(aadhaarPath?: string): Promise<void> {
    const data = getLoginData();
    const randomAadhar = this.randomAadhar();
    const randomAddress = this.randomAddressGenerator();
    const randomLandMarkVal = this.randomLandmark();

    await this.page.waitForTimeout(5000);

    // Upload Aadhaar document (first file input with id='file')
    await this.uploadFileWithValidation(
      aadhaarPath,
      "xpath=//input[@id='file']",
      "Aadhaar",
      0,
    );
    await this.page.waitForTimeout(10000);

    console.log("Generated Aadhaar:", randomAadhar);
    await this.page.waitForTimeout(5000);

    // Fill Aadhaar field with proper validation
    const aadhaarField = this.aadharfield();
    await aadhaarField.waitFor({ state: "visible" });
    await aadhaarField.click();
    await this.page.waitForTimeout(500);
    await aadhaarField.clear();
    await this.page.waitForTimeout(500);
    await aadhaarField.fill(randomAadhar);
    await this.page.waitForTimeout(1000);

    // Validate that the full value was entered
    const filledValue = await aadhaarField.inputValue();
    if (filledValue !== randomAadhar) {
      console.warn(
        `⚠ Aadhaar field value mismatch. Expected: ${randomAadhar}, Got: ${filledValue}`,
      );
      // Retry with type() method if fill() didn't work
      await aadhaarField.clear();
      await aadhaarField.type(randomAadhar, { delay: 50 });
    }

    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    const checkMarkEl = this.checkMark();
    await checkMarkEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(12000);
    await this.checkMark().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(12000);

    await this.seladhar().selectOption({ label: data.proofName });

    await this.page.waitForTimeout(10000);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.page.evaluate("window.scrollBy(0, 800)");
    const addressEl = this.addresField();
    await addressEl.evaluate((el) => (el as any).scrollIntoView(true));
    await this.page.waitForTimeout(2000);

    await this.addresField().fill(randomAddress);
    await this.waitForLoaderToDisappear();

    const landMarkEl = this.landMark();
    await landMarkEl.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);

    await this.landMarkField().click();
    await this.waitForLoaderToDisappear();
    await this.landMarkField().fill(randomLandMarkVal);
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    await this.btnNext().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnyes().click();
    await this.waitForLoaderToDisappear();
  }

  /**
   * Port of Java Flow01_Kyc.randomAadhar().
   */
  randomAadhar(): string {
    let aadhaar = "2222";
    for (let i = 0; i < 8; i++) {
      aadhaar += Math.floor(Math.random() * 10);
    }
    return aadhaar;
  }

  /**
   * Port of Java Flow01_Kyc.parameterSelectiona().
   */
  async parameterSelectiona(parametera: string): Promise<void> {
    await this.seladhar().selectOption({ label: parametera });
  }

  /**
   * Port of Java Flow01_Kyc.selectAsAadhar().
   */
  async selectAsAadhar(): Promise<void> {
    await this.parameterSelectiona("Aadhaar Card");
  }

  /**
   * Port of Java Flow01_Kyc.randomAddressGenerator().
   */
  randomAddressGenerator(): string {
    const houseNo = Math.floor(100 + Math.random() * 900);
    const pinCode = Math.floor(100_000 + Math.random() * 900_000);
    const cities = ["Mumbai", "Delhi", "Pune", "Chennai", "Bangalore"];
    const streets = [
      "MG Road",
      "Main Street",
      "Park Lane",
      "Hill Road",
      "Church Street",
    ];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `House No. ${houseNo}, ${street}, ${city}- ${pinCode}`;
  }

  /**
   * Port of Java Flow01_Kyc.randomUniqueNumberGenerator().
   */
  randomUniqueNumberGenerator(): string {
    let uniqueId = "";
    for (let i = 0; i < 8; i++) {
      uniqueId += Math.floor(Math.random() * 10);
    }
    return uniqueId + "3333";
  }

  /**
   * Port of Java Flow01_Kyc.randomLandmark().
   */
  randomLandmark(): string {
    const landmarks = [
      "Near City Mall",
      "Opposite Bus Stand",
      "Beside Police Station",
      "Near Railway Station",
      "Behind Post Office",
      "Next to Hospital",
      "Near Main Market",
      "Opposite School",
      "Beside ATM",
      "Near Metro Station",
    ];
    return landmarks[Math.floor(Math.random() * landmarks.length)];
  }

  /**
   * Port of Java Flow01_Kyc.ValidatePersonalDetails().
   *
   * TODO(port): Signature file upload — Java used sendKeys to (//input[@type='file'])[2].
   * Best-effort: setInputFiles. Caller supplies signaturePath; omit to skip the upload step.
   */
  async ValidatePersonalDetails(signaturePath?: string): Promise<void> {
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // waitAndClickWithJS equivalent: scroll into view then try click, fallback to jsClick
    await this.profileLink().scrollIntoViewIfNeeded();
    await this.waitForLoaderToDisappear();
    try {
      await this.profileLink().click();
    } catch {
      await this.jsClick(this.profileLink());
    }
    await this.waitForLoaderToDisappear();

    await this.imgCamera().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.dateInput().click();
    await this.waitForLoaderToDisappear();
    await this.dateArrow().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.dateYear().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.dateMonth().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.dateDay().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.Radio().click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    const marriedRadio = this.page.locator(
      "xpath=//mat-radio-button[@value='married']",
    );
    await marriedRadio.evaluate((el) => el.scrollIntoView(true));
    await this.page.waitForTimeout(2000);
    await marriedRadio.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(2000);
    await this.occupation().click();
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//span[contains(text(),'Industrialist')]")
      .waitFor({ state: "visible" });
    await this.page
      .locator("xpath=//span[contains(text(),'Industrialist')]")
      .click();
    await this.waitForLoaderToDisappear();

    await this.txtSpouseName().fill("Saysha");
    await this.waitForLoaderToDisappear();
    await this.txtMotherName().fill("Ashwini");
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//Select[@placeholder='Select Religion']")
      .selectOption({ label: "Hindu - General" });
    await this.waitForLoaderToDisappear();

    const mobileNumber = TestDataFactory.mobile();
    await this.mobileField().fill(mobileNumber);
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//select[@placeholder='Select Annual Income']")
      .selectOption({ label: "Above 15 Lakh" });
    await this.waitForLoaderToDisappear();

    await this.qualification().selectOption({ label: "Bachelor's Degree" });
    await this.waitForLoaderToDisappear();

    // Upload Signature document
    // Note: There are 2 file inputs on this form - index 0 is profile picture, index 1 is signature
    console.log("Attempting to upload signature...");

    if (signaturePath) {
      try {
        await this.uploadFileWithValidation(
          signaturePath,
          "xpath=//input[@type='file']",
          "Signature",
          1,
        );
      } catch (err: any) {
        console.warn(
          `⚠ Signature upload encountered an error (continuing anyway): ${err.message}`,
        );
        // Signature upload is not blocking - test can continue
      }
    } else {
      console.log("⊘ Signature upload skipped (no file path provided)");
    }

    await this.page.waitForTimeout(15000);
    await this.page.waitForTimeout(5000);

    // Flow04_NewGoldLoan.safeClick(PO04_NewGoldLoan.loc_btnNext) — re-declared locally as btnNextPO04
    await this.jsClick(this.btnNextPO04());
  }

  /**
   * Port of Java Flow01_Kyc.reviewAndSubmit().
   * Scrolls page to bottom and JS-clicks the Review & Submit button.
   */
  async reviewAndSubmit(): Promise<void> {
    await this.page.evaluate(`
      (function() {
        var inner = document.querySelector('kt-portlet-body, .kt-portlet__body');
        if (inner) inner.scrollTop = inner.scrollHeight;
      })()
    `);
    await this.page.waitForTimeout(500);
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.page.waitForTimeout(500);

    const btnReview = this.page.locator(
      "xpath=//button//span[normalize-space()='Review & Submit']/parent::button",
    );
    await btnReview.waitFor({ state: "attached" });
    await this.page.waitForTimeout(2000);
    await btnReview.evaluate((el: any) => el.click());
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);
  }

  /**
   * Port of Java Flow01_Kyc.validateAssignBranch().
   * Navigates to Internal User settings and assigns the branch.
   */
  async validateAssignBranch(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.clickUserMangaement().click();
    await this.waitForLoaderToDisappear();
    await this.clickInternalUser().click();
    await this.waitForLoaderToDisappear();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await branchDropdown.selectOption({ label: "Show All" });
    await this.page.waitForTimeout(2000);

    const searchInput = this.page.locator(
      "xpath=//input[contains(@class, 'mat-input-element') and @placeholder='enter text here']",
    );
    await searchInput.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await searchInput.fill("7780002900");

    await this.page.waitForTimeout(3000);
    await this.btnEdit().click();
    await this.waitForLoaderToDisappear();
    await this.selArrow().click();
    await this.waitForLoaderToDisappear();

    const dropdownToggle = this.page.locator(
      "xpath=//ng-select[@role='listbox']",
    );
    await dropdownToggle.click();
    await this.waitForLoaderToDisappear();

    await this.page
      .locator("xpath=//div[@class='ng-option ng-star-inserted']")
      .first()
      .waitFor({ state: "visible" });
    const options = this.page.locator(
      "xpath=//div[@class='ng-option ng-star-inserted']",
    );
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const opt = options.nth(i);
      if ((await opt.innerText()).trim() === "Augmont Amritsar") {
        await opt.click();
        break;
      }
    }

    await this.page.waitForTimeout(5000);
    const updateBtn = this.btnUpdate();
    await updateBtn.scrollIntoViewIfNeeded();
    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();
  }
}
