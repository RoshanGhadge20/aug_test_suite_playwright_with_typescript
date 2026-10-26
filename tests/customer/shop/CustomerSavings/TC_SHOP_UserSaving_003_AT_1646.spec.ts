import { test } from '../../../../fixtures/base.fixture';
import { ShopEmiPage } from '../../../../pages/customer/shop-emi.page';
import { getShopDataset, getShopEmiJourneyDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopEmiDetails } from '../../../../pages/customer/shop-emi.page';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';

test.describe('TC_SHOP_UserSaving_003 @customer-flows', () => {
  // TEMP: User Savings is disabled in the customer UI (2026-10-26). Remove this skip once it is re-enabled.
  test.skip(true, 'User Savings is temporarily disabled in the UI');
  test('TC_SHOP_UserSaving_003|AT-1646 - Shop EMI 6 Months: full down payment by User Savings', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    shopEmiPage,
    myOrderVerificationPage,
    emiOrderDetailValidationPage,
  }) => {
    test.setTimeout(420_000);

    const TC003 = (n: number): string => `TC003_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC003(n)}] ${title}`);
    };

    const shopData = getShopDataset();
    const emiJourney = getShopEmiJourneyDataset('013', {
      productName: shopData.productName,
      emiPlanTenure: ShopEmiPage.planTenures.SIX_MONTHS,
    });
    const emiPlanTenure = emiJourney.emiPlanTenure;

    let productName = '';
    let productDetails: ShopProductDetails;
    let emiPlanDetails: ShopEmiDetails;
    let emiLinePrice = 0;
    let emiInitialPayment = 0;
    let cartSavingsAmount = 0;
    let savedBillingAddress: ShopBillingAddressDetails;
    let placedOrderId = '';
    let cartNetWeight = '';
    let shopOrder: MyOrderShopCardDetails;

    await test.step('TC003_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC003_2 | Select EMI product — savings greater than down payment', async () => {
      logSub(2, 'Select EMI product — savings greater than down payment');
      const selected = await shopPage.addEmiProductForFullSavingsDownPayment(
        shopCartPage,
        shopEmiPage,
        {
          emiPlanTenure,
          preferredProductName: emiJourney.productName,
        },
      );
      productName = selected.productName;
      productDetails = selected.productDetails;
      emiPlanDetails = selected.emi;
      emiLinePrice = selected.emiLinePrice;
      emiInitialPayment = selected.emiInitialPayment;
    });

    await test.step('TC003_3 | Validate EMI cart and apply full User Savings', async () => {
      logSub(3, 'Validate EMI cart and apply full User Savings');
      const cart = await shopCartPage.validateEmiCartWithFullSavings(
        productName,
        emiLinePrice,
        emiInitialPayment,
      );
      cartNetWeight = cart.netWeight;
      cartSavingsAmount = cart.cartSavingsAmount;
    });

    await test.step('TC003_4 | Checkout with full savings — OTP and Pay ₹0', async () => {
      logSub(4, 'Checkout with full savings — OTP and Pay ₹0');
      await shopCartPage.clickProceedToPay();
      savedBillingAddress = await shopCheckoutPage.validateEmiBillingWithFullSavingsAndConfirm({
        emiPlanDetails,
        emiInitialPayment,
        expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails),
      });
      await shopCheckoutPage.validateCheckoutOtp();
      await shopCheckoutPage.validateEmiFullSavingsOrderSummaryAndPay({
        productName,
        emiLinePrice,
        emiInitialPayment,
        emiPlanDetails,
        expectedEmiPerMonth: shopEmiPage.expectedEmiPerMonthAmount(emiPlanDetails),
        savedBillingAddress,
        cartSavingsAmount,
      });
    });

    await test.step('TC003_5 | Confirm EMI order placed', async () => {
      logSub(5, 'Confirm EMI order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC003_6 | My Orders — validate booked EMI order on list', async () => {
      logSub(6, 'My Orders — validate booked EMI order on list');
      shopOrder = await myOrderVerificationPage.validateShopBookedEmiOrderOnList({
        productName,
        productDetails,
        emiLinePrice,
        placedOrderId,
      });
    });

    await test.step('TC003_7 | My Orders — validate EMI order detail pending installments', async () => {
      logSub(7, 'My Orders — validate EMI order detail pending installments');
      await myOrderVerificationPage.validateShopEmiOrderDetailPendingInstallments({
        productName,
        productDetails,
        cartNetWeight,
        emiLinePrice,
        emiPlanTenure,
        emiPerMonth: ShopEmiPage.emiPerMonthAmount(emiPlanDetails),
        emiOrderDetailValidationPage,
      });
    });

    await test.step('TC003_8 | My Orders — validate EMI proforma invoice', async () => {
      logSub(8, 'My Orders — validate EMI proforma invoice');
      await myOrderVerificationPage.validateShopEmiProformaInvoice({
        productName,
        productDetails,
        placedOrderId: shopOrder.orderId,
        emiLinePrice,
        emiInitialPayment,
      });
    });
  });
});
