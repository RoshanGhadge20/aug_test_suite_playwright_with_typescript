import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import {
  getLoginData,
  getPartnerBranchUserData,
} from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

export class AddPartnerBranchPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  private readonly btnAddUser = () =>
    this.page.locator("xpath=//button[normalize-space()='Add Partner User']");
  private readonly userFirstNameInput = () =>
    this.page.locator("xpath=//input[@placeholder='First Name']");
  private readonly userLastNameInput = () =>
    this.page.locator("xpath=//input[@placeholder='Last Name']");
  private readonly selPartnerForUser = () =>
    this.page.locator("xpath=//select[@formcontrolname='partnerId']");
  private readonly selBranchForUser = () =>
    this.page.locator("xpath=//select[@formcontrolname='branchId']");
  private readonly userEmailInput = () =>
    this.page.locator("xpath=//input[@placeholder='e.g abc@123.com']");
  private readonly userMobileInput = () =>
    this.page.locator("xpath=//input[@placeholder='e.g 9023451234']");
  private readonly selStateForUser = () =>
    this.page.locator("xpath=//select[@formcontrolname='stateId']");
  private readonly selCityForUser = () =>
    this.page.locator("xpath=//select[@formcontrolname='cityId']");
  private readonly userPinCodeInput = () =>
    this.page.locator("xpath=//input[@placeholder='Enter Pin Code']");
  private readonly btnAddUserSubmit = () =>
    this.page.locator(
      "xpath=//mat-dialog-container//button[normalize-space()='Add']",
    );
  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  private readonly branchDropdown = () =>
    this.page.locator("xpath=//select[@id='branch']");

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigateToPartnerBranch(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    // Sidebar may be collapsed off-screen in headless mode; use JS clicks.
    await this.page.evaluate(() => {
      const toggle = document.querySelector(
        ".kt-aside__brand-tools",
      ) as HTMLElement | null;
      if (toggle) toggle.click();
    });
    await this.page.waitForTimeout(1000);

    await this.page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const el = spans.find(
        (s) => s.textContent?.trim() === "User Management",
      ) as HTMLElement | undefined;
      if (el) el.click();
    });
    await this.page.waitForTimeout(1000);

    await this.page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll("span"));
      const el = spans.find(
        (s) => s.textContent?.trim() === "Partner Branch User",
      ) as HTMLElement | undefined;
      if (el) el.click();
    });
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Navigates to Partner Branch User, opens the Add Partner User dialog,
   * fills all fields with Excel static data + randomly generated name/mobile,
   * submits, and returns the entered firstName/lastName for spec assertions.
   */
  async validateAddPartnerBranchUser(): Promise<{
    firstName: string;
    lastName: string;
    mobile: string;
  }> {
    await this.navigateToPartnerBranch();
    await this.page.waitForLoadState("networkidle");

    const addUserBtn = this.btnAddUser();
    await addUserBtn.waitFor({ state: "visible", timeout: 30_000 });
    await addUserBtn.click();
    await this.page.waitForTimeout(1000);

    // Random name: "Test<stamp>" / "User<stamp>" so each run is unique.
    const stamp = TestDataFactory.stamp().replace("_", "");
    const firstName = `Test${stamp}`;
    const lastName = `User${stamp}`;
    const mobile = TestDataFactory.mobile();

    // Static data from Excel (sheetPartnerBranchUser).
    const d = getPartnerBranchUserData();
    const email = `testpartner${stamp}@${d.emailDomain}`;

    await this.userFirstNameInput().fill(firstName);
    await this.userLastNameInput().fill(lastName);

    // Partner dropdown — wait for options then pick the first non-empty one.
    const partnerSel = this.selPartnerForUser();
    await partnerSel.waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForFunction(
      () => {
        const sel = document.querySelector(
          "select[formcontrolname='partnerId']",
        ) as HTMLSelectElement | null;
        return sel && sel.options.length > 1;
      },
      { timeout: 20_000 },
    );
    await partnerSel.selectOption({ index: 1 });
    await this.page.waitForTimeout(1000);

    // Branch dropdown — may populate dynamically after partner selection.
    const branchSel = this.selBranchForUser();
    await this.page
      .waitForFunction(
        () => {
          const sel = document.querySelector(
            "select[formcontrolname='branchId']",
          ) as HTMLSelectElement | null;
          return sel && sel.options.length > 1;
        },
        { timeout: 15_000 },
      )
      .catch(() => {});
    await branchSel.selectOption({ index: 1 });
    await this.page.waitForTimeout(500);

    await this.userEmailInput().fill(email);
    await this.userMobileInput().fill(mobile);

    await this.selStateForUser().selectOption({ label: d.state });
    await this.page.waitForTimeout(500);
    await this.selCityForUser().selectOption({ label: d.city });
    await this.page.waitForTimeout(500);

    await this.userPinCodeInput().fill(d.pincode);

    await this.btnAddUserSubmit().click();
    await this.page.waitForTimeout(2000);

    console.log(
      `[validateAddPartnerBranchUser] Added user: "${firstName} ${lastName}", mobile: ${mobile}`,
    );
    return { firstName, lastName, mobile };
  }
}
