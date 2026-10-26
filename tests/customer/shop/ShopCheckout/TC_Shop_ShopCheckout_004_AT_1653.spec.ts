// import { test, expect } from '@playwright/test';
import { expect, test } from '../../../../fixtures/base.fixture';
import { getOrderByUniqueId,adminCancelOrder,AdminCancelOrderRequest } from '../../../../api-services/admin/order-status-api';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails } from '../../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';

test.describe('TC_Shop_ShopCheckout_004 @customer-flows', () => {
  test('TC_Shop_ShopCheckout_004|AT-1653 - Single product shop: filter, Buy Now, and cancel sport oder from admin through API', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC004 = (n: number): string => `TC004_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC004(n)}] ${title}`);
    };


    let productDetails: ShopProductDetails;
    let billingAddress: ShopBillingAddressDetails;
    let placedOrderId = '';
    let shopOrder: MyOrderShopCardDetails;

    await test.step('TC004_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC004_2 | Buy single product — catalog, PDP, cart', async () => {
      logSub(2, 'Buy single product — catalog, PDP, cart');
      await shopPage.verifyProductInCatalog();
      productDetails = await shopPage.selectProductAndCaptureDetails();
      await shopPage.clickBuyNowFromPdp();
     //  const cart = await shopCartPage.validateBuyNowCart(productDetails);
    //   cartNetWeight = cart.netWeight;
    });

    await test.step('TC004_3 | Checkout and pay via netbanking', async () => {
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

    await test.step('TC004_4 | Confirm Buy Now order placed', async () => {
      logSub(4, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC004_5 | My Orders — validate Buy Now order on list', async () => {
      logSub(5, 'My Orders — validate Buy Now order on list');
      shopOrder = await myOrderVerificationPage.openShopBuyNowOrder();
      await myOrderVerificationPage.validateShopBuyNowOrderOnList({
        productDetails,
        placedOrderId,
        shopOrder,
      });
    });

    await test.step('TC004_6|Cancel Order via API',async() =>
    {
      const orderResponse = await getOrderByUniqueId(placedOrderId);
      const order = orderResponse.data[0];
      const cancelOrderId = order.id;
      const finalOrderPrice = order.orderdetails?.[0]?.finalOrderPrice ?? 1711;
      console.log(`Order Unique Id: ${placedOrderId}`);
      console.log(`Cancel Order Id: ${cancelOrderId}`);

      const body: AdminCancelOrderRequest = {
        storeId: order.orderBy?.broker?.store?.storeUniqueId ?? 'M13163373C1D',
        orderId: cancelOrderId,
        userId: order.customerDetails?.customerUniqueId ?? 'MP16IA9K',
        customerName: order.customerDetails?.firstName ?? 'PRAGNAKUMARI',
        mobileNumber: order.customerDetails?.mobileNumber ?? '8141122222',
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
      const response1 = await adminCancelOrder(cancelOrderId, body);

      console.log('Response1:', response1);
    })
    await test.step('TC004_7 | My Orders — validate order status after Cancel', async () => {
      logSub(7, 'My Orders — validate Buy Now order on list');
      shopOrder = await myOrderVerificationPage.openShopBuyNowOrder();
      expect(shopOrder.status).toBe('Order Cancelled');      
    
    });




  });
});

