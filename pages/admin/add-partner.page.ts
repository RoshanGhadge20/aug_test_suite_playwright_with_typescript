import { Page } from "@playwright/test";
import { KycPage } from "./kyc.page";
import path from "path";
import { AdminBasePage } from "./admin-base.page";
import { documentPath } from "@config/urls";
import { getLoginData } from "../../utils/data/admin-excel-data";
import customerData from "../../testdata/admin/documents/customerData.json";
/**
 * Port of Java: PO32_AddPartner (locators) + Flow42_ValidateAddNewPartner (actions)
 *
 * Methods ported:
 *   - validateAddNewPartner()  ← Flow42.validateAddNewPartner()
 *   - validateEdit()           ← Flow42.validateEdit()
 *   - validateDeletePartner()  ← Flow42.validateDeletePartner()
 *   - (validateUpdatePartnerFunctionality commented in TC05 — omitted)
 *
 * Cross-page locator notes:
 *   - profile re-declares PO_LoginLogout.loc_Profile
 *   - arrow re-declares PO_CustomerManagement.loc_arrow
 *   - branchDropdown inline from Java flows
 *
 * Omitted loginWith... logout calls:
 *   - validateEdit() and validateDeletePartner() called login()/logout() — OMITTED.
 *     Role = admin. Caller handles session via loginAs() if needed.
 *
 * File upload notes:
 *   - validateAddNewPartner(): Java used sendKeys to //input[@type='file']. Guarded
 *     behind documentPath? optional param. No C:\\ paths.
 *
 * SoftAssert assertions translated to return values:
 *   - validateAddNewPartner() returns { firstName, lastName, email, mobile } so spec
 *     can assert with expect.soft().
 */

export class AddPartnerPage extends AdminBasePage {
  private Kycpage: KycPage;
  constructor(page: Page) {
    super(page);
    this.Kycpage = new KycPage(page);
  }

  // ── Locators (from PO32_AddPartner) ──────────────────────────────────────

  private readonly userManagent = () =>
    this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly partner = () =>
    this.page.locator("xpath=//span[normalize-space()='Partner']");
  private readonly btnAddpartner = () =>
    this.page.locator("xpath=//span[normalize-space()='Add Partner']");
  private readonly firstName = () =>
    this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly lastName = () =>
    this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly emailID = () =>
    this.page.locator("xpath=//input[@placeholder='e.g abc@123.com']");
  private readonly enterCommision = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Commission']");
  private readonly dropdown = () =>
    this.page.locator("xpath=//span[@class='ng-arrow-wrapper']");
  private readonly PacketInAugmont = () =>
    this.page.locator("xpath=//label[@for='togglePacketSubmit-input']");
  private readonly cashDisbursementlimit = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='cashDisbursementLimitWithoutDeclaration']",
    );
  private readonly customerID = () =>
    this.page.locator(
      "xpath=(//input[@type='radio' and @value='customerId'])[1]",
    );
  private readonly loanID = () =>
    this.page.locator("xpath=(//input[@type='radio' and @value='loanId'])[1]");
  private readonly btnYes = () =>
    this.page.locator(
      "xpath=//label[@for='mat-radio-5-input']//div[@class='mat-radio-outer-circle']",
    );
  private readonly cashLimit = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='cashDisbursementLimitWithDeclaration']",
    );
  private readonly CashLimitDisburse = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='cashRepaymentLimitWithoutDeclaration']",
    );
  private readonly custid = () =>
    this.page.locator(
      "xpath=(//label[.//input[@type='radio' and @value='customerId']])[2]",
    );
  private readonly btncashYes = () =>
    this.page.locator(
      "xpath=//label[@for='mat-radio-11-input']//div[@class='mat-radio-outer-circle']",
    );
  private readonly cashRepayment = () =>
    this.page.locator(
      "xpath=//input[@formcontrolname='cashRepaymentLimitWithDeclaration']",
    );
  private readonly btnAdd = () =>
    this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
  private readonly mobileNumber = () =>
    this.page.locator("xpath=//input[@placeholder='e.g 9023451234']");
  private readonly Radio = () =>
    this.page.locator(
      "xpath=//span[@class='checkmark checkmark-custom header-checkmark']",
    );
  private readonly multiModeDisbursement = () =>
    this.page.locator(
      "xpath=(//div[@class='mat-slide-toggle-ripple mat-ripple'])[5]",
    );
  private readonly edit = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Edit')])[1]",
    );
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[contains(.,'Update')]");
  private readonly btnDelete = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
  private readonly searchName = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly btYes = () =>
    this.page.locator("xpath=//button[@type='submit']");
  private readonly btnclose = () =>
    this.page.locator("xpath=//img[@class='kt-pointer']");
  private readonly branchName = () =>
    this.page.locator("xpath=//input[@formcontrolname='name']");
  private readonly partnerbranch = () =>
    this.page.locator("xpath=//span[normalize-space()='Partner Branch']");
  private readonly addNewBranch = () =>
    this.page.locator("xpath=//span[normalize-space()='Add New Branch']");
  private readonly selVault = () =>
    this.page.locator("xpath=//select[@formcontrolname='vaultType']");
  private readonly selState = () =>
    this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly selCity = () =>
    this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly pincode = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Pin Code']");
  private readonly address = () =>
    this.page.locator("xpath=//textarea[@placeholder='Enter Address']");
  private readonly toMail = () =>
    this.page.locator("xpath=//textarea[@placeholder='Enter To Mails']");
  private readonly ccMail = () =>
    this.page.locator("xpath=//textarea[@placeholder='Enter CC Mails']");
  private readonly btAdd = () =>
    this.page.locator("xpath=//span[normalize-space()='Add']");

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
    this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToPartner(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.branchDropdown().selectOption({ label: "Show All" });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.userManagent().click();
    await this.page.waitForTimeout(5000);
  }

  // ── Actions (from Flow42_ValidateAddNewPartner) ───────────────────────────

  /**
   * Port of Java Flow42_ValidateAddNewPartner.validateAddNewPartner().
   *
   * NOTE: logout() at the end is OMITTED. Session management handled by caller.
   *
   * TODO(port): File upload — Java used sendKeys to //input[@type='file'].
   * Best-effort Playwright: setInputFiles(). Caller must supply documentPath.
   *
   * Returns displayed { firstName, lastName, email, mobile } for spec assertions.
   */
  async uploadPartnerImage(imagePath?: string): Promise<void> {
    await this.Kycpage.uploadFileWithValidation(
      imagePath,
      "xpath=//input[@type='file']",
      "Image",
      0,
    );
    console.log("IMAGE PATH:", imagePath);
  }

  async validateAddNewPartner(
    documentPath?: string,
    //imagePath?: string,
  ): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  }> {
    const firstNames = [
      "Priya",
      "Ankit",
      "Rohan",
      "Sneha",
      "Neha",
      "Amit",
      "Kiran",
      "Vikram",
    ];
    const lastNames = [
      "Thorat",
      "Patil",
      "Sharma",
      "Verma",
      "Kumar",
      "Deshmukh",
      "Reddy",
      "Gupta",
    ];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const email = `user${timestamp}@temp.com`;
    const firstDigit = Math.floor(Math.random() * 4) + 6;
    const rest = Math.floor(Math.random() * 1_000_000_000);
    const mobile = `${firstDigit}${String(rest).padStart(9, "0")}`;
    const commission = "1";
    const cashDisbursementLimit = "1000";
    const cashLimitVal = "10000";
    const cashLimitDisburse = "10000";
    const cashRepaymentVal = "100000";

    await this.navigateToPartner();

    // Scroll sidebar menu to top
    const scrollDiv = this.page.locator(
      "xpath=//div[@id='kt_aside_menu']//div[@class='ps__thumb-y']",
    );
    if ((await scrollDiv.count()) > 0) {
      await scrollDiv.evaluate((el: any) => {
        el.scrollTop = 0;
      });
    }

    await this.page.waitForTimeout(1500);
    await this.btnAddpartner().click();
    await this.page.waitForTimeout(1000);

    await this.firstName().fill(fn);
    await this.lastName().fill(ln);
    await this.mobileNumber().fill(mobile);
    await this.emailID().fill(email);

    await this.dropdown().click();
    await this.Radio().click();
    await this.dropdown().click();

    await this.jsClick(this.multiModeDisbursement());

    const commEl = this.enterCommision();
    await commEl.clear();
    await commEl.fill(commission);

    await this.cashDisbursementlimit().fill(cashDisbursementLimit);
    await this.page.waitForTimeout(5000);

    await this.page
      .locator("(//mat-radio-button[@value='loanId'])[1]")
      .click({ force: true });

    await this.jsClick(this.btnYes());
    const cashLimit = this.cashLimit();

    await cashLimit.waitFor({
      state: "visible",
      timeout: 30000,
    });

    await cashLimit.fill(cashLimitVal);
    await this.CashLimitDisburse().fill(cashLimitDisburse);
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("(//label[.//input[@type='radio' and @value='customerId']])[2]")
      .click({ force: true });
    await this.jsClick(this.btncashYes());

    await this.cashRepayment().fill(cashRepaymentVal);
    await this.page.waitForTimeout(5000);
    const imagePath = path.resolve("testdata/admin/image.png");
    await this.page
      .locator("input[type='file']")
      .first()
      .setInputFiles(imagePath);
    console.log("Image uploaded");

    await this.page.waitForTimeout(5000);
    await this.btnAdd().click();
    await this.page.waitForTimeout(15000);

    // Open View popup for the second entry
    const viewBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[2]",
    );
    await viewBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewBtn.click();
    await this.page.waitForTimeout(3000);

    const displayedFirstName = (await this.firstName().inputValue()).trim();
    const displayedLastName = (await this.lastName().inputValue()).trim();
    const displayedEmail = (await this.emailID().inputValue()).trim();
    const displayedMobile = (await this.mobileNumber().inputValue()).trim();

    await this.btnclose().click();
    await this.page.waitForTimeout(5000);
    await this.validateEdit();
    await this.page.waitForTimeout(5000);
    await this.validateDeletePartner();
    return {
      firstName: displayedFirstName,
      lastName: displayedLastName,
      email: displayedEmail,
      mobile: displayedMobile,
    };
  }

  /**
   * Port of Java Flow42_ValidateAddNewPartner.validateEdit().
   *
   * NOTE: login()/logout() calls OMITTED. Caller handles session.
   */
  async validateEdit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // await this.navigateToPartner();

    await this.page.waitForTimeout(500);
    const editBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Edit')])[1]",
    );
    await editBtn.waitFor({ state: "visible", timeout: 10000 });
    await editBtn.click();

    await this.page.waitForTimeout(500);
    const commEl = this.enterCommision();
    await commEl.clear();
    await this.page.waitForTimeout(500);
    await commEl.fill("2%");
    await this.page.waitForTimeout(500);
    await this.btnUpdate().click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Port of Java Flow42_ValidateAddNewPartner.validateDeletePartner().
   *
   * NOTE: login()/logout() calls OMITTED. Caller handles session.
   */
  async validateDeletePartner(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // await this.navigateToPartner();
    await this.page.waitForTimeout(1500);
    await this.expandSidebar();
    await this.page.waitForTimeout(500);

    const deleteBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
    await deleteBtn.waitFor({ state: "visible", timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(500);
    await this.btYes().click();
    await this.page.waitForTimeout(500);
  }
}
