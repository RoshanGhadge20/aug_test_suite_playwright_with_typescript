import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";
import { KycPage } from "./kyc.page";
import fs from "fs";

export class KycApprovalPage extends AdminBasePage {
  private readonly kycDetails: Locator;
  private readonly applyKyc: Locator;
  private readonly textSearchField: Locator;
  private readonly btnAction: Locator;
  private readonly btnReviewandSubmit: Locator;
  private readonly selStatus: Locator;
  private readonly btnSubmit: Locator;
  private readonly customerUniqID: Locator;
  private readonly arrow: Locator;
  private readonly profile: Locator;
  private readonly firstName_kycFilter: Locator;
  private readonly filterbtn: Locator;

  constructor(page: Page) {
    super(page);
    this.kycDetails = this.page.locator(
      "xpath=//span[normalize-space()='KYC Details']",
    );
    this.applyKyc = this.page.locator(
      "xpath=//span[normalize-space()='Applied KYC']",
    );
    this.textSearchField = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.btnAction = this.page.locator(
      "xpath=(//strong[contains(text(),'Action >')])[1]",
    );
    this.btnReviewandSubmit = this.page.locator(
      "xpath=//kt-button[@ng-reflect-value='Review & Submit']//button[@type='button']",
    );
    this.selStatus = this.page.locator(
      "xpath=//select[@class='form-control ng-pristine ng-valid ng-touched']",
    );
    this.btnSubmit = this.page.locator("xpath=//span[contains(.,'Submit')]");
    this.customerUniqID = this.page.locator(
      "xpath=//input[@placeholder='Enter Customer ID']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
    this.firstName_kycFilter = this.page.locator(
      "xpath=//input[@placeholder='Enter First Name']",
    );
    this.filterbtn = this.page.locator("xpath=//button[@type='submit']");
  }

  async performOpsRatingActions(
    kycPage: KycPage,
  ): Promise<{ selectedStatus: string; formClosed: boolean }> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.kycDetails.click();
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    await this.customerUniqID.fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstName_kycFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    // Scroll to filter button then click (Java used scrollIntoView + direct click)
    const filterBtnEl = this.filterbtn;
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);

    // clickWithRetry equivalent
    await this.clickWithRetry();
    await this.page.waitForTimeout(1500);

    // Flow01_Kyc.reviewAndSubmit() — delegated to KycPage
    await kycPage.reviewAndSubmit();
    await this.page.waitForTimeout(5000);

    const kycStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    await kycStatusDropdown.waitFor({ state: "visible" });
    await kycStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await kycStatusDropdown.evaluate((el: any) => el.click());
    await kycStatusDropdown.selectOption({ label: "Approved" });
    const selectedStatus = await kycStatusDropdown
      .evaluate(
        (el: HTMLSelectElement) =>
          el.options[el.selectedIndex]?.text.trim() ?? "",
      )
      .catch(() => "");
    await this.page.waitForTimeout(5000);

    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
    const formClosed = !(await kycStatusDropdown
      .isVisible()
      .catch(() => false));

    return { selectedStatus, formClosed };
  }

  async clickWithRetry(maxAttempts = 3): Promise<void> {
    const actionLocator = this.page.locator(
      "xpath=(//strong[contains(text(),'Action >')])[1]",
    );
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.page.waitForTimeout(1500);
        await actionLocator.waitFor({ state: "visible", timeout: 20_000 });
        await actionLocator.click();
        return;
      } catch {
        if (attempt === maxAttempts - 1) {
          throw new Error("Action button not clickable after retries");
        }
      }
    }
  }
  async performOpsRatingActionRejected(kycPage: KycPage): Promise<void> {
    const data = getLoginData();

    await this.page.waitForTimeout(500);

    await this.profile.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);

    const branchDropdown = this.page.locator(
      "xpath=//select[@id='branch' and contains(@class, 'form-control')]",
    );
    await branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(5000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.kycDetails.click();
    await this.waitForLoaderToDisappear();
    await this.applyKyc.click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(2000);
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    await this.customerUniqID.fill(customerData.customerId.trim());
    console.log(customerData.customerId);
    //await this.firstName_kycFilter.fill(data.firstName);
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const filterBtnEl = this.filterbtn;
    await filterBtnEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await filterBtnEl.click();
    await this.waitForLoaderToDisappear();

    await this.page.waitForTimeout(500);
    await this.clickWithRetry();
    await this.page.waitForTimeout(1500);
    await kycPage.reviewAndSubmit();
    await this.page.waitForTimeout(5000);

    const kycStatusDropdown = this.page.locator(
      "xpath=//select[@formcontrolname='kycStatusFromOperationalTeam']",
    );
    await kycStatusDropdown.waitFor({ state: "visible" });
    await kycStatusDropdown.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(500);
    await kycStatusDropdown.evaluate((el: any) => el.click());
    await kycStatusDropdown.selectOption({ label: "Rejected" });
    await this.page.waitForTimeout(5000);

    await this.btnSubmit.click();
    await this.waitForLoaderToDisappear();
  }
}
