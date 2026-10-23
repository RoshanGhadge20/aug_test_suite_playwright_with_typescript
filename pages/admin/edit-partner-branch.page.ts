import { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import { getPartnerBranchUserData } from "../../utils/data/admin-excel-data";
import { TestDataFactory } from "../../utils/data/test-data.factory";

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
    this.page.locator("xpath=//button[normalize-space()='Update']");
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

  private async openPartnerBranchList(): Promise<void> {
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

    const element1 = this.partnerbranch();
    await element1.evaluate((el: any) =>
      el.scrollIntoView({ block: "center" }),
    );
    await this.page.waitForTimeout(1000);
    await element1.click();
    await this.page.waitForTimeout(5000);
  }

  async navigateToPartnerBranch(): Promise<void> {
    await this.openPartnerBranchList();
    await this.addNewBranch();
    await this.page.waitForTimeout(5000);
    await this.verifyBranchDetailsInView();
    await this.page.waitForTimeout(5000);
    await this.validateEditPartnerBranch();
    await this.page.waitForTimeout(5000);
    await this.crossCheckOldPartnerBranch();
    await this.page.waitForTimeout(5000);
    await this.updateOldPartnerBranch();
    await this.page.waitForTimeout(5000);
   // await this.validateDeletePartnerBranch();
  }

  async crossCheckOldPartnerBranch(
    searchText: string = "Regression Branch",
  ): Promise<string> {
    // await this.openPartnerBranchList();

    await this.enterText().waitFor({ state: "visible", timeout: 15000 });
    await this.enterText().fill(searchText);
    await this.page.waitForTimeout(3000);

    const firstResultCell = this.page.locator(
      "xpath=(//mat-cell[@role='gridcell'])[2]",
    );
    const actualBranch = (await firstResultCell.innerText()).trim();
    console.log(`[crossCheckOldPartnerBranch] Found branch: "${actualBranch}"`);
    return actualBranch;
  }

  /**
   * Searches for an existing Partner Branch, opens Edit, and updates its address.
   * See crossCheckOldPartnerBranch() for the default searchText rationale.
   */
  async updateOldPartnerBranch(
    newAddress: string = "Chakala branch",
    searchText: string = "Regression Branch",
  ): Promise<string> {
    //await this.openPartnerBranchList();

    await this.enterText().waitFor({ state: "visible", timeout: 15000 });
    await this.enterText().fill(searchText);
    await this.page.waitForTimeout(3000);

    // Actions column (View | Edit | Delete) is clipped by the table wrapper's overflow —
    // same fix validateEditPartnerBranch() uses above.
    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(1000);

    const editBtn = this.btnEdit();
    await editBtn.waitFor({ state: "visible", timeout: 15000 });
    await editBtn.click();
    await this.page.waitForTimeout(2000);

    const addressField = this.page.locator(
      'xpath=//textarea[@formcontrolname="address"]',
    );
    await addressField.click();
    await addressField.fill("");
    await this.page.waitForTimeout(500);
    await addressField.fill(newAddress);
    await this.btnUpdate().click();
    await this.page.waitForTimeout(1000);

    return newAddress;
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

  async validateEditPartnerBranch(): Promise<void> {
    await this.enterText().fill("Regression Branch");
    await this.page.waitForTimeout(10000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(1000);

    const ele = this.btnEdit();
    await ele.waitFor({ state: "visible", timeout: 15000 });
    await ele.click();
    await this.page.waitForTimeout(2000);
    const addressField = this.page.locator(
      'xpath=//textarea[@formcontrolname="address"]',
    );
    await addressField.click();
    await addressField.fill(""); // clears existing value
    await this.page.waitForTimeout(2000);
    await addressField.fill("Chakala branch");
    await this.btnUpdate().click();
  }

  async validateDeletePartnerBranch(): Promise<void> {
    await this.page.waitForTimeout(2000);

    await this.arrow().click();
    await this.page.waitForTimeout(2000);

    const deleteBtn = this.page.locator(
      "xpath=(//div[contains(@class,'kt-pointer') and contains(normalize-space(.),'Delete')])[1]",
    );
    await deleteBtn.waitFor({ state: "visible", timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(1000);

    await this.btnYes().click();
  }

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
    await this.btnClose().click();
  }

  // ── Partner Branch User actions ───────────────────────────────────────────
}
