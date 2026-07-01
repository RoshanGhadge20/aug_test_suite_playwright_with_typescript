import { test } from '../../../fixtures/base.fixture';
import { getShopDataset, getShopTc003Dataset } from '../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails, ShopPlacedOrders } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';

test.describe('TC_SHOP_003 @customer-flows', () => {
  test('TC_SHOP_003|AT-1639 - Two-product shop: EMI(3 Months) Pay Now + Buy Now checkout', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);

    const TC003 = (n: number): string => `TC003_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC003(n)}] ${title}`);
    };

    const { emiProductName, buyNowProductName } = getShopTc003Dataset();
    const productNames = [emiProductName, buyNowProductName];

    const productDetailsByName: Record<string, ShopProductDetails> = {};
    const productLinePrices: Record<string, number> = {};
    const cartNetWeightByName: Record<string, string> = {};
    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};

    let savedBillingAddress: ShopBillingAddressDetails;
    let placedOrders: ShopPlacedOrders;
    let combinedGrandTotal = 0;
    let emiInitialPayment = 0;

    await test.step('TC003_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareFilteredListing(shopCartPage);
    });

    await test.step('TC003_2 | Create mixed cart — EMI + Buy Now', async () => {
      logSub(2, 'Create mixed cart — EMI + Buy Now');
      await shopPage.verifyProductsInCatalog(productNames);

      productDetailsByName[emiProductName] =
        await shopPage.captureEmiProductForMixedCart(emiProductName);
      await shopPage.clickBuyWithEmi();

      const emiResult = await shopEmiPage.addProductViaEmiPlan('3 Months');
      productLinePrices[emiProductName] = emiResult.emiLinePrice;
      emiInitialPayment = emiResult.emiInitialPayment;

      await shopPage.openListingWithFilters();
      productDetailsByName[buyNowProductName] =
        await shopPage.captureBuyNowProductForMixedCart(buyNowProductName);
      await shopPage.clickBuyNow();

      await shopCartPage.expectCartHasProducts(productNames);
      const cartSnapshot = await shopCartPage.validateMixedCart({
        productNames,
        emiProductName,
        buyNowProductName,
        productDetailsByName,
        emiExpectedNetPayable: shopEmiPage.expectedNetPayableAmount(emiResult.emi),
        emiInitialPayment: emiResult.emiInitialPayment,
      });

      Object.assign(productLinePrices, cartSnapshot.productLinePrices);
      Object.assign(cartNetWeightByName, cartSnapshot.cartNetWeightByName);
      combinedGrandTotal = cartSnapshot.combinedGrandTotal;

      await shopCartPage.clickProceedToPay();
      savedBillingAddress = await shopCheckoutPage.validateMixedEmiCheckoutBilling({
        emiPlanDetails: emiResult.emi,
        emiInitialPayment: emiResult.emiInitialPayment,
        expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiResult.emi),
        combinedGrandTotal: cartSnapshot.combinedGrandTotal,
        buyNowLineTotal: productLinePrices[buyNowProductName],
      });
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateMixedOrderSummaryAfterOtp({
        productNames,
        productLinePrices,
        emiInitialPayment: emiResult.emiInitialPayment,
        combinedGrandTotal: cartSnapshot.combinedGrandTotal,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: cartSnapshot.combinedGrandTotal });
    });

    await test.step('TC003_3 | Confirm multi-product orders placed', async () => {
      logSub(3, 'Confirm multi-product orders placed');
      placedOrders = await shopCheckoutPage.confirmMultiProductOrdersPlaced(productNames.length);
    });

    await test.step('TC003_4 | My Orders — validate mixed orders on list', async () => {
      logSub(4, 'My Orders — validate mixed orders on list');
      const listResult = await myOrderVerificationPage.validateMixedOrdersOnList({
        productNames,
        emiProductName,
        productLinePrices,
        placedOrders,
        checkoutPage: shopCheckoutPage,
      });
      Object.assign(orderIdByProduct, listResult.orderIdByProduct);
      Object.assign(shopOrdersByName, listResult.shopOrdersByName);
    });

    await test.step('TC003_5 | My Orders — validate mixed order details', async () => {
      logSub(5, 'My Orders — validate mixed order details');
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

    await test.step('TC003_6 | My Orders — validate mixed invoices', async () => {
      logSub(6, 'My Orders — validate mixed invoices');
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
        invoicePassword: getShopDataset().mobile.replace(/\D/g, '').slice(-4),
      });
    });
  });
});
