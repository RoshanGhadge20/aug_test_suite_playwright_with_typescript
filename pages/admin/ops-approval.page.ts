import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import fs from "fs";

export class OpsApprovalPage extends AdminBasePage {
  private readonly btnOPSTeam: Locator;
  private readonly btnApprove: Locator;
  private readonly btnYes: Locator;
  private readonly txtArea: Locator;
  private readonly submit: Locator;
  private readonly selAtatus: Locator;
  private readonly txtarea: Locator;
  private readonly btnSubmit: Locator;
  private readonly partnerApproval: Locator;
  private readonly profile: Locator;
  private readonly arrow: Locator;
  private readonly textField: Locator;
  private readonly branchDropdown: Locator;
  private readonly loanManagement: Locator;
  private readonly firstNameFilter: Locator;
  private readonly filterbtn: Locator;
  private readonly btnNext: Locator;

  constructor(page: Page) {
    super(page);
    this.btnOPSTeam = this.page.locator(
      "xpath=//button[normalize-space()='OPS TEAM RATING']",
    );
    this.btnApprove = this.page.locator(
      "xpath=//span[normalize-space()='Approve']",
    );
    this.btnYes = this.page.locator("xpath=//span[normalize-space()='Yes']");
    this.txtArea = this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
    this.submit = this.page.locator(
      "xpath=(//span[@class='mat-button-wrapper'])[4]",
    );
    this.selAtatus = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
    this.txtarea = this.page.locator(
      "xpath=//textarea[@formcontrolname='commentByOperatinalTeam']",
    );
    this.btnSubmit = this.page.locator(
      "xpath=(//span[@class='mat-button-wrapper'])[2]",
    );
    this.partnerApproval = this.page.locator(
      "xpath=(//button[normalize-space()='PARTNER APPROVAL'])[1]",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.textField = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer Unique Id']",
    );
    this.branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    this.loanManagement = this.page.locator(
      "xpath=//span[normalize-space()='Loan Management']",
    );
    this.firstNameFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
    this.btnNext = this.page
      .locator("xpath=//button[span[normalize-space() = 'Next']]")
      .first();
  }

  async opsAprroval(): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(5000);
    await this.profile.click();
    await this.page.waitForTimeout(5000);
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(500);

    await this.loanManagement.click();
    await this.waitForLoaderToDisappear();

    const appliedLoan = this.page.locator(
      "xpath=//span[normalize-space()='Applied Loan']",
    );
    await appliedLoan.scrollIntoViewIfNeeded();
    await appliedLoan.click();
    await this.waitForLoaderToDisappear();
    const currentCustomer = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    const customerId = String(currentCustomer.customerId).trim();
    await this.textField.fill(customerId);
    console.log(customerId);
    // await this.firstNameFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const filterBtn = this.filterbtn;
    await filterBtn.waitFor({ state: "attached", timeout: 15000 });
    await filterBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await filterBtn.click({ force: true });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.clickFirstUnlockedOpsTeamRating();
    await this.waitForLoaderToDisappear();

    // safeClick(PO04_NewGoldLoan.loc_btnNext) × 5
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(500);
    await this.jsClick(this.btnNext);

    await this.page.waitForTimeout(5000);
    //await this.btnApprove.click();
    // await this.waitForLoaderToDisappear();
    // await this.btnYes.click();
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(2000);

    // await this.txtArea.fill("Verified");
    // await this.waitForLoaderToDisappear();
    // await this.page.waitForTimeout(5000);

    // await this.submit.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    await this.jsClick(this.btnNext);
    await this.page.waitForTimeout(1000);

    await this.page.waitForTimeout(5000);
    const incorrectAppForm = this.page.locator(
      "xpath=//img[@name='incorrectApplicationFormForOperatinalTeam']",
    );
    const selectedTab = this.page.locator(
      "xpath=//div[@role='tablist']//*[@role='tab' and @aria-selected='true']",
    );
    const feedback = this.page.locator(
      "xpath=//*[contains(@class,'toast-message') or contains(@class,'swal2-html-container') or contains(@class,'alert-danger')]",
    );
    let lastTab = "";
    let stalled = 0;
    for (let i = 0; i < 10; i++) {
      if (await incorrectAppForm.isVisible().catch(() => false)) break;
      await this.safeScrollAndClick();
      await this.waitForLoaderToDisappear();
      await this.page.waitForTimeout(3000);
      // A Next that doesn't change the selected tab is rejected by the app (validation / API
      // error). Retry a couple of times, then fail with the tab + message instead of a bare
      // locator timeout on the rating icon.
      const tab = ((await selectedTab.first().innerText().catch(() => "")) || "").trim();
      stalled = tab === lastTab ? stalled + 1 : 0;
      lastTab = tab;
      if (stalled >= 2) {
        const msg = ((await feedback.first().innerText().catch(() => "")) || "").trim();
        throw new Error(
          `OPS approval is stuck on the "${tab}" tab — Next does not advance and the later tabs ` +
            `stay disabled. App message: "${msg || "none shown"}".`,
        );
      }
    }
    await incorrectAppForm.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("xpath=//img[@name='incorrectGoldValuationForOperatinalTeam']")
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(1500);

    const selectStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='loanStatusForOperatinalTeam']",
    );
    await selectStatusDropdown.selectOption({ label: "Approved" });
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);

    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
  }

  async clickFirstUnlockedOpsTeamRating(): Promise<void> {
    const buttons = this.btnOPSTeam;
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      try {
        await buttons.nth(i).click({ timeout: 5000 });
        return;
      } catch {
        // Locked row — the lock icon intercepts pointer events. Try the next candidate.
      }
    }
    throw new Error(
      `No clickable "OPS TEAM RATING" button found among ${count} candidates — all appear locked by another session.`,
    );
  }

  async safeScrollAndClick(): Promise<void> {
    const locator = this.btnNext;
    const hasNext = await locator
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasNext) {
      return;
    }

    try {
      await locator.click();
    } catch {
      await locator.click();
    }
  }
}
