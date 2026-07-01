import { test } from '../../../fixtures/base.fixture';
import { getShopDataset } from '../../../utils/data/customer-excel-data';

test.describe('TC_SHOP_008 @customer-flows', () => {
  test('TC_SHOP_008|AT-1641 - My Orders: Pay Now and pay first EMI installment (9 Months, from TC007)', async ({
    shopEmiPurchaseChain007,
    shopEmiForeclosePage,
    myOrderVerificationPage,
    paymentPage,
    emiOrderDetailValidationPage,
  }) => {
    test.setTimeout(360_000);

    const TC008 = (n: number): string => `TC008_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC008(n)}] ${title}`);
    };


    let emiOrderId = '';
    let productName = '';
    let emiTenure = '';

    await test.step('TC008_1 | Load EMI order from TC007', async () => {
      logSub(1, 'Load EMI order from TC007');
      ({ orderId: emiOrderId, productName } = myOrderVerificationPage.requireShopEmiPurchaseChain(
        shopEmiPurchaseChain007,
        {
          missingMessage: 'Run TC_SHOP_007 first or set SHOP_EMI_ORDER_ID_007',
          orderIdEnvKey: 'SHOP_EMI_ORDER_ID_007',
          productNameEnvKey: 'SHOP_EMI_PRODUCT_NAME_007',
        },
      ));
    });

    await test.step('TC008_2 | Pay first EMI installment', async () => {
      logSub(2, 'Pay first EMI installment');
      const { payNowDetails } = await shopEmiForeclosePage.payFirstEmiInstallment(
        myOrderVerificationPage,
        paymentPage,
        {
          orderId: emiOrderId,
          productName,
          mobile: getShopDataset().mobile,
          purchaseChain: shopEmiPurchaseChain007,
        },
      );
      emiTenure = payNowDetails.emiTenure;
    });

    await test.step('TC008_3 | My Orders — verify order still booked after partial pay', async () => {
      logSub(3, 'My Orders — verify order still booked after partial pay');
      await myOrderVerificationPage.validateShopOrderBookedAfterPartialPay({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC008_4 | Open EMI order detail via Pay Now', async () => {
      logSub(4, 'Open EMI order detail via Pay Now');
      await myOrderVerificationPage.openShopEmiOrderDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC008_5 | Verify first EMI paid, remaining pending', async () => {
      logSub(5, 'Verify first EMI paid, remaining pending');
      await emiOrderDetailValidationPage.validateFirstEmiPaidRemainingPending({
        emiTenure,
      });
    });

    await test.step('TC008_6 | Validate foreclose invoice', async () => {
      logSub(6, 'Validate foreclose invoice');
      await myOrderVerificationPage.validateForecloseInvoice({ productName });
    });
  });
});
