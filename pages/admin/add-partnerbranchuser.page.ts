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
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[contains(.,'Edit')]");
  private readonly btnDelete = () =>
    this.page.locator("xpath=(//div[contains(.,'Delete')])[1]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnView = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[1]",
    );
  private readonly btnClose = () =>
    this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
  private readonly selPartner = () =>
    this.page.locator("xpath=//select[@formcontrolname='partnerId']");

  private readonly partnerBranchUserNav = () =>
    this.page.locator("xpath=//span[normalize-space()='Partner Branch User']");

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
  private readonly enterText = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly arrow = () =>
    this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
  private readonly branchDropdown = () =>
    this.page.locator("xpath=//select[@id='branch']");
  private readonly userManagent = () =>
    this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly btnSendOtp = () =>
    this.page.locator("xpath=//button[normalize-space()='Send OTP']");
  private readonly otpDigit = () =>
    this.page.locator("xpath=//input[@formcontrolname='otp']");
  private readonly btnVerifyOtp = () =>
    this.page.locator("xpath=//button[normalize-space()='Verify']");

  private readonly profile = () =>
    this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );

  // ── Navigation ────────────────────────────────────────────────────────────

  private async navigateToPartnerBranchUser(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    // Confirmed live: selecting any branch scope other than the account's own assigned
    // branch gets the session force-logged-out on UAT within ~3s (backend rejects
    // subsequent calls with 401/403, Angular's http interceptor redirects to /auth/login).
    // Leave the account on its default branch scope instead of calling selectOption().
    await this.branchDropdown().waitFor({ state: "visible" });
    await this.page.waitForTimeout(7000);

    await this.arrow().click();
    await this.page.waitForTimeout(1000);
    await this.userManagent().click();
    await this.page.waitForTimeout(1000);

    const pbuLink = this.partnerBranchUserNav();
    await pbuLink.waitFor({ state: "visible", timeout: 15_000 });
    await pbuLink.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  private async openPartnerBranchUserList(searchText: string): Promise<void> {
    await this.navigateToPartnerBranchUser();

    await this.enterText().fill(searchText);
    await this.page.waitForTimeout(2000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Scans every "View"/"Edit"/"Delete" candidate on the Partner Branch User list and
   * returns the one whose row text actually contains searchText (same resilient pattern
   * appraiser-request.page.ts's updateAppraiserFirstAvailable() uses, since the search box
   * itself can't be trusted to have filtered anything). Falls back to the first candidate
   * if none match, on the assumption the table only shows one page of results.
   *
   * NOTE: unverified against the live Partner Branch User table — ported by convention from
   * the working Partner Branch row-actions pattern in this same file, not yet run for real.
   */
  private async resolvePartnerBranchUserAction(
    action: "View" | "Edit" | "Delete",
    searchText: string,
  ): Promise<import("@playwright/test").Locator> {
    const candidates = this.page.locator(
      `xpath=//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'${action}')]`,
    );
    const count = await candidates.count();
    for (let i = 0; i < count; i++) {
      const rowText = await candidates
        .nth(i)
        .locator("xpath=ancestor::mat-row[1]")
        .innerText()
        .catch(() => "");
      if (rowText.toLowerCase().includes(searchText.toLowerCase())) {
        return candidates.nth(i);
      }
    }
    if (count === 0) {
      throw new Error(`No "${action}" action found for "${searchText}".`);
    }
    console.warn(
      `[resolvePartnerBranchUserAction] No row matched "${searchText}" for "${action}" — falling back to the first candidate.`,
    );
    return candidates.first();
  }

  /**
   * Navigates to Partner Branch User, opens the Add Partner User dialog, fills all fields
   * with Excel static data (sheetPartnerBranchUser) + a randomly generated unique
   * name/mobile, submits, and returns the entered firstName/lastName/mobile so callers can
   * chain straight into viewPartnerBranchUser()/editPartnerBranchUser()/
   * deletePartnerBranchUser() below without needing the separate AddPartnerBranchPage
   * fixture. Ported from add-partnerbranchuser.page.ts's validateAddPartnerBranchUser() —
   * same dropdown-population waits, since the Partner/Branch selects there populate
   * dynamically and a plain selectOption() races them.
   */
  async addPartnerBranchUser(): Promise<{
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    partner: string;
    branch: string;
  }> {
    await this.navigateToPartnerBranchUser();
    await this.page.waitForLoadState("networkidle");

    const addUserBtn = this.btnAddUser();
    await addUserBtn.waitFor({ state: "visible", timeout: 30_000 });
    await addUserBtn.click();
    await this.page.waitForTimeout(1000);

    const stamp = TestDataFactory.stamp().replace("_", "");
    const firstName = `Test${stamp}`;
    const lastName = `User${stamp}`;
    const mobile = TestDataFactory.mobile();

    //await this.userFirstNameInput().fill(firstName);

    const d = getPartnerBranchUserData();
    const email = `testpartner${stamp}@${d.emailDomain}`;

    await this.userFirstNameInput().fill(firstName);
    await this.userLastNameInput().fill(lastName);

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
    const branchSel = this.selBranchForUser();
    const branchesLoaded = (timeout: number) =>
      this.page
        .waitForFunction(
          () => {
            const sel = document.querySelector(
              "select[formcontrolname='branchId']",
            ) as HTMLSelectElement | null;
            return !!sel && sel.options.length > 1;
          },
          { timeout },
        )
        .then(() => true)
        .catch(() => false);

    // Branches load only after a partner is chosen, and not every partner has any (the previous
    // hard-coded index 2 was "Ankit Sharma", who has none — the Branch select stayed empty and
    // selectOption timed out). Try partners in order until one yields branches.
    const partnerCount = await partnerSel.locator("option").count();
    let hasBranches = false;
    for (let i = 1; i < partnerCount && !hasBranches; i++) {
      if (await partnerSel.locator("option").nth(i).isDisabled()) continue;
      await partnerSel.selectOption({ index: i });
      hasBranches = await branchesLoaded(4_000);
      if (!hasBranches) {
        console.log(
          `Partner at index ${i} has no branches — trying the next partner.`,
        );
      }
    }
    if (!hasBranches) {
      throw new Error(
        "No partner in the Select Partner dropdown has any branches — can't add a Partner Branch User.",
      );
    }
    await this.page.waitForTimeout(1000);
    const partner =
      (await partnerSel.locator("option:checked").textContent())?.trim() ?? "";

    await branchSel.selectOption({ index: 1 });
    await this.page.waitForTimeout(500);
    const branch =
      (await branchSel.locator("option:checked").textContent())?.trim() ?? "";

    await this.userEmailInput().fill(email);
    await this.userMobileInput().fill(mobile);

    await this.btnSendOtp().click();
    await this.page.waitForTimeout(2000);

    // Backdoor OTP convention confirmed elsewhere in this suite (config/env.ts's ADMIN_OTP
    // defaults to '1234' whenever no role-specific OTP is configured) — this dialog verifies
    // a freshly-generated test mobile number, so there's no real SMS to read.
    const otp = "1234";
    await this.otpDigit().fill(otp);

    await this.page.waitForTimeout(500);

    await this.btnVerifyOtp().click();
    await this.page.waitForTimeout(2000);

    await this.selStateForUser().selectOption({ label: d.state });
    await this.page.waitForTimeout(500);
    await this.selCityForUser().selectOption({ label: d.city });
    await this.page.waitForTimeout(500);

    await this.userPinCodeInput().fill(d.pincode);

    await this.btnAddUserSubmit().click();
    await this.page.waitForTimeout(2000);

    console.log(
      `[addPartnerBranchUser] Added user: "${firstName} ${lastName}", mobile: ${mobile}`,
    );
    return { firstName, lastName, mobile, email, partner, branch };
  }

  async viewPartnerBranchUser(
    searchText: string,
    expected: {
      firstName: string;
      lastName: string;
      mobile: string;
      email: string;
      partner: string;
      branch: string;
    },
  ): Promise<void> {
    // await this.openPartnerBranchUserList(searchText);

    const view = await this.resolvePartnerBranchUserAction("View", searchText);
    await view.click();
    await this.page.waitForTimeout(2000);

    await this.userFirstNameInput().waitFor({
      state: "visible",
      timeout: 15000,
    });

    await expect(this.userFirstNameInput()).toHaveValue(expected.firstName);
    await expect(this.userLastNameInput()).toHaveValue(expected.lastName);
    await expect(this.userEmailInput()).toHaveValue(expected.email);
    await expect(this.userMobileInput()).toHaveValue(expected.mobile);

    const selectedPartner = await this.selPartnerForUser()
      .locator("option:checked")
      .textContent();
    console.log("Selected Partner:", selectedPartner);
    expect(selectedPartner?.trim()).toBe(expected.partner);

    const selectedBranch = await this.selBranchForUser()
      .locator("option:checked")
      .textContent();
    console.log("Selected Branch:", selectedBranch);
    expect(selectedBranch?.trim()).toBe(expected.branch);

    console.log("Partner Branch User view details verified successfully");

    await this.btnClose().click();
  }


  async editPartnerBranchUser(
    searchText: string,
    newLastName: string,
  ): Promise<string> {
    //await this.openPartnerBranchUserList(searchText);

    const edit = await this.resolvePartnerBranchUserAction("Edit", searchText);
    await edit.click();
    await this.page.waitForTimeout(2000);

    const lastNameField = this.userLastNameInput();
    await lastNameField.waitFor({ state: "visible", timeout: 15000 });
    await lastNameField.fill("");
    await lastNameField.fill(newLastName);
    await this.page.waitForTimeout(1000);

    await this.btnUpdate().click();
    await this.waitForLoaderToDisappear();

    return newLastName;
  }

  /**
   * Deletes the Partner Branch User matching searchText and confirms via the Yes dialog.
   */
  async deletePartnerBranchUser(searchText: string): Promise<void> {
    // await this.openPartnerBranchUserList(searchText);

    const del = await this.resolvePartnerBranchUserAction("Delete", searchText);
    await del.click();
    await this.page.waitForTimeout(1000);

    await this.btnYes().click();
    await this.waitForLoaderToDisappear();
  }

  async runPartnerBranchUserFullCycle(): Promise<void> {
    const created = await this.addPartnerBranchUser();
    await this.page.waitForTimeout(5000);

    await this.viewPartnerBranchUser(created.mobile, created);
    await this.page.waitForTimeout(5000);

    await this.editPartnerBranchUser(
      created.mobile,
      `Updated${TestDataFactory.stamp().replace("_", "")}`,
    );
    await this.page.waitForTimeout(5000);

    //await this.deletePartnerBranchUser(created.mobile);
  }
}
