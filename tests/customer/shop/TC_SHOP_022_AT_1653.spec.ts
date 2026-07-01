// import { test, expect } from '@playwright/test';
import { expect, test } from '../../../fixtures/base.fixture';
import { getOrderByUniqueId,adminCancelOrder,AdminCancelOrderRequest } from '../../../utils/api/order-status-api';
import type { ShopProductDetails } from '../../../pages/customer/shop.page';
import type { ShopBillingAddressDetails } from '../../../pages/customer/shop-checkout.page';
import type { MyOrderShopCardDetails } from '../../../pages/customer/my-order-verification.page';

test.describe('TC_SHOP_022 @customer-flows', () => {
  test('TC_SHOP_022|AT-1653 - Single product shop: filter, Buy Now, and cancel sport oder from admin through API', async ({
    shopPage,
    shopCartPage,
    shopCheckoutPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC022 = (n: number): string => `TC022_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC022(n)}] ${title}`);
    };


    let productDetails: ShopProductDetails;
    let billingAddress: ShopBillingAddressDetails;
    let placedOrderId = '';
    let shopOrder: MyOrderShopCardDetails;

    await test.step('TC0022_1 | Prepare gold coin listing', async () => {
      logSub(1, 'Prepare gold coin listing');
      await shopPage.prepareGoldCoinListing(shopCartPage);
    });

    await test.step('TC0022_2 | Buy single product — catalog, PDP, cart', async () => {
      logSub(2, 'Buy single product — catalog, PDP, cart');
      await shopPage.verifyProductInCatalog();
      productDetails = await shopPage.selectProductAndCaptureDetails();
      await shopPage.clickBuyNowFromPdp();
     //  const cart = await shopCartPage.validateBuyNowCart(productDetails);
    //   cartNetWeight = cart.netWeight;
    });

    await test.step('TC022_3 | Checkout and pay via netbanking', async () => {
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

    await test.step('TC022_4 | Confirm Buy Now order placed', async () => {
      logSub(4, 'Confirm Buy Now order placed');
      placedOrderId = await shopCheckoutPage.confirmBuyNowOrderPlaced();
    });

    await test.step('TC022_5 | My Orders — validate Buy Now order on list', async () => {
      logSub(5, 'My Orders — validate Buy Now order on list');
      shopOrder = await myOrderVerificationPage.openShopBuyNowOrder();
      await myOrderVerificationPage.validateShopBuyNowOrderOnList({
        productDetails,
        placedOrderId,
        shopOrder,
      });
    });

    await test.step('TC022_6|Cancel Order via API',async() =>
    {
      const orderResponse = await getOrderByUniqueId(placedOrderId);
      const cancelOrderId = orderResponse.data[0].id;    
      console.log(`Order Unique Id: ${placedOrderId}`);
      console.log(`Cancel Order Id: ${cancelOrderId}`);
    

      const body: AdminCancelOrderRequest = {
        storeId: 'M13163373C1D',
        orderId: cancelOrderId,
        userId: 'MP16IA9K',
        customerName: 'PRAGNAKUMARI',
        mobileNumber: '8141122222',
        bookingPrice: 1711,
        totalAmt: '1711.00',
        cancellationPrice: 1711,
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
    await test.step('TC022_7 | My Orders — validate order status after Cancel', async () => {
      logSub(7, 'My Orders — validate Buy Now order on list');
      shopOrder = await myOrderVerificationPage.openShopBuyNowOrder();
      expect(shopOrder.status).toBe('Order Cancelled');      
    
    });




  });
});

