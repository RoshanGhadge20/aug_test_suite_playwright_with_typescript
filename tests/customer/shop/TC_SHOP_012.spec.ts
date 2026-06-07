import { test } from '../../../fixtures/base.fixture';
import { getShopTc011Dataset } from '../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails } from '../../../pages/customer/shop-checkout.page';

test.describe('TC_SHOP_012 @customer-flows', () => {
  test('TC_SHOP_012|AT-1647 - Verify end-to-end Shop product purchase using User Saving and Net Banking AT-1647', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);

    const TC012 = (n: number): string => `TC012_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC012(n)}] ${title}`);
    };

    const { productName: preferredProductName } = getShopTc011Dataset();

    let productName = '';
    let productDetails: ShopProductDetails;
    let placedOrderId = '';
    let cartNetWeight = '';
    let billingAddress: ShopBillingAddressDetails;

    await test.step('TC012_1 | Create partial savings purchase — cart, checkout, pay', async () => {
      logSub(1, 'Create partial savings purchase — cart, checkout, pay');
      const selected = await shopPage.addBuyNowProductForPartialSavings(shopCartPage, {
        preferredProductName,
      });
      productName = selected.productName;
      productDetails = selected.productDetails;

      await shopCartPage.clickUseSavingCheckbox();
      const cartItem = await shopCartPage.getCartItemDetails(productName);
      cartNetWeight = cartItem.netWeight;

      await shopCartPage.clickProceedToPay();
      const partial = await shopCheckoutPage.validatePartialSavingsCheckout({
        productName,
        productDetails,
      });
      billingAddress = await shopCheckoutPage.getBillingAddress();
      await shopCheckoutPage.confirmBillingAndDelivery();
      await shopCheckoutPage.validateCheckoutOtp();
      const payableAmount = await shopCheckoutPage.validatePartialSavingsOrderSummary({
        productDetails,
        cartSavingsAmount: partial.cartSavingsAmount,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });
    });

    await test.step('TC012_2 | Confirm Buy Now order placed', async () => {
      logSub(2, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC012_3 | My Orders — validate Buy Now order on list', async () => {
      logSub(3, 'My Orders — validate Buy Now order on list');
      await myOrderVerificationPage.openAndValidateShopBuyNowOrderOnList({
        productName,
        productDetails,
        placedOrderId,
      });
    });

    await test.step('TC012_4 | My Orders — validate Buy Now order detail', async () => {
      logSub(4, 'My Orders — validate Buy Now order detail');
      const shopOrder = await myOrderVerificationPage.getShopOrderDetails(productName);
      await myOrderVerificationPage.validateShopBuyNowOrderDetail({
        productDetails,
        cartNetWeight,
        savedBillingAddress: billingAddress,
        shopOrder,
        productName,
        placedPaymentMethod: 'Netbanking',
      });
    });

    await test.step('TC012_5 | My Orders — validate Buy Now invoice', async () => {
      logSub(5, 'My Orders — validate Buy Now invoice');
      await myOrderVerificationPage.validateShopBuyNowInvoice({
        productDetails,
        placedOrderId,
        productName,
      });
    });
  });
});
