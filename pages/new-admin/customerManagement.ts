import { Page } from '@playwright/test';
import { CustomerManagementPage } from '../admin/customer-management.page';

/**
 * Thin flow over the admin Customer Management page object.
 *
 * This file used to import a non-existent '../pages/customerManagement.page' and call `loc_*`
 * locator methods that no page class defines, so it did not compile. The real implementation of
 * every step lives in pages/admin/customer-management.page.ts (it reads the lead / names / state /
 * city from the admin Excel data via getLoginData()), so this class just delegates to it and keeps
 * the original method names. The constructor still accepts the old `data` argument for
 * compatibility, but the values are not used.
 */
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

  /** Opens Customer Management → All Customers → Add Customer, then selects the lead and fills the form. */
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
