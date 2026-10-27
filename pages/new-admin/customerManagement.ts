import { Page } from "@playwright/test";
import { CustomerManagementPage } from "../admin/customer-management.page";

export class Flow_CustomerManagement {
  private cm: CustomerManagementPage;

  constructor(
    page: Page,
    _data?: {
      branchName?: string;
      leadName?: string;
      firstName?: string;
      lastName?: string;
      stateName?: string;
      cityName?: string;
    },
  ) {
    this.cm = new CustomerManagementPage(page);
  }

  async clickOnCustomerManagementButton(): Promise<void> {
    await this.cm.clickOnCustomerManagementButton();
  }

  async selectLead(): Promise<void> {
    await this.cm.selectLead();
  }

  async searchInput(): Promise<void> {
    await this.cm.SearchInput();
  }

  async parameterSelection(parameter: string): Promise<void> {
    await this.cm.parameterSelection(parameter);
  }

  async selectAsGoldLoan(): Promise<void> {
    await this.cm.selectAsGoldLoan();
  }
}
