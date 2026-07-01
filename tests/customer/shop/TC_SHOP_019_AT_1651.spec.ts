import { test, expect } from '../../../fixtures/base.fixture';
import { createWalletGiftCoupon } from '../../../utils/api/create-wallet-gift-coupon';
import { getShopTc014Dataset, saveShopTc014ProductName } from '../../../utils/data/customer-excel-data';
import type { ShopCartPriceDetailsWithCoupon } from '../../../pages/customer/shop-cart.page';



test.describe('TC_SHOP_019 @customer-flows', () => {
    test('TC_SHOP_019|AT-1651 - Silver jewellery Buy Now: invalid coupon code, error message validation', async ({
      shopPage,
      shopCartPage,
    }) => {
      test.setTimeout(180_000);
  
      let couponCode = '';
      let productName = '';
      let orderLineAmount = 0;
      let cartPrice: ShopCartPriceDetailsWithCoupon;
  
      await test.step('TC014_1 | Shop — silver product, Buy Now, read order amount', async () => {
        console.log('\n[TC014_1] Shop — silver product, Buy Now, read order amount');
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
  
        console.log('[admin api] Creating wallet gift coupon via admin API (POST /api/coupons)...');
        const coupon = await createWalletGiftCoupon({ amount: orderLineAmount });
        couponCode = coupon.code;
        console.log('[admin api] Coupon created from admin through API call:', couponCode, '| amount', coupon.amount);
        expect(couponCode).toMatch(/^SIN[0-9a-f]+$/i);
      });
  
      await test.step('TC014_2 | Shop — apply coupon on cart', async () => {
        console.log('\n[TC014_2] Shop — apply coupon on cart');
        await shopCartPage.applyInvalidCouponCode(couponCode+"invalid");
        await shopCartPage.validateCouponMessage('THE COUPON CODE YOU ENTERED IS INVALID.');  
       await shopCartPage.clickProceedToPay();
        await shopCartPage.validateCouponErrorMessage('Coupon code does not exist');
      });
    });
  });
