import { test } from '../../../../fixtures/base.fixture';
import { ShopEmiPage } from '../../../../pages/customer/shop-emi.page';
import { getShopDataset, getShopEmiJourneyDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopEmiDetails } from '../../../../pages/customer/shop-emi.page';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';

test.describe('TC_Shop_EMI_005 @customer-flows', () => {
  test('TC_Shop_EMI_005|AT-1640 - Gold coin shop flow: filter, cart validation and checkout billing (EMI 3 Months)', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    paymentPage,
    shopEmiPurchaseChain009,
    myOrderVerificationPage,
    emiOrderDetailValidationPage,
  }) => {
    test.setTimeout(360_000);

    const TC005 = (n: number): string => `TC005_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC005(n)}] ${title}`);
    };

    const shopData = getShopDataset();
    const emiJourney = getShopEmiJourneyDataset('009', {
      productName: shopData.productName,
      emiPlanTenure: ShopEmiPage.planTenures.THREE_MONTHS,
    });
    const productName = emiJourney.productName;
    const emiPlanTenure = emiJourney.emiPlanTenure;

    let productDetails: ShopProductDetails;
    let emiPlanDetails: ShopEmiDetails;
    let emiLinePrice = 0;
    let emiInitialPayment = 0;
    let savedBillingAddress: ShopBillingAddressDetails;
    let placedOrderId = '';
    let cartNetWeight = '';
    let shopOrder: MyOrderShopCardDetails;

    await test.step('TC005_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareFilteredListing(shopCartPage);
    });

    await test.step('TC005_2 | Create single EMI purchase — catalog, cart', async () => {
      logSub(2, 'Create single EMI purchase — catalog, cart');
      await shopPage.verifyProductInCatalog(productName);
      productDetails = await shopPage.selectProductAndCaptureDetails(productName);
      await shopPage.clickBuyWithEmi();
      const emiResult = await shopEmiPage.addProductViaEmiPlan(emiPlanTenure);
      emiPlanDetails = emiResult.emi;
      emiLinePrice = emiResult.emiLinePrice;
      emiInitialPayment = emiResult.emiInitialPayment;
      const validated = await shopCartPage.validateEmiCart(
        productName,
        emiResult.emiLinePrice,
        emiResult.emiInitialPayment,
      );
      cartNetWeight = validated.netWeight;
    });

    await test.step('TC005_3 | Checkout and pay EMI initial payment', async () => {
      logSub(3, 'Checkout and pay EMI initial payment');
      await shopCartPage.clickProceedToPay();
      savedBillingAddress = await shopCheckoutPage.validateEmiCheckoutBilling({
        emiPlanDetails,
        emiInitialPayment,
        expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails),
      });
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateEmiOrderSummaryAfterOtp({
        productName,
        emiLinePrice,
        emiInitialPayment,
        emiPlanDetails,
        expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails),
        savedBillingAddress,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: emiInitialPayment });
    });

    await test.step('TC005_4 | Confirm EMI order placed', async () => {
      logSub(4, 'Confirm EMI order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
      myOrderVerificationPage.saveShopEmiPurchaseChainOrder(
        shopEmiPurchaseChain009,
        placedOrderId,
        productName,
      );
    });

    await test.step('TC005_5 | My Orders — validate booked EMI order on list', async () => {
      logSub(5, 'My Orders — validate booked EMI order on list');
      shopOrder = await myOrderVerificationPage.validateShopBookedEmiOrderOnList({
        productName,
        productDetails,
        emiLinePrice,
        placedOrderId,
      });
      myOrderVerificationPage.saveShopEmiPurchaseChainOrder(
        shopEmiPurchaseChain009,
        shopOrder.orderId,
        shopOrder.productName,
      );
    });

    await test.step('TC005_6 | My Orders — validate EMI order detail pending installments', async () => {
      logSub(6, 'My Orders — validate EMI order detail pending installments');
      await myOrderVerificationPage.validateShopEmiOrderDetailPendingInstallments({
        productName,
        productDetails,
        cartNetWeight,
        emiLinePrice,
        emiPlanTenure,
        emiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails),
        emiOrderDetailValidationPage,
      });
    });

    await test.step('TC005_7 | My Orders — validate EMI proforma invoice', async () => {
      logSub(7, 'My Orders — validate EMI proforma invoice');
      await myOrderVerificationPage.validateShopEmiProformaInvoice({
        productName,
        productDetails,
        placedOrderId,
        emiLinePrice,
        emiInitialPayment,
      });
    });
  });
});
