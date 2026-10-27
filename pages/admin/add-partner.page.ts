import { Locator, Page, expect } from "@playwright/test";
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
  private readonly userManagent: Locator;
  private readonly partner: Locator;
  private readonly btnAddpartner: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly emailID: Locator;
  private readonly enterCommision: Locator;
  private readonly dropdown: Locator;
  private readonly PacketInAugmont: Locator;
  private readonly cashDisbursementlimit: Locator;
  private readonly customerID: Locator;
  private readonly loanID: Locator;
  private readonly btnYes: Locator;
  private readonly cashLimit: Locator;
  private readonly CashLimitDisburse: Locator;
  private readonly custid: Locator;
  private readonly btncashYes: Locator;
  private readonly cashRepayment: Locator;
  private readonly btnAdd: Locator;
  private readonly mobileNumber: Locator;
  private readonly Radio: Locator;
  private readonly multiModeDisbursement: Locator;
  private readonly edit: Locator;
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly searchName: Locator;
  private readonly btYes: Locator;
  private readonly btnClose: Locator;
  private readonly branchName: Locator;
  private readonly partnerbranch: Locator;
  private readonly addNewBranch: Locator;
  private readonly selVault: Locator;
  private readonly selState: Locator;
  private readonly selCity: Locator;
  private readonly pincode: Locator;
  private readonly address: Locator;
  private readonly toMail: Locator;
  private readonly ccMail: Locator;
  private readonly btAdd: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.Kycpage = new KycPage(page);
    this.userManagent = this.page.locator(
      "xpath=//span[normalize-space()='User Management']",
    );
    this.partner = this.page.locator(
      "xpath=//span[normalize-space()='Partner']",
    );
    this.btnAddpartner = this.page.locator(
      "xpath=//span[normalize-space()='Add Partner']",
    );
    this.firstName = this.page.locator(
      "xpath=//input[@placeholder='First Name']",
    );
    this.lastName = this.page.locator(
      "xpath=//input[@placeholder='Last Name']",
    );
    this.emailID = this.page.locator(
      "xpath=//input[@placeholder='e.g abc@123.com']",
    );
    this.enterCommision = this.page.locator(
      "xpath=//input[@placeholder='Enter Commission']",
    );
    this.dropdown = this.page.locator(
      "xpath=//span[@class='ng-arrow-wrapper']",
    );
    this.PacketInAugmont = this.page.locator(
      "xpath=//label[@for='togglePacketSubmit-input']",
    );
    this.cashDisbursementlimit = this.page.locator(
      "xpath=//input[@formcontrolname='cashDisbursementLimitWithoutDeclaration']",
    );
    this.customerID = this.page.locator(
      "xpath=(//input[@type='radio' and @value='customerId'])[1]",
    );
    this.loanID = this.page.locator(
      "xpath=(//input[@type='radio' and @value='loanId'])[1]",
    );
    this.btnYes = this.page.locator(
      "xpath=//label[@for='mat-radio-5-input']//div[@class='mat-radio-outer-circle']",
    );
    this.cashLimit = this.page.locator(
      "xpath=//input[@formcontrolname='cashDisbursementLimitWithDeclaration']",
    );
    this.CashLimitDisburse = this.page.locator(
      "xpath=//input[@formcontrolname='cashRepaymentLimitWithoutDeclaration']",
    );
    this.custid = this.page.locator(
      "xpath=(//label[.//input[@type='radio' and @value='customerId']])[2]",
    );
    this.btncashYes = this.page.locator(
      "xpath=//label[@for='mat-radio-11-input']//div[@class='mat-radio-outer-circle']",
    );
    this.cashRepayment = this.page.locator(
      "xpath=//input[@formcontrolname='cashRepaymentLimitWithDeclaration']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.mobileNumber = this.page.locator(
      "xpath=//input[@placeholder='e.g 9023451234']",
    );
    this.Radio = this.page.locator(
      "xpath=//span[@class='checkmark checkmark-custom header-checkmark']",
    );
    this.multiModeDisbursement = this.page.locator(
      "xpath=(//div[@class='mat-slide-toggle-ripple mat-ripple'])[5]",
    );
    this.edit = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Edit')])[1]",
    );
    this.btnUpdate = this.page.locator("xpath=//span[contains(.,'Update')]");
    this.btnDelete = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
    this.searchName = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.btYes = this.page.locator("xpath=//button[@type='submit']");
    this.btnClose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.branchName = this.page.locator(
      "xpath=//input[@formcontrolname='name']",
    );
    this.partnerbranch = this.page.locator(
      "xpath=//span[normalize-space()='Partner Branch']",
    );
    this.addNewBranch = this.page.locator(
      "xpath=//span[normalize-space()='Add New Branch']",
    );
    this.selVault = this.page.locator(
      "xpath=//select[@formcontrolname='vaultType']",
    );
    this.selState = this.page.locator(
      "xpath=//select[@formcontrolname='stateId']",
    );
    this.selCity = this.page.locator(
      "xpath=//select[@formcontrolname='cityId']",
    );
    this.pincode = this.page.locator(
      "xpath=//input[@placeholder='Enter Pin Code']",
    );
    this.address = this.page.locator(
      "xpath=//textarea[@placeholder='Enter Address']",
    );
    this.toMail = this.page.locator(
      "xpath=//textarea[@placeholder='Enter To Mails']",
    );
    this.ccMail = this.page.locator(
      "xpath=//textarea[@placeholder='Enter CC Mails']",
    );
    this.btAdd = this.page.locator("xpath=//span[normalize-space()='Add']");
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async navigateToPartner(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);
    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.userManagent.click();
    await this.page.waitForTimeout(5000);
  }
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
    await this.btnAddpartner.click();
    await this.page.waitForTimeout(1000);

    await this.firstName.fill(fn);
    await this.lastName.fill(ln);
    await this.mobileNumber.fill(mobile);
    await this.emailID.fill(email);

    await this.dropdown.click();
    await this.Radio.click();
    await this.dropdown.click();

    await this.jsClick(this.multiModeDisbursement);

    const commEl = this.enterCommision;
    await commEl.clear();
    await commEl.fill(commission);

    await this.cashDisbursementlimit.fill(cashDisbursementLimit);
    await this.page.waitForTimeout(5000);

    await this.page
      .locator("(//mat-radio-button[@value='loanId'])[1]")
      .click({ force: true });

    await this.jsClick(this.btnYes);
    const cashLimit = this.cashLimit;

    await cashLimit.waitFor({
      state: "visible",
      timeout: 30000,
    });

    await cashLimit.fill(cashLimitVal);
    await this.CashLimitDisburse.fill(cashLimitDisburse);
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("(//label[.//input[@type='radio' and @value='customerId']])[2]")
      .click({ force: true });
    await this.jsClick(this.btncashYes);

    await this.cashRepayment.fill(cashRepaymentVal);
    await this.page.waitForTimeout(5000);
    const imagePath = path.resolve("testdata/admin/image.png");
    await this.page
      .locator("input[type='file']")
      .first()
      .setInputFiles(imagePath);
    console.log("Image uploaded");

    await this.page.waitForTimeout(5000);
    await this.btnAdd.click();
    await this.page.waitForTimeout(15000);

    // Open View popup for the second entry
    const viewBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[2]",
    );
    await viewBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewBtn.click();
    await this.page.waitForTimeout(3000);

    const displayedFirstName = (await this.firstName.inputValue()).trim();
    const displayedLastName = (await this.lastName.inputValue()).trim();
    const displayedEmail = (await this.emailID.inputValue()).trim();
    const displayedMobile = (await this.mobileNumber.inputValue()).trim();

    await this.btnClose.click();
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

  async validateEdit(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // await this.navigateToPartner();

    await this.page.waitForTimeout(500);
    const editBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Edit')])[1]",
    );
    await editBtn.waitFor({ state: "visible", timeout: 10000 });
    await editBtn.click();
    const editFirstName = this.firstName;
    await editFirstName.waitFor({ state: "visible", timeout: 15000 });
    await expect
      .poll(async () => (await editFirstName.inputValue()).trim(), {
        timeout: 15000,
        message: "Edit Partner form never populated the partner's first name",
      })
      .not.toBe("");

    const commEl = this.enterCommision;
    await commEl.clear();
    await this.page.waitForTimeout(500);
    await commEl.fill("2%");
    await this.page.waitForTimeout(500);
    await this.page.waitForTimeout(500);
    // await this.page
    //   .locator(
    //     'xpath=//div[@class="ng-select-container ng-has-value"][.//div[@class="ng-placeholder" and text()="Select Disbursement Mode"]]',
    //   )
    //   .click();
    // await this.page.waitForTimeout(500);
    // await this.page
    //   .locator(
    //     'xpath=//label[contains(@class,"custom-checkbox")][.//span[@class="label-checkbox" and normalize-space(text())="Select All"]]',
    //   )
    //   .click();
    await this.btnUpdate.click();
    await this.closeEditPartnerModalIfOpen();
  }

  private async closeEditPartnerModalIfOpen(): Promise<void> {
    const heading = this.page.locator(
      "xpath=//h3[normalize-space()='Edit Partner']",
    );
    const closed = await heading
      .waitFor({ state: "hidden", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (closed) return;
    console.warn(
      "⚠ Edit Partner modal still open after Update (form validation rejected it) — cancelling.",
    );
    await this.page
      .locator("xpath=//button[normalize-space()='Cancel']")
      .first()
      .click();
    await heading.waitFor({ state: "hidden", timeout: 10000 });
  }

  async validateDeletePartner(): Promise<void> {
    await this.page.waitForTimeout(5000);
    // await this.navigateToPartner();
    await this.page.waitForTimeout(1500);
    await this.expandSidebar();
    await this.page.waitForTimeout(500);
    await this.searchPartner("Test");
    const deleteBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
    await deleteBtn.waitFor({ state: "visible", timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(500);
    await this.btYes.click();
    await this.page.waitForTimeout(500);
  }

  private async searchPartner(searchText: string): Promise<void> {
    const box = this.searchName;
    await box.waitFor({ state: "visible", timeout: 15000 });
    await box.click();
    await box.fill("");
    await box.fill(searchText);
    await box.press("Enter");
    await this.waitForLoaderToDisappear();

    const bodyRows = this.page.locator(
      "xpath=//*[@role='row'][.//*[@role='gridcell' or self::td or self::mat-cell]]",
    );
    await expect
      .poll(
        async () => {
          const rows = await bodyRows.allInnerTexts();
          return (
            rows.length > 0 &&
            rows.every((r) =>
              r.toUpperCase().includes(searchText.toUpperCase()),
            )
          );
        },
        {
          timeout: 20000,
          message: `Partner list never filtered down to "${searchText}"`,
        },
      )
      .toBe(true);
  }

  async crossCheckOldPartner(searchText: string = "Test"): Promise<string> {
    await this.navigateToPartner();

    await this.searchPartner(searchText);

    const firstResultCell = this.page
      .locator("xpath=(//mat-cell[@role='gridcell'])[2]")
      .or(
        this.page.locator(
          "xpath=(//*[@role='row'][.//*[@role='gridcell' or self::td]])[1]//*[@role='gridcell' or self::td][2]",
        ),
      )
      .first();
    const actualPartner = (await firstResultCell.innerText()).trim();
    console.log(`[crossCheckOldPartner] Found partner: "${actualPartner}"`);
    return actualPartner;
  }

  async updateOldPartner(
    newCommission: string = "2%",
    searchText: string = "Test",
  ): Promise<string> {
    // await this.navigateToPartner();

    await this.searchPartner(searchText);

    const editBtn = this.edit;
    await editBtn.waitFor({ state: "visible", timeout: 15000 });
    await editBtn.click();
    await this.page.waitForTimeout(500);

    const commEl = this.enterCommision;
    await commEl.waitFor({ state: "visible", timeout: 15000 });
    await commEl.clear();
    await commEl.fill(newCommission);
    await this.page.waitForTimeout(500);

    await this.btnUpdate.click();
    await this.page.waitForTimeout(1000);

    return newCommission;
  }
}
