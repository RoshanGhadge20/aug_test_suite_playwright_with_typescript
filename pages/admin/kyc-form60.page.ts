import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: PO19_KycWithForm60 (locators) + Flow22_KycWithForm60 (actions)
 *
 * Cross-page locator notes:
 *   - `profile`, `arrow`, `branchDropdown`, `customerManagementBtn`, `allCustomers`,
 *     `firstNameFilter`, `filterbtn`, `applyKyc`, `selPan`, `btnNext`, `btnYes`,
 *     `aadharfield`, `checkMark`, `seladhar`, `addresField`, `landMarkField`,
 *     `profileLink`, `imgCamera`, `dateInput`, `dateArrow`, `dateYear`, `dateMonth`,
 *     `dateDay`, `Radio`, `occupation`, `mobileField`, `btnReviewandSubmit`
 *     re-declared from PO01_KycSel / inline flow locators.
 *
 * Omitted loginWith* calls:
 *   - autoKycWithPan() does not do a login switch at entry — caller stays on current session (appraiser or ops).
 *   - performOpsRatingActions() at end is NOT ported here — spec calls kycApproval separately.
 *
 * File upload TODOs:
 *   - Aadhar image file upload: Java used sendKeys("C:\\...") to hidden input.
 *     Playwright: page.locator("(//input[@id='file'])[1]").setInputFiles(path) — guarded optional.
 *   - Signature file upload: same pattern.
 *   All paths must be supplied via env vars or test config for live execution.
 */
export class KycForm60Page extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO19_KycWithForm60) ───────────────────────────────────

  private readonly attachForm60 = () => this.page.locator("xpath=//span[contains(.,'Attach')]");
  private readonly attachxmlaadhar = () => this.page.locator("xpath=(//span[normalize-space(text())='Attach'])[2]");
  private readonly verifyaadhar = () => this.page.locator("xpath=//span[@class='mat-button-wrapper' and normalize-space(text())='Verify Aadhaar']");
  private readonly btnRadio = () => this.page.locator("xpath=(//div[@class='mat-radio-outer-circle'])[1]");
  private readonly dateInput_form60 = () => this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow_form60 = () => this.page.locator("xpath=(//div[@class='mat-calendar-arrow'])[1]");
  private readonly dateYear_form60 = () => this.page.locator("xpath=//div[normalize-space()='1995']");
  private readonly dateMonth_form60 = () => this.page.locator("xpath=//div[normalize-space()='APR']");
  private readonly dateDay_form60 = () => this.page.locator("xpath=//div[normalize-space()='20']");
  private readonly btnVerify = () => this.page.locator("xpath=//button[@class='submit mat-raised-button mat-button-base w-100 mat-primary ng-star-inserted']");
  private readonly btnYes_form60 = () => this.page.locator("xpath=//span[contains(.,'Yes')]");

  // Cross-page re-declarations
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch']");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly applyKyc = () => this.page.locator("xpath=//button[normalize-space()='Apply KYC']");
  private readonly selPan = () => this.page.locator("xpath=//select[@formcontrolname='panType']");
  private readonly btnNext = () => this.page.locator("xpath=//span[normalize-space()='Next']");
  private readonly btnyes = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly aadharfield = () => this.page.locator("xpath=//input[@class='form-control']");
  private readonly checkMark = () => this.page.locator("xpath=//span[@class='checkmark top-0']");
  private readonly seladhar = () => this.page.locator("xpath=(//select[@formcontrolname='addressProofTypeId'])[1]");
  private readonly landMarkField = () => this.page.locator("xpath=//input[@id='permanent-landmark']");
  private readonly profileLink = () => this.page.locator("xpath=//label[normalize-space()='Upload Profile Picture']");
  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  private readonly Radio = () => this.page.locator("xpath=(//div[@class='mat-radio-outer-circle'])[1]");
  private readonly marriedRadio = () => this.page.locator("xpath=//mat-radio-button[@value='married']");
  private readonly occupation = () => this.page.locator("xpath=//input[@role='combobox']");
  private readonly industrialist = () => this.page.locator("xpath=//span[contains(text(),'Industrialist')]");
  private readonly spouseName = () => this.page.locator("xpath=//input[@formcontrolname='spouseName']");
  private readonly motherName = () => this.page.locator("xpath=//input[@formcontrolname='motherName']");
  private readonly selReligion = () => this.page.locator("xpath=//Select[@placeholder='Select Religion']");
  private readonly mobileField = () => this.page.locator("xpath=//input[@placeholder='Mobile Number']");
  private readonly selIncome = () => this.page.locator("xpath=//select[@placeholder='Select Annual Income']");
  private readonly qualificationDropdown = () => this.page.locator("xpath=//select[@formcontrolname='qualificationId']");
  private readonly btnReviewandSubmit = () => this.page.locator("xpath=//span[normalize-space()='Review & Submit']");
  private readonly fileInput1 = () => this.page.locator("xpath=(//input[@id='file'])[1]");
  private readonly fileInputFile2 = () => this.page.locator("xpath=(//input[@id='file'])[2]");
  private readonly fileTypeInput = () => this.page.locator("xpath=//input[@type='file']");
  private readonly signatureFileInput = () => this.page.locator("xpath=(//input[@type='file'])[2]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow22_KycWithForm60.autoKycWithPan().
   * Caller must first loginAs('appraiser') or be on the appraiser session.
   * File uploads are guarded — supply paths via env vars for live runs.
   */
  async autoKycWithPan(
    aadharImagePath?: string,
    aadharXmlPath?: string,
    signaturePath?: string,
  ): Promise<void> {
    const data = getLoginData();
    const landmark = this.randomLandmark();
    const mobileNumber = this.randomMobile();

    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter().fill('Priyanka');
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.applyKyc().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.btnNext().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.btnYes_form60().click();
    await this.waitForLoaderToDisappear();

    // Aadhar upload (optional — guarded)
    if (aadharImagePath) {
      await this.fileInput1().setInputFiles(aadharImagePath);
      await this.page.waitForTimeout(3000);
    }

    await this.aadharfield().fill('875302915562');
    await this.page.waitForTimeout(10000);

    // Aadhar XML upload (optional — guarded)
    if (aadharXmlPath) {
      await this.fileInputFile2().setInputFiles(aadharXmlPath);
      await this.page.waitForTimeout(10000);
    }

    await this.verifyaadhar().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.checkMark().scrollIntoViewIfNeeded().catch(() => {});
    await this.checkMark().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(12000);

    await this.seladhar().selectOption({ label: data.proofName });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.landMarkField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.landMarkField().click();
    await this.landMarkField().fill(landmark);
    await this.page.waitForTimeout(2000);
    await this.btnNext().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    // Personal details
    await this.profileLink().click();
    await this.waitForLoaderToDisappear();
    await this.imgCamera().click();
    await this.page.waitForTimeout(5000);
    await this.page.waitForTimeout(2000);

    await this.marriedRadio().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.jsClick(this.marriedRadio());
    await this.page.waitForTimeout(2000);

    await this.occupation().click();
    await this.waitForLoaderToDisappear();
    await this.industrialist().waitFor({ state: 'visible' });
    await this.industrialist().click();

    await this.spouseName().fill('Saysha');
    await this.motherName().fill('Ashwini');
    await this.selReligion().selectOption({ label: 'Hindu - General' });
    await this.mobileField().fill(mobileNumber);
    await this.selIncome().selectOption({ label: 'Above 15 Lakh' });
    await this.qualificationDropdown().selectOption({ label: "Bachelor's Degree" });

    // Signature upload (optional — guarded)
    if (signaturePath) {
      await this.signatureFileInput().setInputFiles(signaturePath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(15000);
    }

    await this.btnNext().click();
    await this.waitForLoaderToDisappear();

    // Review & Submit
    await this.btnReviewandSubmit().scrollIntoViewIfNeeded().catch(() => {});
    await this.btnReviewandSubmit().click();
    await this.waitForLoaderToDisappear();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private randomLandmark(): string {
    const landmarks = [
      'Near City Mall', 'Opposite Bus Stand', 'Beside Police Station', 'Near Railway Station',
      'Behind Post Office', 'Next to Hospital', 'Near Main Market', 'Opposite School',
      'Beside ATM', 'Near Metro Station',
    ];
    return landmarks[Math.floor(Math.random() * landmarks.length)];
  }

  private randomMobile(): string {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = '';
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    return `${first}${rest}`;
  }
}
