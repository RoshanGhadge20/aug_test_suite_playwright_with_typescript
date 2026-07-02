import { test, expect } from '../../../../fixtures/base.fixture';
import { getExpiredCoupon } from '../../../../utils/api/create-wallet-gift-coupon';
import { getShopTc014Dataset, saveShopTc014ProductName } from '../../../../utils/data/customer-excel-data';



test.describe('TC_Shop_Coupon_003 @customer-flows', () => {
    test('TC_Shop_Coupon_003|AT-1652 - Silver jewellery Buy Now: expired with already used coupon code, error message validation', async ({
      shopPage,
      shopCartPage,
    }) => {
      test.setTimeout(180_000);
  
      let couponCode = '';
      let productName = '';
      let orderLineAmount = 0;
  
      await test.step('TC003_1 | Shop — silver product, Buy Now, read order amount', async () => {
        console.log('\n[TC003_1] Shop — silver product, Buy Now, read order amount');
        const dataset = getShopTc014Dataset();
        productName = dataset.productName;
        saveShopTc014ProductName(productName);
        console.log('[product]', productName);
  
        await shopPage.openSilverJewelleryProduct(productName);
        await shopPage.clickBuyNowFromPdp(false);
  
        const preCouponCart = await shopCartPage.getCartPriceDetails();
        shopCartPage.expectNoSavingsApplied(preCouponCart);
        orderLineAmount = preCouponCart.grandTotal;
        console.log('[order amount for coupon]', orderLineAmount);
        expect(orderLineAmount).toBeGreaterThan(0);
  
        console.log('[admin api] Getting expired coupon via admin API (GET /api/coupons)...');
        const coupon = await getExpiredCoupon();
        couponCode = coupon.code;
        console.log('[admin api] Expired coupon retrieved from admin through API call:', couponCode, '| amount', coupon.amount);
      });
  
      await test.step('TC003_2 | Shop — apply coupon on cart', async () => {
        console.log('\n[TC003_2] Shop — apply coupon on cart');
        await shopCartPage.applyInvalidCouponCode(couponCode);
        await shopCartPage.validateCouponMessage('THIS COUPON HAS EXPIRED.');
      // await shopCartPage.clickProceedToPay();
      // await shopCartPage.validateCouponErrorMessage('Coupon expired');
      });
    });
  });
