import { test } from '../../../fixtures/base.fixture';
import type { CancellationRefundableBreakdown } from '../../../pages/customer/cancellation-summary.page';
import { resolveAltCustomerMobile, restoreDefaultCustomerSession } from '../helpers/customer-alt-user.helpers';

test.describe('TC_SHOP_018 @customer-flows', () => {
  test('TC_SHOP_018|1660 - Cancel EMI booking (from TC017) and verify invoice', async ({
    page,
    customerLogin,
    shopEmiPurchaseChain017,
    shopEmiForeclosePage,
    cancellationSummaryPage,
    shopCancelBookingPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC018 = (n: number): string => `TC018_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC018(n)}] ${title}`);
    };

    let emiOrderId = '';
    let productName = '';
    let cancellationSummary: CancellationRefundableBreakdown;
    const invoicePassword = resolveAltCustomerMobile().replace(/\D/g, '').slice(-4);

    await test.step('TC018_1 | Load EMI order from TC017', async () => {
      logSub(1, 'Load EMI order from TC017');
      ({ orderId: emiOrderId, productName } = myOrderVerificationPage.requireShopEmiPurchaseChain(
        shopEmiPurchaseChain017,
        {
          missingMessage: 'Run TC_SHOP_017 first or set SHOP_EMI_ORDER_ID_017',
          orderIdEnvKey: 'SHOP_EMI_ORDER_ID_017',
          productNameEnvKey: 'SHOP_EMI_PRODUCT_NAME_017',
        },
      ));
    });

    await test.step('TC018_2 | Open EMI order detail', async () => {
      logSub(2, 'Open EMI order detail');
      await myOrderVerificationPage.openShopEmiOrderDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC018_3 | Cancel EMI booking', async () => {
      logSub(3, 'Cancel EMI booking');
      await shopEmiForeclosePage.cancelEmiBooking();
    });

    await test.step('TC018_4 | Get cancellation summary', async () => {
      logSub(4, 'Get cancellation summary');
      cancellationSummary = await cancellationSummaryPage.getCancellationSummary();
    });

    await test.step('TC018_5 | Validate cancellation summary', async () => {
      logSub(5, 'Validate cancellation summary');
      await cancellationSummaryPage.validateRefundableAmountBreakdown({
        summary: cancellationSummary,
      });
    });

    await test.step('TC018_6 | Enter cancellation reason', async () => {
      logSub(6, 'Enter cancellation reason');
      await shopCancelBookingPage.enterCancellationReason();
    });

    await test.step('TC018_7 | Click Generate OTP', async () => {
      logSub(7, 'Click Generate OTP');
      await shopCancelBookingPage.clickGenerateOtp();
    });

    await test.step('TC018_8 | Fill cancellation OTP', async () => {
      logSub(8, 'Fill cancellation OTP');
      await shopCancelBookingPage.fillCancellationOtp();
    });

    await test.step('TC018_9 | Select refund bank account', async () => {
      logSub(9, 'Select refund bank account');
      await shopCancelBookingPage.selectRefundBankAccount();
    });

    await test.step('TC018_10 | Confirm cancel order', async () => {
      logSub(10, 'Confirm cancel order');
      await shopCancelBookingPage.clickCancelOrder();
    });

    await test.step('TC018_11 | Validate order cancelled message', async () => {
      logSub(11, 'Validate order cancelled message');
      await shopCancelBookingPage.validateOrderCancelledMessage();
    });

    await test.step('TC018_12 | Continue after order cancelled', async () => {
      logSub(12, 'Continue after order cancelled');
      await shopCancelBookingPage.clickContinueAfterOrderCancelled();
    });

    await test.step('TC018_13 | My Orders — verify order cancelled', async () => {
      logSub(13, 'My Orders — verify order cancelled');
      await myOrderVerificationPage.validateShopOrderCancelledAfterCancelBooking({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC018_14 | Open view detail', async () => {
      logSub(14, 'Open view detail');
      await myOrderVerificationPage.openShopOrderViewDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC018_15 | Get order detail status timeline', async () => {
      logSub(15, 'Get order detail status timeline');
      await myOrderVerificationPage.getShopOrderDetailStatusTimeline();
    });

    await test.step('TC018_16 | Validate order detail status timeline', async () => {
      logSub(16, 'Validate order detail status timeline');
      await myOrderVerificationPage.validateCancelledBookedShopOrderDetailStatusTimeline();
    });

    await test.step('TC018_17 | Get order detail refund source', async () => {
      logSub(17, 'Get order detail refund source');
      await myOrderVerificationPage.getShopOrderDetailRefundSource();
    });

    await test.step('TC018_18 | Validate order detail refund source', async () => {
      logSub(18, 'Validate order detail refund source');
      await myOrderVerificationPage.validateShopOrderDetailRefundSource(/bank\s*account/i);
    });

    await test.step('TC018_19 | Get order detail refund amount', async () => {
      logSub(19, 'Get order detail refund amount');
      await myOrderVerificationPage.getShopOrderDetailRefundAmount();
    });

    await test.step('TC018_20 | Validate order detail refund amount', async () => {
      logSub(20, 'Validate order detail refund amount');
      await myOrderVerificationPage.validateShopOrderDetailRefundAmount(
        cancellationSummary.totalRefundableAmount,
      );
    });

    await test.step('TC018_21 | Get cancel invoice refund amount', async () => {
      logSub(21, 'Get cancel invoice refund amount');
      await myOrderVerificationPage.getShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
        { invoicePassword },
      );
    });

    await test.step('TC018_22 | Validate cancel invoice refund amount', async () => {
      logSub(22, 'Validate cancel invoice refund amount');
      await myOrderVerificationPage.validateShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
        { invoicePassword },
      );
    });

    await test.step('TC018_23 | Restore default customer session', async () => {
      logSub(23, 'Persist default customer storage state for following tests');
      await restoreDefaultCustomerSession(page, customerLogin, TC018(23));
    });
  });
});
