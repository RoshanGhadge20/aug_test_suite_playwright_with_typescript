import { test as base } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin/login.page';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { BusinessLoginPage } from '../pages/business/login.page';
import { NewAdminLoginPage } from '../pages/new-admin/login.page';

type PageObjectFixtures = {
  adminLogin: AdminLoginPage;
  customerLogin: CustomerLoginPage;
  businessLogin: BusinessLoginPage;
  newAdminLogin: NewAdminLoginPage;
};

export const test = base.extend<PageObjectFixtures>({
  adminLogin: async ({ page }, use) => { await use(new AdminLoginPage(page)); },
  customerLogin: async ({ page }, use) => { await use(new CustomerLoginPage(page)); },
  businessLogin: async ({ page }, use) => { await use(new BusinessLoginPage(page)); },
  newAdminLogin: async ({ page }, use) => { await use(new NewAdminLoginPage(page)); },
});

export { expect } from '@playwright/test';
