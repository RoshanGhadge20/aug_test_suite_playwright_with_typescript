import { test } from '../../../fixtures/base.fixture';
import { getShopDataset, getShopTc002Dataset } from '../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails, ShopPlacedOrders } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';

test.describe('TC_SHOP_002 @customer-flows', () => {
  test('TC_SHOP_002|AT-1638 - Multi-product gold coin shop flow: filter, cart, checkout and invoice', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);

    const TC002 = (n: number): string => `TC002_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC002(n)}] ${title}`);
    };

    const shopData = getShopDataset();
    const { productNames } = getShopTc002Dataset();

    const productDetailsByName: Record<string, ShopProductDetails> = {};
    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};

    let savedBillingAddress: ShopBillingAddressDetails;
    let placedOrders: ShopPlacedOrders;
    let combinedGrandTotal = 0;
    let cartNetWeightByName: Record<string, string> = {};
    let productLinePrices: Record<string, number> = {};

    await test.step('TC002_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC002_2 | Buy multiple products — catalog, cart validation', async () => {
      logSub(2, 'Buy multiple products — catalog, cart validation');
      await shopPage.verifyProductsInCatalog(productNames);
      Object.assign(
        productDetailsByName,
        await shopPage.captureProductDetailsForNames(productNames),
      );

      for (let i = 0; i < productNames.length; i++) {
        if (i > 0) {
          await shopCartPage.continueShopping();
        }
        await shopPage.addProductViaBuyNowFromListing(productNames[i], {
          expectEmiButton: i === 0,
        });
      }

      await shopCartPage.expectCartHasProducts(productNames);
      const cartSnapshot = await shopCartPage.validateMultiProductCart(
        productNames,
        productDetailsByName,
      );
      combinedGrandTotal = cartSnapshot.combinedGrandTotal;
      cartNetWeightByName = cartSnapshot.cartNetWeightByName;
      productLinePrices = cartSnapshot.productLinePrices;
    });

    await test.step('TC002_3 | Checkout and pay for multi-product order', async () => {
      logSub(3, 'Checkout and pay for multi-product order');
      await shopCartPage.clickProceedToPay();
      savedBillingAddress =
        await shopCheckoutPage.validateBillingAndConfirmDeliveryForCombinedTotal(combinedGrandTotal);
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateMultiProductOrderSummaryAfterOtp({
        productNames,
        productDetailsByName,
        savedBillingAddress,
        combinedGrandTotal,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: combinedGrandTotal });
    });

    await test.step('TC002_4 | Confirm multi-product orders placed', async () => {
      logSub(4, 'Confirm multi-product orders placed');
      placedOrders = await shopCheckoutPage.confirmMultiProductOrdersPlaced(productNames.length);
    });

    await test.step('TC002_5 | My Orders — validate multi-product orders on list', async () => {
      logSub(5, 'My Orders — validate multi-product orders on list');
      const listResult = await myOrderVerificationPage.validateShopMultiProductOrdersOnList({
        productNames,
        productDetailsByName,
        placedOrders,
        checkoutPage: shopCheckoutPage,
      });
      Object.assign(orderIdByProduct, listResult.orderIdByProduct);
      Object.assign(shopOrdersByName, listResult.shopOrdersByName);
    });

    await test.step('TC002_6 | My Orders — validate multi-product order detail', async () => {
      logSub(6, 'My Orders — validate multi-product order detail');
      await myOrderVerificationPage.validateShopMultiProductOrderDetails({
        productNames,
        productDetailsByName,
        cartNetWeightByName,
        savedBillingAddress,
        shopOrdersByName,
        orderIdByProduct,
      });
    });

    await test.step('TC002_7 | My Orders — validate multi-product invoice', async () => {
      logSub(7, 'My Orders — validate multi-product invoice');
      await myOrderVerificationPage.validateShopMultiProductInvoices({
        productNames,
        productDetailsByName,
        productLinePrices,
        orderIdByProduct,
        placedOrders,
        combinedGrandTotal,
        invoicePassword: shopData.mobile.replace(/\D/g, '').slice(-4),
        checkoutPage: shopCheckoutPage,
      });
    });
  });
});
