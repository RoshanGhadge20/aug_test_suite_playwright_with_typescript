import { test,expect } from '../../../../fixtures/base.fixture';
import { getShopTc011Dataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';
import { getOrderByUniqueId,adminCancelOrder,AdminCancelOrderRequest } from '../../../../utils/api/order-status-api';
import {
  loginAltCustomerWithGoldSetup,
  restoreDefaultCustomerSession,
} from '../../helpers/customer-alt-user.helpers';
let shopOrder: MyOrderShopCardDetails;

test.describe('TC_SHOP_UserSaving_007 @customer-flows', () => {
  // TEMP: User Savings is disabled in the customer UI (2026-10-26). Remove this skip once it is re-enabled.
  test.skip(true, 'User Savings is temporarily disabled in the UI');
  test.use({ storageState: { cookies: [], origins: [] } });
  test('TC_SHOP_UserSaving_007|AT-1654 - Verify end-to-end cancellation Shop product purchase using User Saving and Net Banking(Spot order)', async ({
    page,
    shopPage,
    customerLogin,
    dashboardPage,
    shopCartPage,
    shopCheckoutPage,
    buyMetalPage,
    buySummaryPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(420_000);


    const TC007_GOLD_SETUP_AMOUNT = '500';

    const TC007 = (n: number): string => `TC007_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC007(n)}] ${title}`);
    };

    const { productName: preferredProductName } = getShopTc011Dataset();

    let productName = '';
    let productDetails: ShopProductDetails;
    let placedOrderId = '';
    let shopOrder: MyOrderShopCardDetails;
    let altCustomerMobile = '';
    let altCustomerOtp = '';

    try {

    await test.step('TC007_0 | Login alt customer', async () => {
      logSub(0, 'Fresh login as alt customer');
      ({ altCustomerMobile, altCustomerOtp } = await loginAltCustomerWithGoldSetup(
        { customerLogin, dashboardPage, buyMetalPage, buySummaryPage, paymentPage },
        { goldSetupAmount: TC007_GOLD_SETUP_AMOUNT, logLabel: TC007(0) },
      ));
    });



    await test.step('TC007_1 | Create partial savings purchase — cart, checkout, pay', async () => {
      logSub(1, 'Create partial savings purchase — cart, checkout, pay');
      const selected = await shopPage.addBuyNowProductForPartialSavings(shopCartPage, {
        preferredProductName,
      });
      productName = selected.productName;
      productDetails = selected.productDetails;

      await shopCartPage.clickUseSavingCheckbox();
      const cartItem = await shopCartPage.getCartItemDetails(productName);

      await shopCartPage.clickProceedToPay();
      const partial = await shopCheckoutPage.validatePartialSavingsCheckout({
        productName,
        productDetails,
      });
      await shopCheckoutPage.confirmBillingAndDelivery();
      await shopCheckoutPage.validateCheckoutOtp(altCustomerMobile, altCustomerOtp);
      const payableAmount = await shopCheckoutPage.validatePartialSavingsOrderSummary({
        productDetails,
        cartSavingsAmount: partial.cartSavingsAmount,
      });
      await shopCheckoutPage.placeOrderViaNetbanking();
      await paymentPage.completeShopNetbankingPayment({ expectedAmount: payableAmount });
    });

    await test.step('TC007_2 | Confirm Buy Now order placed', async () => {
      logSub(2, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC007_3 | My Orders — validate Buy Now order on list', async () => {
        logSub(3, 'My Orders — validate Buy Now order on list');
      
        await myOrderVerificationPage.openAndValidateShopBuyNowOrderOnList({
          productName,
          productDetails,
          placedOrderId,
        });
      });
      
      await test.step('TC007_4 | Cancel Order via API', async () => {
        const orderResponse = await getOrderByUniqueId(placedOrderId);
        const order = orderResponse.data[0];
        const cancelOrderId = order.id;
        const finalOrderPrice = order.orderdetails?.[0]?.finalOrderPrice ?? 1711;

        console.log(`Order Unique Id: ${placedOrderId}`);
        console.log(`Cancel Order Id: ${cancelOrderId}`);

        const body: AdminCancelOrderRequest = {
          storeId: order.orderBy?.broker?.store?.storeUniqueId ?? 'M13163373C1D',
          orderId: cancelOrderId,
          userId: order.customerDetails?.customerUniqueId ?? 'MQASZ2UJ',
          customerName: order.customerDetails?.firstName ?? 'PRAGNAKUMARI',
          mobileNumber: order.customerDetails?.mobileNumber ?? '8141100000',
          bookingPrice: finalOrderPrice,
          totalAmt: finalOrderPrice.toFixed(2),
          cancellationPrice: finalOrderPrice,
          differenceAmt: 0,
          totalCancellationCharges: 0,
          amtPayable: 0,
          cancellationCharges: 0,
          passbookId: null,
          checkCopyId: null,
          nextStatus: '13',
          amountTransferTo: 'N/A',
        };
      
        const response = await adminCancelOrder(cancelOrderId, body);
      
        console.log('Response:', response);
      });
      
      await test.step('TC007_5 | My Orders — validate order status after Cancel', async () => {
        logSub(5, 'Validate order status after Cancel');       

          shopOrder=await myOrderVerificationPage.openAndValidateShopBuyNowOrderOnList({
          productName,
          productDetails,
          placedOrderId,
        });
        expect(shopOrder.status).toBe('Order Cancelled');      
      
      });

    } finally {
      await test.step('TC007_6 | Restore default customer session', async () => {
        try {
          logSub(6, 'Persist default customer storage state for following tests');
          await restoreDefaultCustomerSession(page, customerLogin, TC007(6));
        } catch (error) {
          console.error('Failed to restore default customer session:', error);
        }
      });
    
    }
  });
 


});
    
