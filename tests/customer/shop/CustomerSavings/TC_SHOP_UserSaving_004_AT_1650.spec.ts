import { test, expect } from '../../../../fixtures/base.fixture';
import { ShopEmiPage } from '../../../../pages/customer/shop-emi.page';
import { createWalletGiftCoupon } from '../../../../utils/api/create-wallet-gift-coupon';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopCartPriceDetailsWithCoupon } from '../../../../pages/customer/shop-cart.page';

function computeTc004CouponAmount(availableSavings: number, emiInitialPayment: number): number {
  return Math.min(100, emiInitialPayment - 1, availableSavings - 1);
}

test.describe('TC_SHOP_UserSaving_004 @customer-flows', () => {
  // TEMP: User Savings is disabled in the customer UI (2026-10-26). Remove this skip once it is re-enabled.
  test.skip(true, 'User Savings is temporarily disabled in the UI');
  test('TC_SHOP_UserSaving_004|AT-1650 - EMI product: coupon + User Savings, down payment < savings, coupon < savings (TC001 product)', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);

    const tc001ProductName = getShopDataset().productName;
    const emiPlanTenure = ShopEmiPage.planTenures.SIX_MONTHS;

    let couponCode = '';
    let couponAmount = 0;
    let productName = '';
    let emiLinePrice = 0;
    let emiInitialPayment = 0;
    let cartPrice: ShopCartPriceDetailsWithCoupon;

    await test.step('TC004_1 | Shop — EMI product (TC001), read down payment and create coupon', async () => {
      console.log('\n[TC004_1] Shop — EMI product (TC001), read down payment and create coupon');

      await shopCartPage.clearCartAndExpectEmpty();

      ({
        productName,
        emiLinePrice,
        emiInitialPayment,
      } = await shopPage.addEmiProductForFullSavingsDownPayment(shopCartPage, shopEmiPage, {
        emiPlanTenure,
        preferredProductName: tc001ProductName,
      }));
      const availableSavings = await shopCartPage.readAvailableUserSavingsBalance();
      couponAmount = computeTc004CouponAmount(availableSavings, emiInitialPayment);
      shopCartPage.assertTc015CouponSavingsPreconditions(
        availableSavings,
        emiInitialPayment,
        couponAmount,
        emiLinePrice,
      );

      const coupon = await createWalletGiftCoupon({ amount: couponAmount });
      couponCode = coupon.code;
      couponAmount = coupon.amount;
      console.log('[product]', productName, '| down payment', emiInitialPayment, '| coupon', couponCode, coupon.amount);
      expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);
    });

    await test.step('TC004_2 | Shop — apply coupon and User Savings on EMI cart', async () => {
      console.log('\n[TC004_2] Shop — apply coupon and User Savings on EMI cart');
      await shopCartPage.applyCouponCode(couponCode);
      const afterCoupon = await shopCartPage.getEmiCartPriceDetailsWithCoupon();
      await shopCartPage.clickUseSavingCheckbox();
      const afterSavings = await shopCartPage.getEmiCartPriceDetailsWithCoupon();
      cartPrice = shopCartPage.emiCartAsCouponPrice({
        ...afterSavings,
        couponDiscount: afterCoupon.couponDiscount || couponAmount,
      });
      console.log('[cart grand total]', cartPrice.grandTotal, '| coupon', cartPrice.couponDiscount);
    });

    await test.step('TC004_3 | Checkout — validate EMI coupon price lines', async () => {
      console.log('\n[TC004_3] Checkout — validate EMI coupon price lines');
      await shopCartPage.clickProceedToPay();
      const checkoutPrice = await shopCheckoutPage.validateEmiCheckoutCouponLinesMatchCart(cartPrice);
      cartPrice = { ...cartPrice, couponDiscount: checkoutPrice.couponDiscount };
      console.log('[checkout coupon discount]', cartPrice.couponDiscount);
    });

    await test.step('TC004_4 | Checkout — billing, OTP, Pay ₹0', async () => {
      console.log('\n[TC004_4] Checkout — billing, OTP, Pay ₹0');
      await shopCheckoutPage.confirmEmiBillingAfterCoupon(cartPrice.grandTotal);
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateEmiCouponSavingsZeroPayOrderSummaryAndPay();
    });

    await test.step('TC004_5 | Confirm order placed', async () => {
      console.log('\n[TC004_5] Confirm order placed');
      const placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
      console.log('[order id]', placedOrderId);
    });

    await test.step('TC004_6 | My Orders — validate order detail product, status, amount', async () => {
      console.log('\n[TC004_6] My Orders — validate order detail product, status, amount');
      await myOrderVerificationPage.validateShopEmiOrderListCouponSummary({
        productName,
        expectedAmount: emiLinePrice,
      });
    });
  });
});
