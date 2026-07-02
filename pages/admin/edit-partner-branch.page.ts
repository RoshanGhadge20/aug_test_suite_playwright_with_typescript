import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getLoginData } from "../../utils/data/admin-excel-data";

/**
 * Port of Java: PO34_EditPartnerBranch (locators) + Flow55_ValidateEditPartnerBranch (actions)
 * Also covers Flow54_ValidateAddPartnerBranch (commented out in TC05 — omitted).
 *
 * Methods ported (only active TC05 calls):
 *   - validateDeletePartnerBranch()  ← Flow55.validateDeletePartnerBranch()
 *   (validateEditPartnerBranch() and validateViewPartnerBranch() ported but not called by TC05)
 *
 * Cross-page locator notes:
 *   - profile, arrow, branchDropdown, userManagent re-declared locally.
 *   - partnerbranch locator re-declared from PO32.
 *
 * Omitted loginWith... logout calls:
 *   - All flows called loginWith* — OMITTED. Role = admin.
 */
export class EditPartnerBranchPage extends AdminBasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (from PO34_EditPartnerBranch) ────────────────────────────────

  private readonly enterText = () =>
    this.page.locator("xpath=//input[@placeholder='enter text here']");
  private readonly btnEdit = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(text(),'Edit')])[1]",
    );
  private readonly btnUpdate = () =>
    this.page.locator("xpath=//span[contains(.,'Update')]");
  private readonly btnDelete = () =>
    this.page.locator("xpath=(//div[contains(.,'Delete')])[1]");
  private readonly btnYes = () =>
    this.page.locator("xpath=//span[contains(.,'Yes')]");
  private readonly btnView = () =>
    this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[1]",
    );
  private readonly selPartner = () =>
    this.page.locator("xpath=//select[@formcontrolname='partnerId']");

  // ── Partner Branch User — Add User dialog locators ────────────────────────
  private readonly partnerBranchUserNav = () =>
    this.page.locator("xpath=//span[normalize-space()='Partner Branch User']");
  private readonly btnAddUser = () =>
    this.page.locator("xpath=//button[normalize-space()='Add User']");
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
    this.page.locator("xpath=//select[@id='branch']");
  private readonly userManagent = () =>
    this.page.locator("xpath=//span[normalize-space()='User Management']");
  private readonly partnerbranch = () =>
    this.page.locator("xpath= //span[normalize-space()='Partner Branch']");

  // ── Helpers ───────────────────────────────────────────────────────────────

  async navigateToPartnerBranch(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    await this.userManagent().click();

    const element1 = this.partnerbranch();
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(1000);
    await element1.click();
    await this.addNewBranch();
    await this.page.waitForTimeout(5000);
    await this.verifyBranchDetailsInView();
    await this.page.waitForTimeout(5000);
    await this.validateEditPartnerBranch();
    await this.page.waitForTimeout(5000);
    await this.validateDeletePartnerBranch();
  }
  async addNewBranch(): Promise<void> {
    // Click Add New Branch button
    await this.page.getByText("Add New Branch").click();

    // Branch Name
    await this.page
      .locator("//input[@placeholder='Enter Branch Name']")
      .fill("Regression Branch");

    const partnerDropdown = this.selPartner();

    await partnerDropdown.waitFor({ state: "visible" });

    // wait until option exists
    await this.page.waitForFunction(
      () => {
        const select = document.querySelector(
          "select[formcontrolname='partnerId']",
        ) as HTMLSelectElement;

        return Array.from(select.options).some(
          (option) => option.textContent?.trim() === "KHARATMOL SK",
        );
      },
      { timeout: 30000 },
    );

    const value = await partnerDropdown
      .locator("option")
      .filter({ hasText: "KHARATMOL SK" })
      .getAttribute("value");

    await partnerDropdown.selectOption(value!);
    console.log("Partner value:", value);
    await this.page.waitForTimeout(2000);
    // Vault Type dropdown
    await this.page
      .locator("//select[@formcontrolname='vaultType']")
      .selectOption({ label: "In House" });

    // State dropdown
    await this.page
      .locator("//select[@formcontrolname='stateId']")
      .selectOption({ label: "Maharashtra" });

    // City dropdown
    await this.page
      .locator("//select[@formcontrolname='cityId']")
      .selectOption({ label: "Mumbai" });

    // Pin Code
    await this.page
      .locator("//input[@placeholder='Enter Pin Code']")
      .fill("400001".trim());

    // Address (if visible)
    await this.page
      .locator("//textarea[@formcontrolname='address']")
      .fill("Mumbai Branch Address");
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("//textarea[@formcontrolname='toMail']")
      .fill("test@gmail.com");
    await this.page.waitForTimeout(2000);
    await this.page
      .locator("//textarea[@formcontrolname='ccMail']")
      .fill("ccmail@gmail.com");
    // Click Add button
    await this.page.waitForTimeout(2000);
    await this.page.getByRole("button", { name: "Add" }).click();
  }
  // ── Actions (from Flow55_ValidateEditPartnerBranch) ───────────────────────

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateEditPartnerBranch().
   * NOTE: Not called by TC05 but ported for completeness.
   */
  async validateEditPartnerBranch(): Promise<void> {
    await this.enterText().fill("Augmont");
    await this.page.waitForTimeout(1000);

    const ele = this.btnEdit();
    await ele.waitFor({ state: "visible", timeout: 15000 });
    await this.jsClick(ele);
    await this.page.waitForTimeout(2000);

    const ccmail = this.page.locator(
      "xpath=//textarea[@placeholder='Enter CC Mails']",
    );
    await this.page.waitForTimeout(2000);
    await ccmail.scrollIntoViewIfNeeded();

    await this.btnUpdate().click();
  }

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateDeletePartnerBranch().
   * Called by TC05 priority=1.
   */
  async validateDeletePartnerBranch(): Promise<void> {
    await this.page.waitForTimeout(2000);

    await this.expandSidebar();
    await this.page.waitForTimeout(2000);

    const deleteBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
    await deleteBtn.waitFor({ state: "visible", timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(1000);

    await this.btnYes().click();
  }

  /**
   * Port of Java Flow55_ValidateEditPartnerBranch.validateViewPartnerBranch().
   * NOTE: Not called by TC05 but ported for completeness.
   */
  // async validateViewPartnerBranch(): Promise<void> {
  //   await this.navigateToPartnerBranch();
  //   await this.btnView().click();
  // }
  async verifyBranchDetailsInView(): Promise<void> {
    // Click View for created branch
    await this.page
      .locator(
        "(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'View')])[1]",
      )
      .click();

    // Verify Branch Name
    await expect(
      this.page.locator("//input[@placeholder='Enter Branch Name']"),
    ).toHaveValue("Regression Branch");

    // Verify Partner Name
    const selectedPartner = await this.page
      .locator("//select[@formcontrolname='partnerId']")
      .locator("option:checked")
      .textContent();

    console.log("Selected Partner:", selectedPartner);

    expect(selectedPartner?.trim()).toBe("KHARATMOL SK");

    // Validate Vault Type

    const selectedVaultType = await this.page
      .locator("//select[@formcontrolname='vaultType']")
      .locator("option:checked")
      .textContent();

    console.log("Selected Vault Type:", selectedVaultType);

    expect(selectedVaultType?.trim()).toBe("In House");

    // Validate State
    const selectedState = await this.page
      .locator("//select[@formcontrolname='stateId']")
      .locator("option:checked")
      .textContent();

    console.log("Selected State:", selectedState);

    expect(selectedState?.trim()).toBe("Maharashtra");

    // Validate City
    const selectedCity = await this.page
      .locator("//select[@formcontrolname='cityId']")
      .locator("option:checked")
      .textContent();

    console.log("Selected City:", selectedCity);

    expect(selectedCity?.trim()).toBe("Mumbai");

    // Verify Pin Code
    await expect(
      this.page.locator("//input[@placeholder='Enter Pin Code']"),
    ).toHaveValue("400001");

    // Verify Address
    const address = await this.page
      .locator("//textarea[@formcontrolname='address']")
      .inputValue();

    console.log("Address:", address);

    expect(address.trim()).toBe("Mumbai Branch Address");
    await expect(
      this.page.locator("//textarea[@formcontrolname='toMail']"),
    ).toHaveValue("test@gmail.com");
    await expect(
      this.page.locator("//textarea[@formcontrolname='ccMail']"),
    ).toHaveValue("ccmail@gmail.com");
    console.log("Branch details verified successfully");
  }

  // ── Partner Branch User actions ───────────────────────────────────────────

  private async navigateToPartnerBranchUser(): Promise<void> {
    const data = getLoginData();
    await this.page.waitForTimeout(7000);
    await this.profile().click();

    await this.branchDropdown().waitFor({ state: "visible" });
    await this.branchDropdown().selectOption({ label: data.branchName });
    await this.page.waitForTimeout(7000);

    await this.expandSidebar();
    await this.page.waitForTimeout(1000);
    await this.userManagent().click();
    await this.page.waitForTimeout(1000);

    const pbuLink = this.partnerBranchUserNav();
    await pbuLink.waitFor({ state: "visible", timeout: 15_000 });
    await pbuLink.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  /**
   * Opens the Add User dialog on the Partner Branch User page, fills all
   * required fields, submits, and returns the entered first/last name for
   * spec assertions.
   */
  async validateAddPartnerBranchUser(): Promise<{
    firstName: string;
    lastName: string;
  }> {
    await this.navigateToPartnerBranchUser();

    await this.page.waitForLoadState("networkidle");

    const addUserBtn = this.btnAddUser();
    await addUserBtn.waitFor({ state: "visible", timeout: 30000 });
    await addUserBtn.click();

    const firstName = "Test";
    const lastName = "PartnerUser";
    await this.userFirstNameInput().fill(firstName);
    await this.userLastNameInput().fill(lastName);

    // Select Partner — wait until options are loaded then pick the first real one
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

    // Select Branch — may load dynamically after partner selection
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

    await this.userEmailInput().fill("testpartneruser@augmont.com");
    await this.userMobileInput().fill("9876543210");

    const data = getLoginData();
    await this.selStateForUser().selectOption({ label: data.state });
    await this.page.waitForTimeout(500);
    await this.selCityForUser().selectOption({ label: data.city });
    await this.page.waitForTimeout(500);

    await this.userPinCodeInput().fill("400001");

    await this.btnAddUserSubmit().click();
    await this.page.waitForTimeout(2000);

    console.log(
      `[validateAddPartnerBranchUser] Added user: "${firstName} ${lastName}"`,
    );
    return { firstName, lastName };
  }
}
