import { test } from '../../../../fixtures/base.fixture';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';

test.describe('TC_Shop_EMI_003 @customer-flows', () => {
  test('TC_Shop_EMI_003|AT-1641 - My Orders: Pay Now and pay first EMI installment (9 Months, from TC_Shop_EMI_002)', async ({
    shopEmiPurchaseChain007,
    shopEmiForeclosePage,
    myOrderVerificationPage,
    paymentPage,
    emiOrderDetailValidationPage,
  }) => {
    test.setTimeout(360_000);

    const TC003 = (n: number): string => `TC003_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC003(n)}] ${title}`);
    };


    let emiOrderId = '';
    let productName = '';
    let emiTenure = '';

    await test.step('TC003_1 | Load EMI order from TC_Shop_EMI_002', async () => {
      logSub(1, 'Load EMI order from TC_Shop_EMI_002');
      ({ orderId: emiOrderId, productName } = myOrderVerificationPage.requireShopEmiPurchaseChain(
        shopEmiPurchaseChain007,
        {
          missingMessage: 'Run TC_Shop_EMI_002 first or set SHOP_EMI_ORDER_ID_007',
          orderIdEnvKey: 'SHOP_EMI_ORDER_ID_007',
          productNameEnvKey: 'SHOP_EMI_PRODUCT_NAME_007',
        },
      ));
    });

    await test.step('TC003_2 | Pay first EMI installment', async () => {
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

    await test.step('TC003_3 | My Orders — verify order still booked after partial pay', async () => {
      logSub(3, 'My Orders — verify order still booked after partial pay');
      await myOrderVerificationPage.validateShopOrderBookedAfterPartialPay({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC003_4 | Open EMI order detail via Pay Now', async () => {
      logSub(4, 'Open EMI order detail via Pay Now');
      await myOrderVerificationPage.openShopEmiOrderDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC003_5 | Verify first EMI paid, remaining pending', async () => {
      logSub(5, 'Verify first EMI paid, remaining pending');
      await emiOrderDetailValidationPage.validateFirstEmiPaidRemainingPending({
        emiTenure,
      });
    });

    await test.step('TC003_6 | Validate foreclose invoice', async () => {
      logSub(6, 'Validate foreclose invoice');
      await myOrderVerificationPage.validateForecloseInvoice({ productName });
    });
  });
});
