import { test, expect } from '../../../../fixtures/base.fixture';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';

test.describe('TC_Shop_DeliveryAddress_002 @customer-flows', () => {
  test('TC_Shop_DeliveryAddress_002-Cancel address edit shows Add New Address button', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
  }) => {
    test.setTimeout(180_000);

    const TC002 = (n: number): string => `TC002_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC002(n)}] ${title}`);
    };

    const { productName } = getShopDataset();

    await test.step('TC002_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC002_2 | Buy Now — select product and validate cart', async () => {
      logSub(2, 'Buy Now — select product and validate cart');
      await shopPage.verifyProductInCatalog();
      await shopPage.selectProduct(productName);
      const productAmount = (await shopPage.getProductDetails()).grandTotal;
      await shopPage.clickBuyNowFromPdp();
      const cartItem = await shopCartPage.getCartItemDetails(productName);
      expect(cartItem.productName).toContain(productName);
      expect(cartItem.itemPrice).toBe(productAmount);
    });

    await test.step('TC002_3 | Proceed to checkout and validate address step', async () => {
      logSub(3, 'Proceed to checkout and validate address step');
      await shopCartPage.clickProceedToPay();
      await shopCheckoutPage.validateChooseBillingAddressCheckoutPage();
      await shopCheckoutPage.getBillingAddress(0);
    });

    await test.step('TC002_4 | Select first address card, Edit and change fields', async () => {
      logSub(4, 'Select first address card, Edit and change fields');
      await shopCheckoutPage.selectBillingAddressCardByIndex(0);
      await shopCheckoutPage.clickEditOnBillingAddressCard(0);
      await shopCheckoutPage.updateCustomerDetails(
        'canceltest',
        'user',
        '9999999999',
        'Cancelled Address Line'
      );
    });

    await test.step('TC002_5 | Click Cancel on address edit form', async () => {
      logSub(5, 'Click Cancel on address edit form');
      await shopCheckoutPage.clickCancelOnAddressEditForm();
    });

    await test.step('TC002_6 | Verify Add New Address and cancel restored card list', async () => {
      logSub(6, 'Verify Add New Address and cancel restored card list');
      await shopCheckoutPage.verifyCancelEditAddressFormRestoresCardList();
    });
  });
});
