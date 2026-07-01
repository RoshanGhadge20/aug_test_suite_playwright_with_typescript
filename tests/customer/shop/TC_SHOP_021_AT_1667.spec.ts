import { test, expect } from '../../../fixtures/base.fixture';
import { getShopTc014Dataset, saveShopTc014ProductName } from '../../../utils/data/customer-excel-data';


let cartDetailsBefore: any;
test.describe('TC_SHOP_021 @customer-flows', () => {
  test('TC_SHOP_021|AT-1667 - Silver Jweelery Product quantity update', async ({
    shopPage,
    shopCartPage,
  }) => {
    test.setTimeout(180_000);

    let productName = '';

    await test.step('TC021_1 | Shop — silver product, Buy Now, read Quantity', async () => {
      console.log('\n[TC021_1] Shop — silver product, Buy Now, read quantity');
      const dataset = getShopTc014Dataset();
      productName = dataset.productName;
      saveShopTc014ProductName(productName);
      console.log('product name is', productName);
      await shopCartPage.clearCartAndExpectEmpty();
      await shopPage.openSilverJewelleryProduct(productName);
      await shopPage.clickBuyNowFromPdp(false);
      const cartCount = await shopCartPage.getCartItemCount();
      console.log('Cart item count is', cartCount)
      cartDetailsBefore = await shopCartPage.getCartItemDetails(productName);
      console.log('Cart quantity is', cartDetailsBefore.quantity)
      console.log('cart 1 item price is', cartDetailsBefore.itemPrice);
    });


    await test.step('TC021_2Quantity increase 3 and validate price details after increase quanity', async () => {
      await shopCartPage.selectQuantity('3');
      const cartDetails = await shopCartPage.getCartItemDetails(productName);
      console.log(
        'Cart item Price after increase quantity',
        cartDetails.itemPrice
      );

      console.log(
        'Expected Price',
        cartDetailsBefore.itemPrice * 3
      );

      expect(Number(cartDetails.quantity)).toBe(3);
      expect(cartDetails.itemPrice).toBe(
        cartDetailsBefore.itemPrice * 3
      );
    });

    await test.step('TC021_3|Quantity Decrease 2 and validate price details after Decrease quanity', async () => {
      await shopCartPage.selectQuantity('1');
      const cartDetails = await shopCartPage.getCartItemDetails(productName);
      console.log(
        'Cart item Price after Decrease quantity',
        cartDetails.itemPrice
      );

      console.log(
        'Expected Price',
        cartDetailsBefore.itemPrice * 1
      );

      expect(Number(cartDetails.quantity)).toBe(1);
      expect(cartDetails.itemPrice).toBe(
        cartDetailsBefore.itemPrice * 1
      );
    });



  });

});




