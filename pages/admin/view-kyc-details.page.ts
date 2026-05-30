import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';
import { TestDataFactory } from '../../utils/data/test-data.factory';

/**
 * Port of Java: PO20_ViewKycDetails (locators) + Flow23_ViewKycDetails (actions)
 *
 * Role split:
 *   - validateViewKyc() has TWO role segments:
 *     1. First half: appraiser session — performs KYC (PAN-based), navigates customer mgmt.
 *     2. Second half: loginWithOPS() — approves KYC and verifies view.
 *   - SPLIT: validateViewKyc_appraiserPart() and validateViewKyc_opsPart().
 *     Spec calls loginAs('appraiser') then appraiserPart(), loginAs('ops') then opsPart().
 *
 * File upload TODOs:
 *   - PAN card, Aadhar, XML, signature uploads use Java sendKeys to file inputs.
 *     Playwright: setInputFiles() — guarded optional params.
 *   All paths must be supplied via env vars or test config for live execution.
 */
export class ViewKycDetailsPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (from PO20_ViewKycDetails) ──────────────────────────────────

  private readonly ReasonForselStatus = () => this.page.locator("xpath=//textarea[@formcontrolname='reasonFromOperationalTeam']");
  private readonly btnView = () => this.page.locator("xpath=(//span[@class='ui-button-icon-left ui-clickable pi pi-eye'])[1]");
  private readonly close = () => this.page.locator("xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']");

  // Cross-page re-declarations
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly allCustomers = () => this.page.locator("xpath=//span[normalize-space()='All Customers']");
  private readonly firstNameFilter = () => this.page.locator("xpath=//input[@placeholder='Enter First Name']");
  private readonly filterbtn = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly applyKyc = () => this.page.locator("xpath=//button[normalize-space()='Apply KYC']");
  private readonly radiobtn = () => this.page.locator("xpath=(//div[@class='mat-radio-outer-circle'])[2]");
  private readonly selPan = () => this.page.locator("xpath=//select[@formcontrolname='panType']");
  private readonly panfield = () => this.page.locator("xpath=//input[@placeholder='PAN']");
  private readonly fileTypePan = () => this.page.locator("xpath=//input[@type='file']");
  private readonly btnNextSpan = () => this.page.locator("xpath=//span[normalize-space()='Next']");
  private readonly btnYesKyc = () => this.page.locator("xpath=//span[normalize-space()='Yes']");
  private readonly aadharfield = () => this.page.locator("xpath=//input[@class='form-control']");
  private readonly checkMark = () => this.page.locator("xpath=//span[@class='checkmark top-0']");
  private readonly seladhar = () => this.page.locator("xpath=(//select[@formcontrolname='addressProofTypeId'])[1]");
  private readonly addresField = () => this.page.locator("xpath=//textarea[@id='permanent-address']");
  private readonly landMarkField = () => this.page.locator("xpath=//input[@id='permanent-landmark']");
  private readonly btnyes = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly profileLink = () => this.page.locator("xpath=//label[normalize-space()='Upload Profile Picture']");
  private readonly imgCamera = () => this.page.locator("xpath=//img[@src='../../../../../assets/media/icons/camera.svg']");
  private readonly dateInput = () => this.page.locator("xpath=//input[@placeholder='DD/MM/YYYY']");
  private readonly dateArrow = () => this.page.locator("xpath=(//div[@class='mat-calendar-arrow'])[1]");
  private readonly dateYear = () => this.page.locator("xpath=//div[normalize-space()='2003']");
  private readonly dateMonth = () => this.page.locator("xpath=//div[normalize-space()='JAN']");
  private readonly dateDay = () => this.page.locator("xpath=//div[@class='mat-calendar-body-cell-content'][normalize-space()='1']");
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
  private readonly signatureFileInput = () => this.page.locator("xpath=(//input[@type='file'])[2]");
  private readonly btnReviewandSubmit = () => this.page.locator("xpath=//span[normalize-space()='Review & Submit']");
  // PO02_KycApproval locators re-declared
  private readonly kycDetails = () => this.page.locator("xpath=//span[normalize-space()='KYC Details']");
  private readonly kycApplyKyc = () => this.page.locator("xpath=//span[normalize-space()='Apply KYC']");
  private readonly textSearchField = () => this.page.locator("xpath=//input[@placeholder='Search']");
  private readonly btnAction = () => this.page.locator("xpath=//button[normalize-space()='Action']");
  private readonly btnReviewandSubmitOps = () => this.page.locator("xpath=//span[contains(.,'Review & Submit')]");
  private readonly selectStatusDropdown = () => this.page.locator("xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']");
  private readonly btnSubmit = () => this.page.locator("xpath=//button[normalize-space()='Submit']");
  // View fields
  private readonly viewFirstName = () => this.page.locator("xpath=//input[@formcontrolname='firstName']");
  private readonly viewLastName = () => this.page.locator("xpath=//input[@formcontrolname='lastName']");
  private readonly viewMobile = () => this.page.locator("xpath=//input[@formcontrolname='mobileNumber']");
  private readonly viewPan = () => this.page.locator("xpath=//input[@formcontrolname='panCardNumber']");
  private readonly fileInput1 = () => this.page.locator("xpath=(//input[@id='file'])[1]");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of first half of Flow23_ViewKycDetails.validateViewKyc() — appraiser role.
   * Performs KYC with PAN and returns entered values for comparison in opsPart.
   * File uploads are guarded — supply paths via env vars for live runs.
   */
  async validateViewKyc_appraiserPart(
    panCardPath?: string,
    aadharImagePath?: string,
    signaturePath?: string,
  ): Promise<{ enteredFirstName: string; enteredLastName: string; enteredMobile: string; enteredPan: string }> {
    const data = getLoginData();
    const randomPan = TestDataFactory.pan();
    const landmark = this.randomLandmark();
    const mobileNumber = this.randomMobile();
    const randomAddress = this.randomAddress();

    await this.page.waitForTimeout(5000);
    await this.arrow().click();
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers().click();
    await this.waitForLoaderToDisappear();

    // filterCustomer inline
    await this.firstNameFilter().fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.applyKyc().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.radiobtn().click();
    await this.waitForLoaderToDisappear();

    // Capture entered values
    const enteredMobile = await this.page.locator("xpath=//input[@formcontrolname='mobileNumber']").inputValue().then(v => v.trim()).catch(() => '');
    const enteredFirstName = await this.page.locator("xpath=//input[@formcontrolname='firstName']").inputValue().then(v => v.trim()).catch(() => '');
    const enteredLastName = await this.page.locator("xpath=//input[@formcontrolname='lastName']").inputValue().then(v => v.trim()).catch(() => '');

    await this.selPan().click();
    await this.selPan().selectOption({ label: 'PAN' });
    await this.page.waitForTimeout(5000);

    // PAN upload (optional)
    if (panCardPath) {
      await this.fileTypePan().evaluate((el) => { (el as any).style.display = 'block'; });
      await this.fileTypePan().setInputFiles(panCardPath);
    }
    await this.page.waitForTimeout(5000);

    await this.panfield().fill(randomPan);
    const enteredPan = await this.panfield().inputValue().then(v => v.trim()).catch(() => randomPan);
    await this.page.waitForTimeout(1000);

    await this.btnNextSpan().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.btnNextSpan().click();
    await this.waitForLoaderToDisappear();
    await this.btnYesKyc().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    // Second radio: address type 2
    const radio2 = this.page.locator("xpath=//mat-radio-button[contains(@class,'mat-radio-button')][2]");
    await radio2.click();

    // addressandIdentity
    if (aadharImagePath) {
      await this.fileInput1().setInputFiles(aadharImagePath);
    }
    await this.page.waitForTimeout(3000);
    await this.aadharfield().fill(this.randomAadhar());
    await this.page.waitForTimeout(10000);
    await this.checkMark().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(12000);
    await this.checkMark().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(12000);
    await this.seladhar().selectOption({ label: data.proofName });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.page.evaluate('window.scrollBy(0, 800)');
    await this.addresField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.addresField().fill(randomAddress);
    await this.landMarkField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.landMarkField().click();
    await this.landMarkField().fill(landmark);
    await this.page.waitForTimeout(2000);
    await this.btnNextSpan().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnyes().click();
    await this.waitForLoaderToDisappear();

    // Personal details
    await this.profileLink().click();
    await this.imgCamera().click();
    await this.page.waitForTimeout(5000);
    await this.dateInput().click();
    await this.dateArrow().click();
    await this.page.waitForTimeout(2000);
    await this.dateYear().click();
    await this.page.waitForTimeout(2000);
    await this.dateMonth().click();
    await this.page.waitForTimeout(2000);
    await this.dateDay().click();
    await this.page.waitForTimeout(5000);
    await this.Radio().click();
    await this.page.waitForTimeout(2000);
    await this.marriedRadio().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.jsClick(this.marriedRadio());
    await this.page.waitForTimeout(2000);
    await this.occupation().click();
    await this.industrialist().waitFor({ state: 'visible' });
    await this.industrialist().click();
    await this.spouseName().fill('Saysha');
    await this.motherName().fill('Ashwini');
    await this.selReligion().selectOption({ label: 'Hindu - General' });
    await this.mobileField().fill(mobileNumber);
    await this.selIncome().selectOption({ label: 'Above 15 Lakh' });
    await this.qualificationDropdown().selectOption({ label: "Bachelor's Degree" });

    if (signaturePath) {
      await this.signatureFileInput().setInputFiles(signaturePath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(15000);
    }

    await this.btnNextSpan().click();
    await this.waitForLoaderToDisappear();
    await this.btnReviewandSubmit().scrollIntoViewIfNeeded().catch(() => {});
    await this.btnReviewandSubmit().click();
    await this.waitForLoaderToDisappear();

    return { enteredFirstName, enteredLastName, enteredMobile, enteredPan };
  }

  /**
   * Port of second half of Flow23_ViewKycDetails.validateViewKyc() — ops role.
   * Caller must first loginAs('ops').
   * Returns view values for soft assertions in spec.
   */
  async validateViewKyc_opsPart(): Promise<{ viewName: string; viewLastName: string; viewMobile: string; viewPan: string }> {
    const data = getLoginData();

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.arrow().click();
    await this.waitForLoaderToDisappear();
    await this.kycDetails().click();
    await this.waitForLoaderToDisappear();
    await this.kycApplyKyc().click();
    await this.waitForLoaderToDisappear();
    await this.textSearchField().fill(data.firstName);
    await this.waitForLoaderToDisappear();

    await this.btnView().waitFor({ state: 'visible' });
    await this.btnView().click();
    await this.waitForLoaderToDisappear();

    await this.viewFirstName().scrollIntoViewIfNeeded().catch(() => {});
    const viewName = await this.viewFirstName().inputValue().then(v => v.trim()).catch(() => '');
    const viewLastName = await this.viewLastName().innerText().then(v => v.trim()).catch(async () =>
      this.viewLastName().inputValue().then(v => v.trim()).catch(() => ''),
    ) as string;
    const viewMobile = await this.viewMobile().innerText().then(v => v.trim()).catch(async () =>
      this.viewMobile().inputValue().then(v => v.trim()).catch(() => ''),
    ) as string;
    const viewPan = await this.viewPan().innerText().then(v => v.trim()).catch(async () =>
      this.viewPan().inputValue().then(v => v.trim()).catch(() => ''),
    ) as string;

    await this.close().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAction().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await this.btnReviewandSubmitOps().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(500);
    await this.btnReviewandSubmitOps().click();
    await this.waitForLoaderToDisappear();

    await this.selectStatusDropdown().selectOption({ label: 'Incomplete' });
    await this.ReasonForselStatus().fill('More document needed.');
    await this.btnSubmit().click();
    await this.waitForLoaderToDisappear();

    return { viewName, viewLastName, viewMobile, viewPan };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private randomLandmark(): string {
    const items = [
      'Near City Mall', 'Opposite Bus Stand', 'Beside Police Station', 'Near Railway Station',
      'Behind Post Office', 'Next to Hospital', 'Near Main Market', 'Opposite School',
      'Beside ATM', 'Near Metro Station',
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  private randomMobile(): string {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = '';
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    return `${first}${rest}`;
  }

  private randomAadhar(): string {
    let aadhaar = '2222';
    for (let i = 0; i < 8; i++) aadhaar += Math.floor(Math.random() * 10);
    return aadhaar;
  }

  private randomAddress(): string {
    const houseNo = Math.floor(100 + Math.random() * 900);
    const pinCode = Math.floor(100000 + Math.random() * 900000);
    const cities = ['Mumbai', 'Delhi', 'Pune', 'Chennai', 'Bangalore'];
    const streets = ['MG Road', 'Main Street', 'Park Lane', 'Hill Road', 'Church Street'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `House No. ${houseNo}, ${street}, ${city}- ${pinCode}`;
  }
}
