import { test } from '../../../fixtures/base.fixture';
import { getShopDataset } from '../../../utils/data/customer-excel-data';

test.describe('TC_SHOP_011 @customer-flows', () => {
  test('TC_SHOP_011|AT-1658 - My Orders: find EMI order by id, Pay Now and foreclose EMI(3 Months) AT-1658', async ({
    shopEmiPurchaseChain009,
    shopEmiForeclosePage,
    myOrderVerificationPage,
    paymentPage,
    emiOrderDetailValidationPage,
  }) => {
    test.setTimeout(360_000);

    const TC011 = (n: number): string => `TC011_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC011(n)}] ${title}`);
    };

    const shopData = getShopDataset();

    let emiOrderId = '';
    let productName = '';
    let emiTenure = '';

    await test.step('TC011_1 | Load EMI order from TC010', async () => {
      logSub(1, 'Load EMI order from TC010');
      ({ orderId: emiOrderId, productName } = myOrderVerificationPage.requireShopEmiPurchaseChain(
        shopEmiPurchaseChain009,
        {
          missingMessage: 'Run TC_SHOP_010 first or set SHOP_EMI_ORDER_ID',
        },
      ));
    });

    await test.step('TC011_2 | Foreclose EMI order', async () => {
      logSub(2, 'Foreclose EMI order');
      const result = await shopEmiForeclosePage.forecloseEmiOrder(
        myOrderVerificationPage,
        paymentPage,
        {
          orderId: emiOrderId,
          productName,
          mobile: shopData.mobile,
          purchaseChain: shopEmiPurchaseChain009,
        },
      );

      emiTenure = result.payNowDetails.emiTenure;
    });

    await test.step('TC011_3 | My Orders — verify payment received', async () => {
      logSub(3, 'My Orders — verify payment received');
      await myOrderVerificationPage.validateShopOrderPaymentReceived({
        orderId: emiOrderId,
        productName,
      });
    });

    await test.step('TC011_4 | Open view detail', async () => {
      logSub(4, 'Open view detail');
      await myOrderVerificationPage.openShopOrderViewDetailByOrderId(emiOrderId, { productName });
    });

    await test.step('TC011_5 | Validate foreclosed status timeline', async () => {
      logSub(5, 'Validate foreclosed status timeline');
      await myOrderVerificationPage.validateForeclosedShopOrderDetailStatusTimeline();
    });

    await test.step('TC011_6 | Verify all EMIs paid', async () => {
      logSub(6, 'Verify all EMIs paid');
      await emiOrderDetailValidationPage.validateAllEmisPaid({
        emiTenure,
      });
    });

    await test.step('TC011_7 | Validate foreclose invoice', async () => {
      logSub(7, 'Validate foreclose invoice');
      await myOrderVerificationPage.validateForecloseInvoice({
        productName,
      });
    });
  });
});
