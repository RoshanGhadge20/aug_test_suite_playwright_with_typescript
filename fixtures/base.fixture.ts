import { test as base } from '@playwright/test';
import { CustomerLoginPage } from '../pages/customer/login.page';
import { AddNewBankPage } from '../pages/customer/add-new-bank.page';
import { BuyMetalPage } from '../pages/customer/buy-metal.page';
import { BuySummaryPage } from '../pages/customer/buy-summary.page';
import { DashBoardPage } from '../pages/customer/dashboard.page';
import { MyOrderVerificationPage } from '../pages/customer/my-order-verification.page';
import { PaymentPage } from '../pages/customer/payment.page';
import { WithdrawalPage } from '../pages/customer/withdrawal.page';
import { AddNewBankWithdrawalPage } from '../pages/customer/add-new-bank-withdrawal.page';
import { ProductMenuPage } from '../pages/customer/product-menu.page';
import { ShopPage } from '../pages/customer/shop.page';
import { ShopCartPage } from '../pages/customer/shop-cart.page';
import { ShopCheckoutPage } from '../pages/customer/shop-checkout.page';

type PageObjectFixtures = {
  customerLogin: CustomerLoginPage;
  addNewBankPage: AddNewBankPage;
  productMenuPage: ProductMenuPage;
  shopPage: ShopPage;
  shopCartPage: ShopCartPage;
  shopCheckoutPage: ShopCheckoutPage;
  buyMetalPage: BuyMetalPage;
  buySummaryPage: BuySummaryPage;
  dashboardPage: DashBoardPage;
  myOrderVerificationPage: MyOrderVerificationPage;
  paymentPage: PaymentPage;
  withdrawalPage: WithdrawalPage;
  addNewBankWithdrawalPage: AddNewBankWithdrawalPage;
  // customerLogin: CustomerLoginPage;
  // businessLogin: BusinessLoginPage;
  // newAdminLogin: NewAdminLoginPage;
};

export const test = base.extend<PageObjectFixtures>({
  customerLogin: async ({ page }, use) => { await use(new CustomerLoginPage(page)); },
  addNewBankPage: async ({ page }, use) => { await use(new AddNewBankPage(page)); },
  productMenuPage: async ({ page }, use) => { await use(new ProductMenuPage(page)); },
  shopPage: async ({ page }, use) => { await use(new ShopPage(page)); },
  shopCartPage: async ({ page }, use) => { await use(new ShopCartPage(page)); },
  shopCheckoutPage: async ({ page }, use) => { await use(new ShopCheckoutPage(page)); },
  buyMetalPage: async ({ page }, use) => { await use(new BuyMetalPage(page)); },
  buySummaryPage: async ({ page }, use) => { await use(new BuySummaryPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashBoardPage(page)); },
  myOrderVerificationPage: async ({ page }, use) => { await use(new MyOrderVerificationPage(page)); },
  paymentPage: async ({ page }, use) => { await use(new PaymentPage(page)); },
  withdrawalPage: async ({ page }, use) => { await use(new WithdrawalPage(page)); },
  addNewBankWithdrawalPage: async ({ page }, use) => { await use(new AddNewBankWithdrawalPage(page)); },
  // customerLogin: async ({ page }, use) => { await use(new CustomerLoginPage(page)); },
  // businessLogin: async ({ page }, use) => { await use(new BusinessLoginPage(page)); },
  // newAdminLogin: async ({ page }, use) => { await use(new NewAdminLoginPage(page)); },
});

export { expect } from '@playwright/test';
