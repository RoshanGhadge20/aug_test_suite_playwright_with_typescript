import { Locator, Page } from "@playwright/test";
import { AdminBasePage } from "./admin-base.page";
import fs from "fs";

export class ZahReviewPage extends AdminBasePage {
  private readonly btnAdvanceApproval: Locator;

  private readonly enterReason: Locator;

  private readonly btnAdd: Locator;

  private readonly btnYes: Locator;

  constructor(page: Page) {
    super(page);
    this.btnAdvanceApproval = this.page.locator(
      "xpath=//span[normalize-space()='Advance Approval']",
    );
    this.enterReason = this.page.locator(
      "xpath=//textarea[@placeholder='Enter Reason']",
    );
    this.btnAdd = this.page.locator(
      "xpath=//button[@class='submit mat-raised-button mat-button-base']",
    );
    this.btnYes = this.page.locator("xpath=//span[contains(.,'Yes')]");
  }
  private readonly rowActionButton1 = (customerId: string) =>
    this.page
      .getByRole("row", { name: new RegExp(customerId) })
      .getByRole("button")
      .first();
  getCurrentCustomerId(): string {
    const customerData = JSON.parse(
      fs.readFileSync("./testdata/admin/documents/customerData.json", "utf8"),
    );
    return customerData.customerId.trim();
  }

  async validateZahReview(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.expandSidebar();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    await this.page
      .locator("xpath=//span[normalize-space()='Loan Management']")
      .click();
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole("link", { name: "Applied BT Loan", exact: true })
      .click();
    await this.waitForLoaderToDisappear();
    await this.page.waitForTimeout(5000);
    const currentCustomerId = this.getCurrentCustomerId();
    await this.page.waitForTimeout(2000);
    await this.jsClick(this.rowActionButton1(currentCustomerId));
    await this.page.getByRole("tab", { name: "Approvals" }).click();
    await this.page.waitForTimeout(2000);
    const element = this.page.locator(
      "xpath=//span[normalize-space()='Funds and Approvals']",
    );
    await element.evaluate((el: any) => el.scrollIntoView({ block: "center" }));
    await element.click();

    await this.btnAdvanceApproval.click();
    await this.page.waitForTimeout(2000);

    const scrollDiv = this.page.locator(
      "xpath=//div[@class='mat-table__wrapper']",
    );
    await scrollDiv.click();
    await scrollDiv.evaluate((el: any) => {
      el.scrollLeft = el.scrollWidth;
    });
    await this.page.waitForTimeout(3000);

    await scrollDiv.click();
    await this.page.keyboard.press("Home");
    await this.page.waitForTimeout(3000);
    const approvalRow = this.page.getByRole("row", {
      name: new RegExp(currentCustomerId),
    });
    await approvalRow.getByRole("combobox").selectOption({ label: "Approved" });
    await this.page.waitForTimeout(2000);

    const submitEl = approvalRow.getByRole("button", { name: "Submit" });
    await this.page.waitForTimeout(2000);
    await submitEl.evaluate((el: any) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await this.page.waitForTimeout(2000);
    await submitEl.click();

    await this.enterReason.fill("Approved");
    await this.btnAdd.click();
    await this.btnYes.click();
  }
}
