import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";


export class PartnerLoanPage extends AdminBasePage {
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly customerManagementBtn: Locator;
  private readonly allCustomers: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly kebabMenu: Locator;
  private readonly startNewGL: Locator;
  private readonly btnAdd: Locator;
  private readonly appraiserRequests: Locator;
  private readonly textField: Locator;
  private readonly kebabMenu1: Locator;
  private readonly applyLoan: Locator;
  private readonly btnOk: Locator;
  private readonly btnNext: Locator;
  private readonly purposeDropdown: Locator;
  private readonly txtNameField: Locator;
  private readonly txtNomineeAge: Locator;
  private readonly relationDropdown: Locator;
  private readonly txtMobileNumber: Locator;
  private readonly ornamentDropdownArrow: Locator;
  private readonly ornamentOptions: Locator;
  private readonly numberOfPieces: Locator;
  private readonly grossWeight: Locator;
  private readonly deductionWeight: Locator;
  private readonly btnAttach: Locator;
  private readonly imgAttach: Locator;
  private readonly imgCamera: Locator;
  private readonly selKarat: Locator;
  private readonly selPurity: Locator;
  private readonly addMoreBtn: Locator;
  private readonly selPartner: Locator;
  private readonly selScheme: Locator;
  private readonly loanAmount: Locator;
  private readonly calculateBtn: Locator;
  private readonly loanAmountField: Locator;
  private readonly toBePaid: Locator;
  private readonly advanceCashField: Locator;
  private readonly wavierInput: Locator;
  private readonly scrollableTable: Locator;

  constructor(page: Page) {
    super(page);
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
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
    this.kebabMenu = this.page.locator(
      "xpath=(//button[.//mat-icon[text()='more_vert']])[1]",
    );
    this.startNewGL = this.page.locator(
      "xpath=//button[normalize-space()='Start New Gold Loan']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.appraiserRequests = this.page.locator(
      "xpath=//span[normalize-space()='Appraiser Requests']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.kebabMenu1 = this.page.locator(
      "xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]",
    );
    this.applyLoan = this.page.locator(
      "xpath=//button[normalize-space()='Apply Loan']",
    );
    this.btnOk = this.page.locator("xpath=//button[@type='submit']");
    this.btnNext = this.page.locator(
      "xpath=//button[span[normalize-space() = 'Next']]",
    );
    this.purposeDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='purpose']",
    );
    this.txtNameField = this.page.locator(
      "xpath=//input[@formcontrolname='nomineeName']",
    );
    this.txtNomineeAge = this.page.locator(
      "xpath=//input[@formcontrolname='nomineeAge']",
    );
    this.relationDropdown = this.page.locator(
      "xpath=//select[contains(@class,'form-control') and @formcontrolname='relationship']",
    );
    this.txtMobileNumber = this.page.locator(
      "xpath=//input[@formcontrolname='mobileNumber']",
    );
    this.ornamentDropdownArrow = this.page.locator(
      "xpath=//input[@role='combobox']//following::span[@class='ng-arrow-wrapper']",
    );
    this.ornamentOptions = this.page.locator(
      "xpath=//span[@class='ng-option-label ng-star-inserted']",
    );
    this.numberOfPieces = this.page.locator(
      "xpath=//input[@formcontrolname='quantity']",
    );
    this.grossWeight = this.page.locator(
      "xpath=//input[@formcontrolname='grossWeight']",
    );
    this.deductionWeight = this.page.locator(
      "xpath=//input[@formcontrolname='deductionWeight']",
    );
    this.btnAttach = this.page.locator("xpath=(//button[@type='button'])[3]");
    this.imgAttach = this.page.locator(
      "xpath=//img[@class='placeholder-image']",
    );
    this.imgCamera = this.page.locator(
      "xpath=//img[@src='../../../../../assets/media/icons/camera.svg']",
    );
    this.selKarat = this.page.locator(
      "xpath=//select[@formcontrolname='karat']",
    );
    this.selPurity = this.page.locator(
      "xpath=//select[@formcontrolname='ltvPercent']",
    );
    this.addMoreBtn = this.page.locator(
      "xpath=//button[normalize-space()='+ Add More']",
    );
    this.selPartner = this.page.locator(
      "xpath=//select[@formcontrolname='partnerId']",
    );
    this.selScheme = this.page.locator(
      "xpath=//select[@formcontrolname='schemeId']",
    );
    this.loanAmount = this.page.locator(
      "xpath=//input[@formcontrolname='finalLoanAmount']",
    );
    this.calculateBtn = this.page.locator(
      "xpath=//button[.//span[normalize-space(text())='Calculate']]",
    );
    this.loanAmountField = this.page.locator(
      "xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]",
    );
    this.toBePaid = this.page.locator(
      "xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']",
    );
    this.advanceCashField = this.page.locator(
      "xpath=//td//input[@formcontrolname='advanceCash']",
    );
    this.wavierInput = this.page.locator(
      "xpath=//input[@formcontrolname='wavier']",
    );
    this.scrollableTable = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
  }


  async validateLoanwithPartner_appraiserPart(): Promise<void> {
    const data = getLoginData();

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn.click();
    await this.waitForLoaderToDisappear();
    await this.allCustomers.click();
    await this.waitForLoaderToDisappear();
    await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.filterbtn.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.kebabMenu.click();
    await this.waitForLoaderToDisappear();
    await this.startNewGL.click();
    await this.waitForLoaderToDisappear();
    await this.btnAdd.click();
    await this.page.waitForTimeout(3000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);
    await this.appraiserRequests.waitFor({ state: "visible" });
    await this.appraiserRequests.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.textField.fill(data.firstName);

    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = (el as any).scrollWidth;
    });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable.click();
    await this.scrollableTable.evaluate((el) => {
      (el as any).scrollLeft = 0;
    });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1);
    await this.jsClick(this.applyLoan);
    await this.btnOk.click();
    await this.waitForLoaderToDisappear();

    await this.validateBasicDetails();
    await this.validateNomineeDetails();
    await this.validateOrnaments();
    await this.validateFICPage();
    await this.validateBankDetailsWithAdvanceCash();
  }

  async validateBasicDetails(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.purposeDropdown.scrollIntoViewIfNeeded().catch(() => {});
    await this.purposeDropdown.selectOption({ label: "Business Expansion" });
    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClickLocal(this.btnNext);
  }

  async validateNomineeDetails(): Promise<void> {
    await this.txtNameField.waitFor({ state: "visible" });
    await this.page.waitForTimeout(500);
    await this.txtNameField.click();
    await this.txtNameField.clear();
    await this.txtNameField.fill("Suman");

    await this.txtNomineeAge.waitFor({ state: "visible" });
    await this.txtNomineeAge.click();
    await this.txtNomineeAge.clear();
    await this.txtNomineeAge.fill("50");

    await this.relationDropdown.waitFor({ state: "visible" });
    await this.relationDropdown.selectOption({ label: "Mother" });

    await this.txtMobileNumber.waitFor({ state: "visible" });
    await this.txtMobileNumber.click();
    await this.txtMobileNumber.clear();
    await this.txtMobileNumber.fill("7567201900");
    await this.page.waitForTimeout(2000);
    await this.safeClickLocal(this.btnNext);
  }

  async validateOrnaments(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.page.evaluate("window.scrollBy(0, 1000)");
    await this.page.waitForTimeout(3000);
    await this.page.evaluate("window.scrollBy(0, -500)");
    await this.page.waitForTimeout(5000);

    for (let i = 0; i < 2; i++) {
      await this.ornamentDropdownArrow.waitFor({ state: "visible" });
      await this.ornamentDropdownArrow.scrollIntoViewIfNeeded().catch(() => {});
      await this.page.waitForTimeout(1000);
      await this.ornamentDropdownArrow.click();

      const opts = await this.ornamentOptions.all();
      const indexToClick = 4 + i;
      if (opts.length > indexToClick) {
        await opts[indexToClick].click();
      }

      await this.page.waitForTimeout(5000);
      await this.numberOfPieces.fill("1");
      await this.enterGrossAndDeductionDecimal(300.0);

      await this.page.waitForTimeout(2000);
      await this.btnAttach.click();
      await this.page.waitForTimeout(2000);
      await this.imgCamera.click();
      await this.page.waitForTimeout(2000);
      await this.imgAttach.click();
      await this.page.waitForTimeout(2000);
      await this.imgCamera.click();
      await this.page.waitForTimeout(2000);

      await this.selKarat.selectOption({ label: "22 K HM" });
      await this.selPurity.selectOption({ label: "98 %" });

      if (i === 0) {
        await this.addMoreBtn.scrollIntoViewIfNeeded().catch(() => {});
        await this.page.waitForTimeout(2000);
        await this.addMoreBtn.click();
      }
    }

    await this.btnNext.scrollIntoViewIfNeeded().catch(() => {});
    await this.safeClickLocal(this.btnNext);
  }

  async validateFICPage(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner.selectOption({ label: "ARVOG ARV-10" });
    await this.page.waitForTimeout(2000);
    await this.selScheme.selectOption({ label: "W0 (0 - 5000000)" });
    await this.page.waitForTimeout(2000);
    await this.loanAmount.fill("75000");
    await this.page.waitForTimeout(5000);

    await this.calculateBtn.waitFor({ state: "visible" });
    await this.calculateBtn.dblclick();
    await this.calculateBtn.click();
    await this.page.waitForTimeout(3000);

    await this.safeClickLocal(this.btnNext);
  }

  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate("window.scrollBy(0, 1000)");
    await this.page.waitForTimeout(2000);

    await this.loanAmountField.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate("window.scrollBy(0, -150)");
    await this.page.waitForTimeout(500);
    await this.loanAmountField.waitFor({ state: "visible" });
    await this.loanAmountField.click();
    await this.page.keyboard.press("Tab");

    await this.wavierInput.clear();
    await this.page.waitForTimeout(3000);
    await this.wavierInput.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(3000);

    await this.toBePaid.scrollIntoViewIfNeeded().catch(() => {});
    const str = await this.toBePaid
      .innerText()
      .then((t) => t.trim())
      .catch(() => "");
    const numericValue = str.replace(/[^0-9]/g, "");

    await this.advanceCashField.scrollIntoViewIfNeeded().catch(() => {});
    await this.advanceCashField.waitFor({ state: "visible" });
    await this.advanceCashField.clear();
    await this.advanceCashField.fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClickLocal(this.btnNext);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async enterGrossAndDeductionDecimal(grossWt: number): Promise<void> {
    const maxDed = Math.min(1.0, grossWt);
    const deductionWt = Math.random() * maxDed;
    await this.grossWeight.fill(grossWt.toFixed(1));
    await this.deductionWeight.fill(deductionWt.toFixed(1));
  }

  private async safeClickLocal(
    locator: ReturnType<typeof this.page.locator>,
  ): Promise<void> {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.waitFor({ state: "visible", timeout: 30000 });
      await locator.click();
    } catch {
      await this.jsClick(locator);
    }
  }
}
