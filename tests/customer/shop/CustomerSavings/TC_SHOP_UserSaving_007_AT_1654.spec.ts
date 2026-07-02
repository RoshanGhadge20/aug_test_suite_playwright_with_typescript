import { test,expect } from '../../../../fixtures/base.fixture';
import { getShopTc011Dataset,getBuyMetalDataset } from '../../../../utils/data/customer-excel-data';
import type { ShopProductDetails } from '../../../../pages/customer/shop.page';
import type { MyOrderShopCardDetails } from '../../../../pages/customer/my-order-verification.page';
import { getOrderByUniqueId,adminCancelOrder,AdminCancelOrderRequest } from '../../../../utils/api/order-status-api';
import { restoreDefaultCustomerSession } from '../../helpers/customer-alt-user.helpers';

import { getTargetEnv } from '../../../../config/environments';
import {  
  resolveAltCustomerMobile,
  resolveAltCustomerOtp,
} from '../../helpers/customer-alt-user.helpers';
let shopOrder: MyOrderShopCardDetails;

test.describe('TC_SHOP_UserSaving_007 @customer-flows', () => {
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
    const altCustomerMobile = resolveAltCustomerMobile();
    const altCustomerOtp = resolveAltCustomerOtp();
    const { netbankingBankName } = getBuyMetalDataset();

    try {

    await test.step('TC007_0 | Login alt customer', async () => {
      logSub(0, 'Fresh login as alt customer');
      console.log(
        `[${TC007(0)}] Logging in as ${altCustomerMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
      );
      await customerLogin.login(altCustomerMobile, altCustomerOtp);
      let withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(20_000);
      if (!withdrawVisible) {
        console.log(
          `[${TC007(0)}] Withdraw not visible — buying ₹${TC007_GOLD_SETUP_AMOUNT} gold via Buy Now.`,
        );
        await buyMetalPage.placeOneTimeOrder('gold', TC007_GOLD_SETUP_AMOUNT);
        await buySummaryPage.clickPayNowButton();
        await paymentPage.completeNetbankingBuyNowPayment(
          altCustomerMobile,
          Number(TC007_GOLD_SETUP_AMOUNT),
          netbankingBankName,
        );
        withdrawVisible = await dashboardPage.isWithdrawVisibleOnDashboard(25_000);
      }
      expect(
        withdrawVisible,
        'Withdraw button should be visible on dashboard after netbanking setup in TC007_0',
      ).toBe(true);
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
        const cancelOrderId = orderResponse.data[0].id;
      
        console.log(`Order Unique Id: ${placedOrderId}`);
        console.log(`Cancel Order Id: ${cancelOrderId}`);
      
        const body: AdminCancelOrderRequest = {
          storeId: 'M13163373C1D',
          orderId: cancelOrderId,
          userId: 'MQASZ2UJ',
          customerName: 'PRAGNAKUMARI',
          mobileNumber: '8141100000',
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
    
