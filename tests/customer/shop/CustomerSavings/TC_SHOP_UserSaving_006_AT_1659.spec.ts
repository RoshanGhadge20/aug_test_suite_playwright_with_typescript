import { test, expect } from '../../../../fixtures/base.fixture';
import { createWalletGiftCoupon } from '../../../../utils/api/create-wallet-gift-coupon';
import { getShopTc003Dataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopEmiPage } from '../../../../pages/customer/shop-emi.page';
import type { ShopBillingAddressDetails, ShopPlacedOrders } from '../../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';
import {
  loginAltCustomerWithGoldSetup,
  persistCustomerStorageState,
} from '../../helpers/customer-alt-user.helpers';

const TC006_COUPON_AMOUNT = 100;
const TC006_GOLD_SETUP_AMOUNT = '500';

test.describe('TC_SHOP_UserSaving_006 @customer-flows', () => {
  test.describe('TC_SHOP_UserSaving_006 alt customer session', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC_SHOP_UserSaving_006|AT-1659 - Mixed EMI + Buy Now: coupon ₹100 + partial User Savings, Razorpay remainder > 0', async ({
      page,
      customerLogin,
      dashboardPage,
      buyMetalPage,
      buySummaryPage,
      shopPage,
      shopCartPage,
      shopCheckoutPage,
      shopEmiPage,
      paymentPage,
      myOrderVerificationPage,
      shopEmiPurchaseChain017,
    }) => {
      test.setTimeout(480_000);

      const TC006 = (n: number): string => `TC006_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC006(n)}] ${title}`);
      };

      const { emiProductName: preferredEmiProductName, buyNowProductName: preferredBuyNowProductName } =
        getShopTc003Dataset();

      let emiProductName = preferredEmiProductName;
      let buyNowProductName = preferredBuyNowProductName;
      let productNames = [emiProductName, buyNowProductName];

      let couponCode = '';
      let combinedGrandTotal = 0;
      let emiInitialPayment = 0;
      let emiResult: Awaited<ReturnType<ShopEmiPage['addProductViaEmiPlan']>>;
      let payableAmount = 0;
      let savedBillingAddress: ShopBillingAddressDetails;
      let placedOrders: ShopPlacedOrders;

      const productDetailsByName: Record<string, ShopProductDetails> = {};
      const productLinePrices: Record<string, number> = {};
      const cartNetWeightByName: Record<string, string> = {};
      const orderIdByProduct: Record<string, string> = {};
      const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};
      let availableSavings = 0;

      let altCustomerMobile = '';
      let altCustomerOtp = '';

      await test.step('TC006_0 | Login alt customer', async () => {
        logSub(0, 'Fresh login as alt customer');
        ({ altCustomerMobile, altCustomerOtp } = await loginAltCustomerWithGoldSetup(
          { customerLogin, dashboardPage, buyMetalPage, buySummaryPage, paymentPage },
          { goldSetupAmount: TC006_GOLD_SETUP_AMOUNT, logLabel: TC006(0) },
        ));
      });

      await test.step(
        'TC006_1 | Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay',
        async () => {
          logSub(1, 'Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay');
          const selected = await shopPage.addMixedEmiBuyNowForPartialSavingsWithCoupon(
            shopCartPage,
            shopEmiPage,
            TC006_COUPON_AMOUNT,
            {
              preferredEmiProductName,
              preferredBuyNowProductName,
              emiPlanTenure: '3 Months',
            },
          );
          emiProductName = selected.emiProductName;
          buyNowProductName = selected.buyNowProductName;
          productNames = selected.productNames;
          Object.assign(productDetailsByName, selected.productDetailsByName);
          emiResult = selected.emiResult;
          emiInitialPayment = selected.emiResult.emiInitialPayment;
          Object.assign(productLinePrices, selected.cartSnapshot.productLinePrices);
          Object.assign(cartNetWeightByName, selected.cartSnapshot.cartNetWeightByName);
          combinedGrandTotal = selected.combinedGrandTotal;
          availableSavings = selected.availableSavings;
          shopCartPage.assertTc017MixedCouponPartialSavingsPreconditions(
            selected.combinedGrandTotal,
            availableSavings,
            TC006_COUPON_AMOUNT,
          );

          const coupon = await createWalletGiftCoupon({ amount: TC006_COUPON_AMOUNT });
          couponCode = coupon.code;
          console.log('[coupon]', couponCode, '| amount', coupon.amount);
          expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);
          expect(coupon.amount).toBe(TC006_COUPON_AMOUNT);

          await shopCartPage.applyMixedCartCouponAndSavings(couponCode);

          await shopCartPage.clickProceedToPay();
          await shopCheckoutPage.validateMixedPartialSavingsCouponCheckout({
            combinedGrandTotal,
            couponAmount: TC006_COUPON_AMOUNT,
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
            couponAmount: TC006_COUPON_AMOUNT,
          });
          expect(payableAmount).toBeGreaterThan(0);
          await shopCheckoutPage.placeOrderViaNetbanking();
          await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });
        },
      );

      await test.step('TC006_2 | Confirm multi-product orders placed', async () => {
        logSub(2, 'Confirm multi-product orders placed');
        placedOrders = await shopCheckoutPage.confirmMultiProductOrdersPlaced(productNames.length);
      });

      await test.step('TC006_3 | My Orders — validate mixed orders on list', async () => {
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
        myOrderVerificationPage.saveShopEmiPurchaseChainOrder(
          shopEmiPurchaseChain017,
          listResult.orderIdByProduct[emiProductName] ?? '',
          emiProductName,
        );
      });

      await test.step('TC006_4 | My Orders — validate mixed order details', async () => {
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

      await test.step('TC006_5 | My Orders — validate mixed invoices', async () => {
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

      await test.step('TC006_6 | Persist alt session for TC018', async () => {
        logSub(6, 'Persisting alt customer storage state for TC018');
        await persistCustomerStorageState(page);
      });
    });
  });
});
