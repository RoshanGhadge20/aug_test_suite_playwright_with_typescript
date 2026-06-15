import { test, expect } from '../../../fixtures/base.fixture';
import { getTargetEnv } from '../../../config/environments';
import { panelCreds } from '../../../config/urls';
import { createWalletGiftCoupon } from '../../../utils/api/create-wallet-gift-coupon';
import { getShopTc003Dataset } from '../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails, ShopPlacedOrders } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';
import {
  clearCustomerBrowserStorage,
  persistCustomerStorageState,
  resolveAltCustomerMobile,
  resolveAltCustomerOtp,
} from '../helpers/customer-alt-user.helpers';

const TC017_COUPON_AMOUNT = 100;

test.describe('TC_SHOP_017 @customer-flows', () => {
  test.describe('TC_SHOP_017 alt customer session', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC_SHOP_017 - Mixed EMI + Buy Now: coupon ₹100 + partial User Savings, Razorpay remainder > 0', async ({
      page,
      customerLogin,
      shopPage,
      shopCartPage,
      shopCheckoutPage,
      shopEmiPage,
      paymentPage,
      myOrderVerificationPage,
    }) => {
      test.setTimeout(480_000);

      const TC017 = (n: number): string => `TC017_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC017(n)}] ${title}`);
      };

      const { emiProductName, buyNowProductName } = getShopTc003Dataset();
      const productNames = [emiProductName, buyNowProductName];

      let couponCode = '';
      let combinedGrandTotal = 0;
      let emiInitialPayment = 0;
      let payableAmount = 0;
      let savedBillingAddress: ShopBillingAddressDetails;
      let placedOrders: ShopPlacedOrders;

      const productDetailsByName: Record<string, ShopProductDetails> = {};
      const productLinePrices: Record<string, number> = {};
      const cartNetWeightByName: Record<string, string> = {};
      const orderIdByProduct: Record<string, string> = {};
      const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};

      const altCustomerMobile = resolveAltCustomerMobile();
      const altCustomerOtp = resolveAltCustomerOtp();

      await test.step('TC017_0 | Login alt customer', async () => {
        logSub(0, 'Fresh login as alt customer');
        console.log(
          `[${TC017(0)}] Logging in as ${altCustomerMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
        );
        await customerLogin.login(altCustomerMobile, altCustomerOtp);
        await page.goto('/dashboard');
      });

      await test.step(
        'TC017_1 | Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay',
        async () => {
          logSub(1, 'Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay');
          await shopPage.prepareFilteredListing(shopCartPage);
          await shopPage.verifyProductsInCatalog(productNames);

          productDetailsByName[emiProductName] =
            await shopPage.captureEmiProductForMixedCart(emiProductName);
          await shopPage.clickBuyWithEmi();

          const emiResult = await shopEmiPage.addProductViaEmiPlan('3 Months');
          productLinePrices[emiProductName] = emiResult.emiLinePrice;
          emiInitialPayment = emiResult.emiInitialPayment;

          await shopPage.openListingWithFilters();
          productDetailsByName[buyNowProductName] =
            await shopPage.captureBuyNowProductForMixedCart(buyNowProductName);
          await shopPage.clickBuyNow();

          await shopCartPage.removeDuplicateCartProducts();
          await shopCartPage.expectCartHasProducts(productNames);
          const cartSnapshot = await shopCartPage.validateMixedCart({
            productNames,
            emiProductName,
            buyNowProductName,
            productDetailsByName,
            emiExpectedNetPayable: shopEmiPage.expectedNetPayableAmount(emiResult.emi),
            emiInitialPayment: emiResult.emiInitialPayment,
          });

          Object.assign(productLinePrices, cartSnapshot.productLinePrices);
          Object.assign(cartNetWeightByName, cartSnapshot.cartNetWeightByName);
          combinedGrandTotal = cartSnapshot.combinedGrandTotal;

          const availableSavings = await shopCartPage.requireShopUserSavingsOnCart('TC_SHOP_017');
          shopCartPage.assertTc017MixedCouponPartialSavingsPreconditions(
            combinedGrandTotal,
            availableSavings,
            TC017_COUPON_AMOUNT,
          );

          const coupon = await createWalletGiftCoupon({ amount: TC017_COUPON_AMOUNT });
          couponCode = coupon.code;
          console.log('[coupon]', couponCode, '| amount', coupon.amount);
          expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);
          expect(coupon.amount).toBe(TC017_COUPON_AMOUNT);

          await shopCartPage.applyMixedCartCouponAndSavings(couponCode);

          await shopCartPage.clickProceedToPay();
          await shopCheckoutPage.validateMixedPartialSavingsCouponCheckout({
            combinedGrandTotal,
            couponAmount: TC017_COUPON_AMOUNT,
            emiPlanDetails: emiResult.emi,
            emiInitialPayment: emiResult.emiInitialPayment,
            expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiResult.emi),
          });
          savedBillingAddress = await shopCheckoutPage.getBillingAddress();
          await shopCheckoutPage.confirmBillingAndDelivery();
          await shopCheckoutPage.validateCheckoutOtp(altCustomerMobile, altCustomerOtp);
          payableAmount = await shopCheckoutPage.validateMixedPartialSavingsCouponOrderSummary({
            productNames,
            productLinePrices,
            emiInitialPayment: emiResult.emiInitialPayment,
            combinedGrandTotal,
            couponAmount: TC017_COUPON_AMOUNT,
          });
          expect(payableAmount).toBeGreaterThan(0);
          await shopCheckoutPage.placeOrderViaNetbanking();
          await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });
        },
      );

      await test.step('TC017_2 | Confirm multi-product orders placed', async () => {
        logSub(2, 'Confirm multi-product orders placed');
        placedOrders = await shopCheckoutPage.confirmMultiProductOrdersPlaced(productNames.length);
      });

      await test.step('TC017_3 | My Orders — validate mixed orders on list', async () => {
        logSub(3, 'My Orders — validate mixed orders on list');
        const listResult = await myOrderVerificationPage.validateMixedOrdersOnList({
          productNames,
          emiProductName,
          productLinePrices,
          placedOrders,
          checkoutPage: shopCheckoutPage,
        });
        Object.assign(orderIdByProduct, listResult.orderIdByProduct);
        Object.assign(shopOrdersByName, listResult.shopOrdersByName);
      });

      await test.step('TC017_4 | My Orders — validate mixed order details', async () => {
        logSub(4, 'My Orders — validate mixed order details');
        await myOrderVerificationPage.validateMixedOrderDetails({
          productNames,
          emiProductName,
          productDetailsByName,
          productLinePrices,
          cartNetWeightByName,
          savedBillingAddress,
          shopOrdersByName,
          orderIdByProduct,
        });
      });

      await test.step('TC017_5 | My Orders — validate mixed invoices', async () => {
        logSub(5, 'My Orders — validate mixed invoices');
        await myOrderVerificationPage.validateMixedInvoices({
          productNames,
          emiProductName,
          productDetailsByName,
          productLinePrices,
          orderIdByProduct,
          placedOrders,
          combinedGrandTotal,
          emiInitialPayment,
          checkoutPage: shopCheckoutPage,
          invoicePassword: altCustomerMobile.replace(/\D/g, '').slice(-4),
        });
      });

      await test.step('TC017_6 | Restore default customer session', async () => {
        logSub(6, 'Persist default customer storage state for following tests');
        const { mobile: defaultMobile, otp } = panelCreds('customer', getTargetEnv());
        const altMobile = resolveAltCustomerMobile();

        if (defaultMobile !== altMobile) {
          console.log(
            `[${TC017(6)}] Switching from alt ${altMobile} to default ${defaultMobile}.`,
          );
          await clearCustomerBrowserStorage(page);
          await customerLogin.login(defaultMobile, otp);
          await page.goto('/dashboard');
        } else {
          console.log(
            `[${TC017(6)}] Alt user matches default (${defaultMobile}); skipping re-login.`,
          );
        }
        await persistCustomerStorageState(page);
      });
    });
  });
});
