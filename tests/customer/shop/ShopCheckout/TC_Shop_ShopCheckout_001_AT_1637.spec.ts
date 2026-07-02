import { test } from '../../../../fixtures/base.fixture';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';

test.describe('TC_Shop_ShopCheckout_001 @customer-flows', () => {
  test('TC_Shop_ShopCheckout_001|AT-1637 - Single product shop: filter, PDP, Buy Now, validate cart and checkout', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC001(n)}] ${title}`);
    };


    let productDetails: ShopProductDetails;
    let billingAddress: ShopBillingAddressDetails;
    let cartNetWeight = '';
    let placedOrderId = '';
    let shopOrder: MyOrderShopCardDetails;

    await test.step('TC001_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC001_2 | Buy single product — catalog, PDP, cart', async () => {
      logSub(2, 'Buy single product — catalog, PDP, cart');
      await shopPage.verifyProductInCatalog();
      productDetails = await shopPage.selectProductAndCaptureDetails();
      await shopPage.clickBuyNowFromPdp();
      const cart = await shopCartPage.validateBuyNowCart(productDetails);
      cartNetWeight = cart.netWeight;
    });

    await test.step('TC001_3 | Checkout and pay via netbanking', async () => {
      logSub(3, 'Checkout and pay via netbanking');
      await shopCartPage.clickProceedToPay();
      billingAddress = await shopCheckoutPage.validateBillingAndConfirmDelivery(productDetails);
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateOrderSummaryAfterOtp({
        productDetails,
        savedBillingAddress: billingAddress,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({
        expectedAmount: productDetails.grandTotal,
      });
    });

    await test.step('TC001_4 | Confirm Buy Now order placed', async () => {
      logSub(4, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC001_5 | My Orders — validate Buy Now order on list', async () => {
      logSub(5, 'My Orders — validate Buy Now order on list');
      shopOrder = await myOrderVerificationPage.openShopBuyNowOrder();
      await myOrderVerificationPage.validateShopBuyNowOrderOnList({
        productDetails,
        placedOrderId,
        shopOrder,
      });
    });

    await test.step('TC001_6 | My Orders — validate Buy Now order detail', async () => {
      logSub(6, 'My Orders — validate Buy Now order detail');
      await myOrderVerificationPage.validateShopBuyNowOrderDetail({
        productDetails,
        cartNetWeight,
        savedBillingAddress: billingAddress,
        shopOrder,
      });
    });

    await test.step('TC001_7 | My Orders — validate Buy Now invoice', async () => {
      logSub(7, 'My Orders — validate Buy Now invoice');
      await myOrderVerificationPage.validateShopBuyNowInvoice({
        productDetails,
        placedOrderId,
      });
    });
  });
});
