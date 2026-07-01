import { test, expect } from '../../../fixtures/base.fixture';
import { getTargetEnv } from '../../../config/environments';
import { createWalletGiftCoupon } from '../../../utils/api/create-wallet-gift-coupon';
import { getShopTc003Dataset, getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopEmiPage } from '../../../pages/customer/shop-emi.page';
import type { ShopBillingAddressDetails, ShopPlacedOrders } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';
import {
  persistCustomerStorageState,
  resolveAltCustomerMobile,
  resolveAltCustomerOtp,
} from '../helpers/customer-alt-user.helpers';

const TC017_COUPON_AMOUNT = 100;
const TC017_GOLD_SETUP_AMOUNT = '500';

test.describe('TC_SHOP_017 @customer-flows', () => {
  test.describe('TC_SHOP_017 alt customer session', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC_SHOP_017|AT-1659 - Mixed EMI + Buy Now: coupon ₹100 + partial User Savings, Razorpay remainder > 0', async ({
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

      const TC017 = (n: number): string => `TC017_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC017(n)}] ${title}`);
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

      const altCustomerMobile = resolveAltCustomerMobile();
      const altCustomerOtp = resolveAltCustomerOtp();
      const { netbankingBankName } = getBuyMetalDataset();

      await test.step('TC017_0 | Login alt customer', async () => {
        logSub(0, 'Fresh login as alt customer');
        console.log(
          `[${TC017(0)}] Logging in as ${altCustomerMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
        );
        await customerLogin.login(altCustomerMobile, altCustomerOtp);
        let withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(20_000);
        if (!withdrawVisible) {
          console.log(
            `[${TC017(0)}] Withdraw not visible — buying ₹${TC017_GOLD_SETUP_AMOUNT} gold via Buy Now.`,
          );
          await buyMetalPage.placeOneTimeOrder('gold', TC017_GOLD_SETUP_AMOUNT);
          await buySummaryPage.clickPayNowButton();
          await paymentPage.completeNetbankingBuyNowPayment(
            altCustomerMobile,
            Number(TC017_GOLD_SETUP_AMOUNT),
            netbankingBankName,
          );
          withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(25_000);
        }
        expect(
          withdrawVisible,
          'Withdraw button should be visible on dashboard after netbanking setup in TC017_0',
        ).toBe(true);
      });

      await test.step(
        'TC017_1 | Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay',
        async () => {
          logSub(1, 'Mixed EMI + Buy Now — cart, coupon, savings, checkout, Razorpay pay');
          const selected = await shopPage.addMixedEmiBuyNowForPartialSavingsWithCoupon(
            shopCartPage,
            shopEmiPage,
            TC017_COUPON_AMOUNT,
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
        myOrderVerificationPage.saveShopEmiPurchaseChainOrder(
          shopEmiPurchaseChain017,
          listResult.orderIdByProduct[emiProductName] ?? '',
          emiProductName,
        );
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

      await test.step('TC017_6 | Persist alt session for TC018', async () => {
        logSub(6, 'Persisting alt customer storage state for TC018');
        await persistCustomerStorageState(page);
      });
    });
  });
});
