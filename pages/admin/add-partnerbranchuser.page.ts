import { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import {
  getLoginData,
  getPartnerBranchUserData,
} from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

export class AddPartnerBranchPage extends AdminBasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  private readonly btnUpdate: Locator;
  private readonly btnDelete: Locator;
  private readonly btnYes: Locator;
  private readonly btnView: Locator;
  private readonly btnClose: Locator;
  private readonly selPartner: Locator;
  private readonly partnerBranchUserNav: Locator;
  private readonly btnAddUser: Locator;
  private readonly userFirstNameInput: Locator;
  private readonly userLastNameInput: Locator;
  private readonly selPartnerForUser: Locator;
  private readonly selBranchForUser: Locator;
  private readonly userEmailInput: Locator;
  private readonly userMobileInput: Locator;
  private readonly selStateForUser: Locator;
  private readonly selCityForUser: Locator;
  private readonly userPinCodeInput: Locator;
  private readonly btnAddUserSubmit: Locator;
  private readonly enterText: Locator;
  private readonly arrow: Locator;
  private readonly branchDropdown: Locator;
  private readonly userManagent: Locator;
  private readonly btnSendOtp: Locator;
  private readonly otpDigit: Locator;
  private readonly btnVerifyOtp: Locator;
  private readonly profile: Locator;

  constructor(page: Page) {
    super(page);
    this.btnUpdate = this.page.locator("xpath=//span[contains(.,'Edit')]");
    this.btnDelete = this.page.locator(
      "xpath=(//div[contains(.,'Delete')])[1]",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
    this.btnView = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[1]",
    );
    this.btnClose = this.page.locator(
      "xpath=//img[@src='../../../../../../assets/media/icons/cancel.svg']",
    );
    this.selPartner = this.page.locator(
      "xpath=//select[@formcontrolname='partnerId']",
    );
    this.partnerBranchUserNav = this.page.locator(
      "xpath=//span[normalize-space()='Partner Branch User']",
    );
    this.btnAddUser = this.page.locator(
      "xpath=//button[normalize-space()='Add Partner User']",
    );
    this.userFirstNameInput = this.page.locator(
      "xpath=//input[@placeholder='First Name']",
    );
    this.userLastNameInput = this.page.locator(
      "xpath=//input[@placeholder='Last Name']",
    );
    this.selPartnerForUser = this.page.locator(
      "xpath=//select[@formcontrolname='partnerId']",
    );
    this.selBranchForUser = this.page.locator(
      "xpath=//select[@formcontrolname='branchId']",
    );
    this.userEmailInput = this.page.locator(
      "xpath=//input[@placeholder='e.g abc@123.com']",
    );
    this.userMobileInput = this.page.locator(
      "xpath=//input[@placeholder='e.g 9023451234']",
    );
    this.selStateForUser = this.page.locator(
      "xpath=//select[@formcontrolname='stateId']",
    );
    this.selCityForUser = this.page.locator(
      "xpath=//select[@formcontrolname='cityId']",
    );
    this.userPinCodeInput = this.page.locator(
      "xpath=//input[@placeholder='Enter Pin Code']",
    );
    this.btnAddUserSubmit = this.page.locator(
      "xpath=//mat-dialog-container//button[normalize-space()='Add']",
    );
    this.enterText = this.page.locator(
      "xpath=//input[@placeholder='enter text here']",
    );
    this.arrow = this.page.locator(
      "xpath=//div[@class=' kt-aside__brand-tools d-none d-md-flex']",
    );
    this.branchDropdown = this.page.locator("xpath=//select[@id='branch']");
    this.userManagent = this.page.locator(
      "xpath=//span[normalize-space()='User Management']",
    );
    this.btnSendOtp = this.page.locator(
      "xpath=//button[normalize-space()='Send OTP']",
    );
    this.otpDigit = this.page.locator("xpath=//input[@formcontrolname='otp']");
    this.btnVerifyOtp = this.page.locator(
      "xpath=//button[normalize-space()='Verify']",
    );
    this.profile = this.page.locator(
      "xpath=//div[@class='kt-header__topbar-user']//img[@alt='Pic']",
    );
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  private async navigateToPartnerBranchUser(): Promise<void> {
    await this.page.waitForTimeout(7000);
    await this.profile.click();
    await this.branchDropdown.waitFor({ state: "visible" });
    await this.page.waitForTimeout(7000);

    await this.arrow.click();
    await this.page.waitForTimeout(1000);
    await this.userManagent.click();
    await this.page.waitForTimeout(1000);

    const pbuLink = this.partnerBranchUserNav;
    await pbuLink.waitFor({ state: "visible", timeout: 15_000 });
    await pbuLink.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  private async openPartnerBranchUserList(searchText: string): Promise<void> {
    await this.navigateToPartnerBranchUser();

    await this.enterText.fill(searchText);
    await this.page.waitForTimeout(2000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(1000);
  }

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

    const addUserBtn = this.btnAddUser;
    await addUserBtn.waitFor({ state: "visible", timeout: 30_000 });
    await addUserBtn.click();
    await this.page.waitForTimeout(1000);

    const stamp = TestDataFactory.stamp().replace("_", "");
    const firstName = `Test${stamp}`;
    const lastName = `User${stamp}`;
    const mobile = TestDataFactory.mobile();

    //await this.userFirstNameInput.fill(firstName);

    const d = getPartnerBranchUserData();
    const email = `testpartner${stamp}@${d.emailDomain}`;

    await this.userFirstNameInput.fill(firstName);
    await this.userLastNameInput.fill(lastName);

    const partnerSel = this.selPartnerForUser;
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
    const branchSel = this.selBranchForUser;
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

    await this.userEmailInput.fill(email);
    await this.userMobileInput.fill(mobile);

    await this.btnSendOtp.click();
    await this.page.waitForTimeout(2000);

    // Backdoor OTP convention confirmed elsewhere in this suite (config/env.ts's ADMIN_OTP
    // defaults to '1234' whenever no role-specific OTP is configured) — this dialog verifies
    // a freshly-generated test mobile number, so there's no real SMS to read.
    const otp = "1234";
    await this.otpDigit.fill(otp);

    await this.page.waitForTimeout(500);

    await this.btnVerifyOtp.click();
    await this.page.waitForTimeout(2000);

    await this.selStateForUser.selectOption({ label: d.state });
    await this.page.waitForTimeout(500);
    await this.selCityForUser.selectOption({ label: d.city });
    await this.page.waitForTimeout(500);

    await this.userPinCodeInput.fill(d.pincode);

    await this.btnAddUserSubmit.click();
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

    await this.userFirstNameInput.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await expect(this.userFirstNameInput).toHaveValue(expected.firstName);
    await expect(this.userLastNameInput).toHaveValue(expected.lastName);
    await expect(this.userEmailInput).toHaveValue(expected.email);
    await expect(this.userMobileInput).toHaveValue(expected.mobile);

    const selectedPartner = await this.selPartnerForUser
      .locator("option:checked")
      .textContent();
    console.log("Selected Partner:", selectedPartner);
    expect(selectedPartner?.trim()).toBe(expected.partner);

    const selectedBranch = await this.selBranchForUser
      .locator("option:checked")
      .textContent();
    console.log("Selected Branch:", selectedBranch);
    expect(selectedBranch?.trim()).toBe(expected.branch);

    console.log("Partner Branch User view details verified successfully");

    await this.btnClose.click();
  }

  async editPartnerBranchUser(
    searchText: string,
    newLastName: string,
  ): Promise<string> {
    //await this.openPartnerBranchUserList(searchText);

    const edit = await this.resolvePartnerBranchUserAction("Edit", searchText);
    await edit.click();
    await this.page.waitForTimeout(2000);

    const lastNameField = this.userLastNameInput;
    await lastNameField.waitFor({ state: "visible", timeout: 15000 });
    await lastNameField.fill("");
    await lastNameField.fill(newLastName);
    await this.page.waitForTimeout(1000);

    await this.btnUpdate.click();
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

    await this.btnYes.click();
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
