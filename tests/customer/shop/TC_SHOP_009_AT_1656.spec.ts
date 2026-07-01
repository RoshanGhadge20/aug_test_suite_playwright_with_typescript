import { test } from '../../../fixtures/base.fixture';
import type { CancellationRefundableBreakdown } from '../../../pages/customer/cancellation-summary.page';

test.describe('TC_SHOP_009 @customer-flows', () => {
  test('TC_SHOP_009|AT-1656- Cancel EMI booking (9 Months, 1 EMI paid) and verify invoice', async ({
    shopEmiPurchaseChain007,
    shopEmiForeclosePage,
    cancellationSummaryPage,
    shopCancelBookingPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC009 = (n: number): string => `TC009_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC009(n)}] ${title}`);
    };


    let emiOrderId = '';
    let productName = '';
    let cancellationSummary: CancellationRefundableBreakdown;

    await test.step('TC009_1 | Load EMI order from TC008', async () => {
      logSub(1, 'Load EMI order from TC008');
      ({ orderId: emiOrderId, productName } = myOrderVerificationPage.requireShopEmiPurchaseChain(
        shopEmiPurchaseChain007,
        {
          missingMessage: 'Run TC_SHOP_008 first or set SHOP_EMI_ORDER_ID_007',
          orderIdEnvKey: 'SHOP_EMI_ORDER_ID_007',
          productNameEnvKey: 'SHOP_EMI_PRODUCT_NAME_007',
          requireFirstEmiPaid: true,
        },
      ));
    });

    await test.step('TC009_2 | Open EMI order detail', async () => {
      logSub(2, 'Open EMI order detail');
      await myOrderVerificationPage.openShopEmiOrderDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC009_3 | Cancel EMI booking', async () => {
      logSub(3, 'Cancel EMI booking');
      await shopEmiForeclosePage.cancelEmiBooking();
    });

    await test.step('TC009_4 | Get cancellation summary', async () => {
      logSub(4, 'Get cancellation summary');
      cancellationSummary = await cancellationSummaryPage.getCancellationSummary();
    });

    await test.step('TC009_5 | Validate cancellation summary', async () => {
      logSub(5, 'Validate cancellation summary');
      await cancellationSummaryPage.validateRefundableAmountBreakdown({
        summary: cancellationSummary,
      });
    });

    await test.step('TC009_6 | Enter cancellation reason', async () => {
      logSub(6, 'Enter cancellation reason');
      await shopCancelBookingPage.enterCancellationReason();
    });

    await test.step('TC009_7 | Click Generate OTP', async () => {
      logSub(7, 'Click Generate OTP');
      await shopCancelBookingPage.clickGenerateOtp();
    });

    await test.step('TC009_8 | Fill cancellation OTP', async () => {
      logSub(8, 'Fill cancellation OTP');
      await shopCancelBookingPage.fillCancellationOtp();
    });

    await test.step('TC009_9 | Select refund bank account', async () => {
      logSub(9, 'Select refund bank account');
      await shopCancelBookingPage.selectRefundBankAccount();
    });

    await test.step('TC009_10 | Confirm cancel order', async () => {
      logSub(10, 'Confirm cancel order');
      await shopCancelBookingPage.clickCancelOrder();
    });

    await test.step('TC009_11 | Validate order cancelled message', async () => {
      logSub(11, 'Validate order cancelled message');
      await shopCancelBookingPage.validateOrderCancelledMessage();
    });

    await test.step('TC009_12 | Continue after order cancelled', async () => {
      logSub(12, 'Continue after order cancelled');
      await shopCancelBookingPage.clickContinueAfterOrderCancelled();
    });

    await test.step('TC009_13 | My Orders — verify order cancelled', async () => {
      logSub(13, 'My Orders — verify order cancelled');
      await myOrderVerificationPage.validateShopOrderCancelledAfterCancelBooking({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC009_14 | Open view detail', async () => {
      logSub(14, 'Open view detail');
      await myOrderVerificationPage.openShopOrderViewDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC009_15 | Get order detail status timeline', async () => {
      logSub(15, 'Get order detail status timeline');
      await myOrderVerificationPage.getShopOrderDetailStatusTimeline();
    });

    await test.step('TC009_16 | Validate order detail status timeline', async () => {
      logSub(16, 'Validate order detail status timeline');
      await myOrderVerificationPage.validateCancelledShopOrderDetailStatusTimeline();
    });

    await test.step('TC009_17 | Get order detail refund source', async () => {
      logSub(17, 'Get order detail refund source');
      await myOrderVerificationPage.getShopOrderDetailRefundSource();
    });

    await test.step('TC009_18 | Validate order detail refund source', async () => {
      logSub(18, 'Validate order detail refund source');
      await myOrderVerificationPage.validateShopOrderDetailRefundSource(/bank\s*account/i);
    });

    await test.step('TC009_19 | Get order detail refund amount', async () => {
      logSub(19, 'Get order detail refund amount');
      await myOrderVerificationPage.getShopOrderDetailRefundAmount();
    });

    await test.step('TC009_20 | Validate order detail refund amount', async () => {
      logSub(20, 'Validate order detail refund amount');
      await myOrderVerificationPage.validateShopOrderDetailRefundAmount(
        cancellationSummary.totalRefundableAmount,
      );
    });

    await test.step('TC009_21 | Get cancel invoice refund amount', async () => {
      logSub(21, 'Get cancel invoice refund amount');
      await myOrderVerificationPage.getShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
      );
    });

    await test.step('TC009_22 | Validate cancel invoice refund amount', async () => {
      logSub(22, 'Validate cancel invoice refund amount');
      await myOrderVerificationPage.validateShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
      );
    });
  });
});
