import { test } from '../../../../fixtures/base.fixture';
import type { CancellationRefundableBreakdown } from '../../../../pages/customer/cancellation-summary.page';
import { getTargetEnv } from '../../../../config/environments';
import {
  resolveAltCustomerMobile,
  resolveAltCustomerOtp,
  restoreDefaultCustomerSession,
} from '../../helpers/customer-alt-user.helpers';

test.describe('TC_Shop_EMI_007 @customer-flows', () => {
  // The EMI order this spec cancels belongs to the alt customer (created by
  // TC_SHOP_UserSaving_006 / old "TC017"). Log in fresh instead of inheriting whatever
  // session another test last persisted to storage/<env>/customer.json — any spec that
  // runs between the two and restores the default customer would otherwise leave this
  // test looking for the order in the wrong account.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC_Shop_EMI_007|1660 - Cancel EMI booking (from TC017) and verify invoice', async ({
    page,
    customerLogin,
    shopEmiPurchaseChain017,
    shopEmiForeclosePage,
    cancellationSummaryPage,
    shopCancelBookingPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC007 = (n: number): string => `TC007_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC007(n)}] ${title}`);
    };

    let emiOrderId = '';
    let productName = '';
    let cancellationSummary: CancellationRefundableBreakdown;
    const altCustomerMobile = resolveAltCustomerMobile();
    const altCustomerOtp = resolveAltCustomerOtp();
    const invoicePassword = altCustomerMobile.replace(/\D/g, '').slice(-4);

    await test.step('TC007_0 | Login alt customer', async () => {
      logSub(0, 'Fresh login as alt customer');
      console.log(
        `[${TC007(0)}] Logging in as ${altCustomerMobile} using ${getTargetEnv().toUpperCase()} customer OTP.`,
      );
      await customerLogin.login(altCustomerMobile, altCustomerOtp);
    });

    await test.step('TC007_1 | Load EMI order from TC017', async () => {
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

    await test.step('TC007_2 | Open EMI order detail', async () => {
      logSub(2, 'Open EMI order detail');
      await myOrderVerificationPage.openShopEmiOrderDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC007_3 | Cancel EMI booking', async () => {
      logSub(3, 'Cancel EMI booking');
      await shopEmiForeclosePage.cancelEmiBooking();
    });

    await test.step('TC007_4 | Get cancellation summary', async () => {
      logSub(4, 'Get cancellation summary');
      cancellationSummary = await cancellationSummaryPage.getCancellationSummary();
    });

    await test.step('TC007_5 | Validate cancellation summary', async () => {
      logSub(5, 'Validate cancellation summary');
      await cancellationSummaryPage.validateRefundableAmountBreakdown({
        summary: cancellationSummary,
      });
    });

    await test.step('TC007_6 | Enter cancellation reason', async () => {
      logSub(6, 'Enter cancellation reason');
      await shopCancelBookingPage.enterCancellationReason();
    });

    await test.step('TC007_7 | Click Generate OTP', async () => {
      logSub(7, 'Click Generate OTP');
      await shopCancelBookingPage.clickGenerateOtp();
    });

    await test.step('TC007_8 | Fill cancellation OTP', async () => {
      logSub(8, 'Fill cancellation OTP');
      await shopCancelBookingPage.fillCancellationOtp();
    });

    await test.step('TC007_9 | Select refund bank account', async () => {
      logSub(9, 'Select refund bank account');
      await shopCancelBookingPage.selectRefundBankAccount();
    });

    await test.step('TC007_10 | Confirm cancel order', async () => {
      logSub(10, 'Confirm cancel order');
      await shopCancelBookingPage.clickCancelOrder();
    });

    await test.step('TC007_11 | Validate order cancelled message', async () => {
      logSub(11, 'Validate order cancelled message');
      await shopCancelBookingPage.validateOrderCancelledMessage();
    });

    await test.step('TC007_12 | Continue after order cancelled', async () => {
      logSub(12, 'Continue after order cancelled');
      await shopCancelBookingPage.clickContinueAfterOrderCancelled();
    });

    await test.step('TC007_13 | My Orders — verify order cancelled', async () => {
      logSub(13, 'My Orders — verify order cancelled');
      await myOrderVerificationPage.validateShopOrderCancelledAfterCancelBooking({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC007_14 | Open view detail', async () => {
      logSub(14, 'Open view detail');
      await myOrderVerificationPage.openShopOrderViewDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC007_15 | Get order detail status timeline', async () => {
      logSub(15, 'Get order detail status timeline');
      await myOrderVerificationPage.getShopOrderDetailStatusTimeline();
    });

    await test.step('TC007_16 | Validate order detail status timeline', async () => {
      logSub(16, 'Validate order detail status timeline');
      await myOrderVerificationPage.validateCancelledBookedShopOrderDetailStatusTimeline();
    });

    await test.step('TC007_17 | Get order detail refund source', async () => {
      logSub(17, 'Get order detail refund source');
      await myOrderVerificationPage.getShopOrderDetailRefundSource();
    });

    await test.step('TC007_18 | Validate order detail refund source', async () => {
      logSub(18, 'Validate order detail refund source');
      await myOrderVerificationPage.validateShopOrderDetailRefundSource(/bank\s*account/i);
    });

    await test.step('TC007_19 | Get order detail refund amount', async () => {
      logSub(19, 'Get order detail refund amount');
      await myOrderVerificationPage.getShopOrderDetailRefundAmount();
    });

    await test.step('TC007_20 | Validate order detail refund amount', async () => {
      logSub(20, 'Validate order detail refund amount');
      await myOrderVerificationPage.validateShopOrderDetailRefundAmount(
        cancellationSummary.totalRefundableAmount,
      );
    });

    await test.step('TC007_21 | Get cancel invoice refund amount', async () => {
      logSub(21, 'Get cancel invoice refund amount');
      await myOrderVerificationPage.getShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
        { invoicePassword },
      );
    });

    await test.step('TC007_22 | Validate cancel invoice refund amount', async () => {
      logSub(22, 'Validate cancel invoice refund amount');
      await myOrderVerificationPage.validateShopCancelInvoiceRefundAmount(
        cancellationSummary.totalRefundableAmount,
        { invoicePassword },
      );
    });

    await test.step('TC007_23 | Restore default customer session', async () => {
      logSub(23, 'Persist default customer storage state for following tests');
      await restoreDefaultCustomerSession(page, customerLogin, TC007(23));
    });
  });
});
