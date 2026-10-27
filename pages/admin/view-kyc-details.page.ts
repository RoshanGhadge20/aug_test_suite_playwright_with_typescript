import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

export class ViewKycDetailsPage extends AdminBasePage {
  private readonly ReasonForselStatus: Locator;
  private readonly btnView: Locator;
  private readonly close: Locator;
  private readonly arrow: Locator;
  private readonly profile: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly applyKyc: Locator;
  private readonly radiobtn: Locator;
  private readonly selPan: Locator;
  private readonly panfield: Locator;
  private readonly fileTypePan: Locator;
  private readonly btnNextSpan: Locator;
  private readonly btnYesKyc: Locator;
  private readonly aadharfield: Locator;
  private readonly checkMark: Locator;
  private readonly seladhar: Locator;
  private readonly addresField: Locator;
  private readonly landMarkField: Locator;
  private readonly btnyes: Locator;
  private readonly profileLink: Locator;
  private readonly imgCamera: Locator;
  private readonly dateInput: Locator;
  private readonly dateArrow: Locator;
  private readonly dateYear: Locator;
  private readonly dateMonth: Locator;
  private readonly dateDay: Locator;
  private readonly Radio: Locator;
  private readonly marriedRadio: Locator;
  private readonly occupation: Locator;
  private readonly industrialist: Locator;
  private readonly spouseName: Locator;
  private readonly motherName: Locator;
  private readonly selReligion: Locator;
  private readonly mobileField: Locator;
  private readonly selIncome: Locator;
  private readonly qualificationDropdown: Locator;
  private readonly signatureFileInput: Locator;
  private readonly btnReviewandSubmit: Locator;
  // PO02_KycApproval locators re-declared
  private readonly kycDetails: Locator;
  private readonly kycApplyKyc: Locator;
  private readonly textSearchField: Locator;
  private readonly btnAction: Locator;
  private readonly btnReviewandSubmitOps: Locator;
  private readonly selectStatusDropdown: Locator;
  private readonly btnSubmit: Locator;
  // View fields
  private readonly viewFirstName: Locator;
  private readonly viewLastName: Locator;
  private readonly viewMobile: Locator;
  private readonly viewPan: Locator;
  private readonly fileInput1: Locator;

  constructor(page: Page) {
    super(page);
    this.ReasonForselStatus = this.page.locator(
      "xpath=//textarea[@formcontrolname='reasonFromOperationalTeam']",
    );
    this.btnView = this.page.locator(
      "xpath=(//span[@class='ui-button-icon-left ui-clickable pi pi-eye'])[1]",
    );
    this.close = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
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
    this.applyKyc = this.page.locator(
      "xpath=//button[normalize-space()='Apply KYC']",
    );
    this.radiobtn = this.page.locator(
      "xpath=(//div[@class='mat-radio-outer-circle'])[2]",
    );
    this.selPan = this.page.locator(
      "xpath=//select[@formcontrolname='panType']",
    );
    this.panfield = this.page.locator("xpath=//input[@placeholder='PAN']");
    this.fileTypePan = this.page.locator("xpath=//input[@type='file']");
    this.btnNextSpan = this.page.locator(
      "xpath=//span[normalize-space()='Next']",
    );
    this.btnYesKyc = this.page.locator("xpath=//span[normalize-space()='Yes']");
    this.aadharfield = this.page.locator(
      "xpath=//input[@class='form-control']",
    );
    this.checkMark = this.page.locator(
      "xpath=//span[@class='checkmark top-0']",
    );
    this.seladhar = this.page.locator(
      "xpath=(//select[@formcontrolname='addressProofTypeId'])[1]",
    );
    this.addresField = this.page.locator(
      "xpath=//textarea[@id='permanent-address']",
    );
    this.landMarkField = this.page.locator(
      "xpath=//input[@id='permanent-landmark']",
    );
    this.btnyes = this.page.locator("xpath=//button[@type='submit']");
    this.profileLink = this.page.locator(
      "xpath=//label[normalize-space()='Upload Profile Picture']",
    );
    this.imgCamera = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.dateInput = this.page.locator(
      "xpath=//input[@placeholder='DD/MM/YYYY']",
    );
    this.dateArrow = this.page.locator(
      "xpath=(//div[@class='mat-calendar-arrow'])[1]",
    );
    this.dateYear = this.page.locator("xpath=//div[normalize-space()='2003']");
    this.dateMonth = this.page.locator("xpath=//div[normalize-space()='JAN']");
    this.dateDay = this.page.locator(
      "xpath=//div[@class='mat-calendar-body-cell-content'][normalize-space()='1']",
    );
    this.Radio = this.page.locator(
      "xpath=(//div[@class='mat-radio-outer-circle'])[1]",
    );
    this.marriedRadio = this.page.locator(
      "xpath=//mat-radio-button[@value='married']",
    );
    this.occupation = this.page.locator("xpath=//input[@role='combobox']");
    this.industrialist = this.page.locator(
      "xpath=//span[contains(text(),'Industrialist')]",
    );
    this.spouseName = this.page.locator(
      "xpath=//input[@formcontrolname='spouseName']",
    );
    this.motherName = this.page.locator(
      "xpath=//input[@formcontrolname='motherName']",
    );
    this.selReligion = this.page.locator(
      "xpath=//Select[@placeholder='Select Religion']",
    );
    this.mobileField = this.page.locator(
      "xpath=//input[@placeholder='Mobile Number']",
    );
    this.selIncome = this.page.locator(
      "xpath=//select[@placeholder='Select Annual Income']",
    );
    this.qualificationDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='qualificationId']",
    );
    this.signatureFileInput = this.page.locator(
      "xpath=(//input[@type='file'])[2]",
    );
    this.btnReviewandSubmit = this.page.locator(
      "xpath=//span[normalize-space()='Review & Submit']",
    );
    this.kycDetails = this.page.locator(
      "xpath=//span[normalize-space()='KYC Details']",
    );
    this.kycApplyKyc = this.page.locator(
      "xpath=//span[normalize-space()='Apply KYC']",
    );
    this.textSearchField = this.page.locator(
      "xpath=//input[@placeholder='Search']",
    );
    this.btnAction = this.page.locator(
      "xpath=//button[normalize-space()='Action']",
    );
    this.btnReviewandSubmitOps = this.page.locator(
      "xpath=//span[contains(.,'Review & Submit')]",
    );
    this.selectStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    this.btnSubmit = this.page.locator(
      "xpath=//button[normalize-space()='Submit']",
    );
    this.viewFirstName = this.page.locator(
      "xpath=//input[@formcontrolname='firstName']",
    );
    this.viewLastName = this.page.locator(
      "xpath=//input[@formcontrolname='lastName']",
    );
    this.viewMobile = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.viewPan = this.page.locator(
      "xpath=//input[@formcontrolname='panCardNumber']",
    );
    this.fileInput1 = this.page.locator("xpath=(//input[@id='file'])[1]");
  }

  async validateViewKyc_appraiserPart(
    panCardPath?: string,
    aadharImagePath?: string,
    signaturePath?: string,
  ): Promise<{
    enteredFirstName: string;
    enteredLastName: string;
    enteredMobile: string;
    enteredPan: string;
  }> {
    const data = getLoginData();
    const randomPan = TestDataFactory.pan();
    const landmark = this.randomLandmark();
    const mobileNumber = this.randomMobile();
    const randomAddress = this.randomAddress();

    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.waitForLoaderToDisappear();

    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.applyKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.radiobtn.click();
    await this.waitForLoaderToDisappear();

    const enteredMobile = await this.page
      .locator("xpath=//input[@formcontrolname='mobileNumber']")
      .inputValue()
      .then((v) => v.trim())
      .catch(() => "");
    const enteredFirstName = await this.page
      .locator("xpath=//input[@formcontrolname='firstName']")
      .inputValue()
      .then((v) => v.trim())
      .catch(() => "");
    const enteredLastName = await this.page
      .locator("xpath=//input[@formcontrolname='lastName']")
      .inputValue()
      .then((v) => v.trim())
      .catch(() => "");

    await this.selPan.click();
    await this.selPan.selectOption({ label: "PAN" });
    await this.page.waitForTimeout(5000);

    if (panCardPath) {
      await this.fileTypePan.evaluate((el) => {
        (el as any).style.display = "block";
      });
      await this.fileTypePan.setInputFiles(panCardPath);
    }
    await this.page.waitForTimeout(5000);

    await this.panfield.fill(randomPan);
    const enteredPan = await this.panfield
      .inputValue()
      .then((v) => v.trim())
      .catch(() => randomPan);
    await this.page.waitForTimeout(1000);

    await this.btnNextSpan.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1500);
    await this.btnNextSpan.click();
    await this.waitForLoaderToDisappear();
    await this.btnYesKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(15000);

    const radio2 = this.page.locator(
      "xpath=//mat-radio-button[contains(@class,'mat-radio-button')][2]",
    );
    await radio2.click();

    if (aadharImagePath) {
      await this.fileInput1.setInputFiles(aadharImagePath);
    }
    await this.page.waitForTimeout(3000);
    await this.aadharfield.fill(this.randomAadhar());
    await this.page.waitForTimeout(10000);
    await this.checkMark.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(12000);
    await this.checkMark.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(12000);
    await this.seladhar.selectOption({ label: data.proofName });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(10000);

    await this.page.evaluate("window.scrollBy(0, 800)");
    await this.addresField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.addresField.fill(randomAddress);
    await this.landMarkField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(5000);
    await this.landMarkField.click();
    await this.landMarkField.fill(landmark);
    await this.page.waitForTimeout(2000);
    await this.btnNextSpan.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.btnyes.click();
    await this.waitForLoaderToDisappear();
    await this.profileLink.click();
    await this.imgCamera.click();
    await this.page.waitForTimeout(5000);
    await this.dateInput.click();
    await this.dateArrow.click();
    await this.page.waitForTimeout(2000);
    await this.dateYear.click();
    await this.page.waitForTimeout(2000);
    await this.dateMonth.click();
    await this.page.waitForTimeout(2000);
    await this.dateDay.click();
    await this.page.waitForTimeout(5000);
    await this.Radio.click();
    await this.page.waitForTimeout(2000);
    await this.marriedRadio.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(2000);
    await this.jsClick(this.marriedRadio);
    await this.page.waitForTimeout(2000);
    await this.occupation.click();
    await this.industrialist.waitFor({ state: "visible" });
    await this.industrialist.click();
    await this.spouseName.fill("Saysha");
    await this.motherName.fill("Ashwini");
    await this.selReligion.selectOption({ label: "Hindu - General" });
    await this.mobileField.fill(mobileNumber);
    await this.selIncome.selectOption({ label: "Above 15 Lakh" });
    await this.qualificationDropdown.selectOption({
      label: "Bachelor's Degree",
    });

    if (signaturePath) {
      await this.signatureFileInput.setInputFiles(signaturePath);
      await this.page.waitForTimeout(5000);
    } else {
      await this.page.waitForTimeout(15000);
    }

    await this.btnNextSpan.click();
    await this.waitForLoaderToDisappear();
    await this.btnReviewandSubmit.scrollIntoViewIfNeeded().catch(() => {});
    await this.btnReviewandSubmit.click();
    await this.waitForLoaderToDisappear();

    return { enteredFirstName, enteredLastName, enteredMobile, enteredPan };
  }

  async validateViewKyc_opsPart(): Promise<{
    viewName: string;
    viewLastName: string;
    viewMobile: string;
    viewPan: string;
  }> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown.waitFor({ state: "visible" });
    await this.branchDropdown.selectOption({ label: "Show All" });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.kycDetails.click();
    await this.waitForLoaderToDisappear();
    await this.kycApplyKyc.click();
    await this.waitForLoaderToDisappear();
    await this.textSearchField.fill(data.firstName);
    await this.waitForLoaderToDisappear();

    await this.btnView.waitFor({ state: "visible" });
    await this.btnView.click();
    await this.waitForLoaderToDisappear();

    await this.viewFirstName.scrollIntoViewIfNeeded().catch(() => {});
    const viewName = await this.viewFirstName
      .inputValue()
      .then((v) => v.trim())
      .catch(() => "");
    const viewLastName = (await this.viewLastName
      .innerText()
      .then((v) => v.trim())
      .catch(async () =>
        this.viewLastName
          .inputValue()
          .then((v) => v.trim())
          .catch(() => ""),
      )) as string;
    const viewMobile = (await this.viewMobile
      .innerText()
      .then((v) => v.trim())
      .catch(async () =>
        this.viewMobile
          .inputValue()
          .then((v) => v.trim())
          .catch(() => ""),
      )) as string;
    const viewPan = (await this.viewPan
      .innerText()
      .then((v) => v.trim())
      .catch(async () =>
        this.viewPan
          .inputValue()
          .then((v) => v.trim())
          .catch(() => ""),
      )) as string;

    await this.close.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnAction.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await this.btnReviewandSubmitOps.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(500);
    await this.btnReviewandSubmitOps.click();
    await this.waitForLoaderToDisappear();

    await this.selectStatusDropdown.selectOption({ label: "Incomplete" });
    await this.ReasonForselStatus.fill("More document needed.");
    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();

    return { viewName, viewLastName, viewMobile, viewPan };
  }

  private randomLandmark(): string {
    const items = [
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
    return items[Math.floor(Math.random() * items.length)];
  }

  private randomMobile(): string {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = "";
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    return `${first}${rest}`;
  }

  private randomAadhar(): string {
    let aadhaar = "2222";
    for (let i = 0; i < 8; i++) aadhaar += Math.floor(Math.random() * 10);
    return aadhaar;
  }

  private randomAddress(): string {
    const houseNo = Math.floor(100 + Math.random() * 900);
    const pinCode = Math.floor(100000 + Math.random() * 900000);
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
}
