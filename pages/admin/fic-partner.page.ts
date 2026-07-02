import { Page } from '@playwright/test';
import { AdminBasePage } from './admin-base.page';
import { getLoginData } from '../../utils/data/admin-excel-data';

/**
 * Port of Java: Flow26_FICPagewithPartner (actions)
 * No dedicated PO — reuses PO04_NewGoldLoan locators (re-declared here).
 *
 * Omitted loginWith* calls:
 *   - validateGoldLoan() calls loginWithAppraiser() — OMITTED.
 *     Caller must inject loginAs('appraiser') before calling validateGoldLoan().
 *   - logout() at end — OMITTED.
 */
export class FicPartnerPage extends AdminBasePage {
  constructor(page: Page) { super(page); }

  // ── Locators (re-declared from PO04_NewGoldLoan / inline) ────────────────

  private readonly profile = () => this.page.locator("xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']");
  private readonly arrow = () => this.page.locator("xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']");
  private readonly branchDropdown = () => this.page.locator("xpath=//select[@id='branch' and contains(@class, 'form-control')]");
  private readonly customerManagementBtn = () => this.page.locator("xpath=(//span[normalize-space()='Customer Management'])[1]");
  private readonly appraisalRequest = () => this.page.locator("xpath=//span[normalize-space()='Appraiser Requests']");
  private readonly textField = () => this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly kebabMenu1 = () => this.page.locator("xpath=(//mat-row[.//*[contains(text(),'New Loan')]]//mat-icon[normalize-space()='more_vert'])[1]");
  private readonly applyLoan = () => this.page.locator("xpath=//button[normalize-space()='Apply Loan']");
  private readonly btnOk = () => this.page.locator("xpath=//button[@type='submit']");
  private readonly btnNext = () => this.page.locator("xpath=//button[span[normalize-space() = 'Next']]");
  private readonly selPartner = () => this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly selScheme = () => this.page.locator("xpath=//select[@formcontrolname='schemeId']");
  private readonly loanAmount = () => this.page.locator("xpath=//input[@formcontrolname='finalLoanAmount']");
  private readonly calculateBtn = () => this.page.locator("xpath=//button[.//span[normalize-space(text())='Calculate']]");
  private readonly interestTable = () => this.page.locator("xpath=(//kt-interest-calculator//table//tr[1]/td[4])[last()]");
  private readonly loanAmountField = () => this.page.locator("xpath=//td[normalize-space(.)='Loan Amount']/following-sibling::td[contains(@class,'currency')]");
  private readonly toBePaid = () => this.page.locator("xpath=//td[normalize-space(text())='To be paid']/following-sibling::td[@class='currency']");
  private readonly advanceCashField = () => this.page.locator("xpath=//td//input[@formcontrolname='advanceCash']");
  private readonly wavierInput = () => this.page.locator("xpath=//input[@formcontrolname='wavier']");
  private readonly scrollableTable = () => this.page.locator("xpath=//div[@class='mat-table__wrapper']");

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Port of Flow26_FICPagewithPartner.validateGoldLoan().
   * Caller must first loginAs('appraiser').
   */
  async validateGoldLoan(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(3000);

    await this.profile().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    await this.branchDropdown().waitFor({ state: 'visible' });
    await this.branchDropdown().selectOption({ label: 'Show All' });
    await this.page.waitForTimeout(5000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);
    await this.customerManagementBtn().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(7000);

    await this.appraisalRequest().click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.textField().fill(data.firstName);

    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = (el as any).scrollWidth; });
    await this.page.waitForTimeout(3000);
    await this.scrollableTable().click();
    await this.scrollableTable().evaluate((el) => { (el as any).scrollLeft = 0; });
    await this.page.waitForTimeout(3000);

    await this.jsClick(this.kebabMenu1());
    await this.jsClick(this.applyLoan());
    await this.btnOk().click();
    await this.waitForLoaderToDisappear();

    // Skip basic details, nominee, ornaments — just click Next 3 times
    for (let i = 0; i < 3; i++) {
      await this.safeClick(this.btnNext());
    }

    await this.validateFICPage();
    await this.validateBankDetailsWithAdvanceCash();
  }

  async validateFICPage(): Promise<void> {
    await this.page.waitForTimeout(5000);
    await this.selPartner().selectOption({ label: 'ICICI ICI-4' });
    await this.page.waitForTimeout(2000);
    await this.selScheme().selectOption({ label: '15_FEB_SEC (0 - 5000000)' });
    await this.page.waitForTimeout(2000);
    await this.loanAmount().fill('75000');
    await this.page.waitForTimeout(5000);

    await this.calculateBtn().waitFor({ state: 'visible' });
    await this.calculateBtn().dblclick();
    await this.page.waitForTimeout(3000);
    await this.calculateBtn().click();

    // Read interest table value (return for logging)
    const interestStr = await this.interestTable().waitFor({ state: 'visible', timeout: 15000 })
      .then(() => this.interestTable().innerText())
      .catch(() => '');

    await this.page.waitForTimeout(3000);
    await this.safeClick(this.btnNext());
  }

  async validateBankDetailsWithAdvanceCash(): Promise<void> {
    await this.page.waitForTimeout(2000);
    await this.page.evaluate('window.scrollBy(0, 1000)');
    await this.page.waitForTimeout(2000);

    await this.loanAmountField().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page.evaluate('window.scrollBy(0, -150)');
    await this.page.waitForTimeout(500);
    await this.loanAmountField().waitFor({ state: 'visible' });
    await this.loanAmountField().click();
    await this.page.keyboard.press('Tab');

    await this.wavierInput().clear();
    await this.page.waitForTimeout(3000);
    await this.wavierInput().scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(3000);

    await this.toBePaid().scrollIntoViewIfNeeded().catch(() => {});
    const str = await this.toBePaid().innerText().then(t => t.trim()).catch(() => '');
    const numericValue = str.replace(/[^0-9]/g, '');

    await this.advanceCashField().scrollIntoViewIfNeeded().catch(() => {});
    await this.advanceCashField().waitFor({ state: 'visible' });
    await this.advanceCashField().clear();
    await this.advanceCashField().fill(numericValue);
    await this.page.waitForTimeout(4000);
    await this.safeClick(this.btnNext());
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async safeClick(locator: ReturnType<typeof this.page.locator>): Promise<void> {
    try {
      await locator.scrollIntoViewIfNeeded().catch(() => {});
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      await locator.click();
    } catch {
      await this.jsClick(locator);
    }
  }
}
