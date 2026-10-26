import { test, expect } from '../../../../fixtures/base.fixture';
import { createWalletGiftCoupon } from '../../../../api-services/admin/create-wallet-gift-coupon';
import { getShopTc014Dataset, saveShopTc014ProductName } from '../../../../utils/data/customer-excel-data';
import type { ShopCartPriceDetailsWithCoupon } from '../../../../pages/customer/shop-cart.page';

test.describe('TC_Shop_Coupon_001 @customer-flows', () => {
  test('TC_Shop_Coupon_001|AT-1649 - Silver jewellery Buy Now: admin API coupon on cart, full order discount, Pay ₹0 (no savings/funds)', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(180_000);

    let couponCode = '';
    let productName = '';
    let orderLineAmount = 0;
    let cartPrice: ShopCartPriceDetailsWithCoupon;

    await test.step('TC001_1 | Shop — silver product, Buy Now, read order amount', async () => {
      console.log('\n[TC001_1] Shop — silver product, Buy Now, read order amount');
      const dataset = getShopTc014Dataset();
      productName = dataset.productName;
      saveShopTc014ProductName(productName);
      console.log('[product]', productName);

      await shopCartPage.clearCartAndExpectEmpty();
      await shopPage.openSilverJewelleryProduct(productName);
      await shopPage.clickBuyNowFromPdp(false);

      const preCouponCart = await shopCartPage.getCartPriceDetails();
      shopCartPage.expectNoSavingsApplied(preCouponCart);
      orderLineAmount = preCouponCart.grandTotal;
      console.log('[order amount for coupon]', orderLineAmount);
      expect(orderLineAmount).toBeGreaterThan(0);

      console.log('[admin api] Creating wallet gift coupon via admin API (POST /api/coupons)...');
      const coupon = await createWalletGiftCoupon({ amount: orderLineAmount });
      couponCode = coupon.code;
      console.log('[admin api] Coupon created from admin through API call:', couponCode, '| amount', coupon.amount);
      expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);
    });

    await test.step('TC001_2 | Shop — apply coupon on cart', async () => {
      console.log('\n[TC001_2] Shop — apply coupon on cart');
      await shopCartPage.applyCouponCode(couponCode);

      cartPrice = await shopCartPage.getCartPriceDetailsWithCoupon();
      shopCartPage.expectNoSavingsApplied(cartPrice);
      shopCartPage.expectCartGrandTotalWithCoupon(cartPrice);
      console.log('[cart grand total]', cartPrice.grandTotal);
    });

    await test.step('TC001_3 | Checkout — validate price details match cart', async () => {
      console.log('\n[TC001_3] Checkout — validate price details match cart');
      await shopCartPage.clickProceedToPay();
      const checkoutPrice = await shopCheckoutPage.validateCheckoutPriceMatchesCartWithCoupon(cartPrice);
      shopCheckoutPage.expectNoPaidFromFunds(checkoutPrice);
      shopCartPage.expectNoSavingsApplied(cartPrice);
      cartPrice = {
        ...cartPrice,
        couponDiscount: checkoutPrice.couponDiscount,
        grandTotal: checkoutPrice.grandTotal,
      };
      console.log('[checkout grand total]', cartPrice.grandTotal);
    });

    await test.step('TC001_4 | Checkout — billing, OTP, Pay ₹0', async () => {
      console.log('\n[TC001_4] Checkout — billing, OTP, Pay ₹0');
      await shopCheckoutPage.confirmBillingAfterCoupon(cartPrice);
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateZeroPayOrderSummaryAndPay(cartPrice);
    });

    await test.step('TC001_5 | Confirm order placed', async () => {
      console.log('\n[TC001_5] Confirm order placed');
      const placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
      console.log('[order id]', placedOrderId);
    });

    await test.step('TC001_6 | My Orders — validate order detail product, status, amount', async () => {
      console.log('\n[TC001_6] My Orders — validate order detail product, status, amount');
      await myOrderVerificationPage.validateShopBuyNowOrderDetailCouponSummary({
        productName,
        expectedAmount: orderLineAmount,
      });
    });
  });
});
