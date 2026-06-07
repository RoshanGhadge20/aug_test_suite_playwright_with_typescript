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
import { ShopEmiPage } from '../pages/customer/shop-emi.page';
import { EmiOrderDetailValidationPage } from '../pages/customer/emi-order-detail-validation.page';
import { ShopEmiForeclosePage } from '../pages/customer/shop-emi-foreclose.page';
import { CancellationSummaryPage } from '../pages/customer/cancellation-summary.page';
import { ShopCancelBookingPage } from '../pages/customer/shop-cancel-booking.page';
import {
  getWorkerShopEmiPurchaseChainState,
  type ShopEmiPurchaseChainState,
} from '../utils/test/shop-emi-purchase-chain';

type PageObjectFixtures = {
  customerLogin: CustomerLoginPage;
  addNewBankPage: AddNewBankPage;
  productMenuPage: ProductMenuPage;
  shopPage: ShopPage;
  shopCartPage: ShopCartPage;
  shopCheckoutPage: ShopCheckoutPage;
  shopEmiPage: ShopEmiPage;
  emiOrderDetailValidationPage: EmiOrderDetailValidationPage;
  shopEmiForeclosePage: ShopEmiForeclosePage;
  cancellationSummaryPage: CancellationSummaryPage;
  shopCancelBookingPage: ShopCancelBookingPage;
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

type CustomerShopFixtures = {
  /** TC_SHOP_010 purchase → TC_SHOP_011 foreclose (3-month EMI). */
  shopEmiPurchaseChain009: ShopEmiPurchaseChainState;
  /** TC_SHOP_007 purchase → TC_SHOP_008 → TC_SHOP_009 (9-month EMI chain). */
  shopEmiPurchaseChain007: ShopEmiPurchaseChainState;
};

export const test = base.extend<PageObjectFixtures & CustomerShopFixtures>({
  customerLogin: async ({ page }, use) => { await use(new CustomerLoginPage(page)); },
  addNewBankPage: async ({ page }, use) => { await use(new AddNewBankPage(page)); },
  productMenuPage: async ({ page }, use) => { await use(new ProductMenuPage(page)); },
  shopPage: async ({ page }, use) => { await use(new ShopPage(page)); },
  shopCartPage: async ({ page }, use) => { await use(new ShopCartPage(page)); },
  shopCheckoutPage: async ({ page }, use) => { await use(new ShopCheckoutPage(page)); },
  shopEmiPage: async ({ page }, use) => { await use(new ShopEmiPage(page)); },
  emiOrderDetailValidationPage: async ({ page }, use) => {
    await use(new EmiOrderDetailValidationPage(page));
  },
  shopEmiForeclosePage: async ({ page }, use) => {
    await use(new ShopEmiForeclosePage(page));
  },
  cancellationSummaryPage: async ({ page }, use) => {
    await use(new CancellationSummaryPage(page));
  },
  shopCancelBookingPage: async ({ page }, use) => {
    await use(new ShopCancelBookingPage(page));
  },
  buyMetalPage: async ({ page }, use) => { await use(new BuyMetalPage(page)); },
  buySummaryPage: async ({ page }, use) => { await use(new BuySummaryPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashBoardPage(page)); },
  myOrderVerificationPage: async ({ page }, use) => { await use(new MyOrderVerificationPage(page)); },
  paymentPage: async ({ page }, use) => { await use(new PaymentPage(page)); },
  withdrawalPage: async ({ page }, use) => { await use(new WithdrawalPage(page)); },
  addNewBankWithdrawalPage: async ({ page }, use) => { await use(new AddNewBankWithdrawalPage(page)); },
  shopEmiPurchaseChain009: async ({}, use) => {
    await use(getWorkerShopEmiPurchaseChainState('009'));
  },
  shopEmiPurchaseChain007: async ({}, use) => {
    await use(getWorkerShopEmiPurchaseChainState('007'));
  },
});

export { expect } from '@playwright/test';
