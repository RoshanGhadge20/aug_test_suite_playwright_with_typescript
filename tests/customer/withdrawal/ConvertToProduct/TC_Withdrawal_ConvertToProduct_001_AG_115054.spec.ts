import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

const TC_ID = 'TC_Withdrawal_ConvertToProduct_001';

test.describe('TC_Withdrawal_ConvertToProduct_001 @customer-flows', () => {
  test('TC_001-withdrwal from gold vault and convert into gold coin @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(240_000);
    const TC001_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let validQty = 0;
    let investmentListTotalGoldRequired = 0;
    let beforeWithdrawalVaultTotalGold = 0;
    let beforeWithdrawalVaultRemainingGold = 0;
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
    const TC001 = (n: number): string => `TC001_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC001(n)}] ${title}`);
    };

    await test.step('TC001_1 | Get and validate portfolio values', async () => {
      logSub(1, 'Get and validate portfolio values');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({
          requireSilver: false,
        }));
        
    });

    await test.step('TC001_2 | Withdrawal — open withdrawal options', async () => {
      logSub(2, 'Open withdrawal options');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC001_3 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(3, 'Withdrawal options — Get Coins and Bars');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });


    await test.step('TC001_4 | Verify product list is available and select product', async () => {
      logSub(4, 'Verify product list is available and select product');
      console.log(`[${TC001(4)}] Product selected from withdrawal workbook:`, TC001_PRODUCT_NAME);
      await withdrawalPage.browseAndSelectCoinProduct(TC001_PRODUCT_NAME);
    });

    await test.step('TC001_5 | Get and validate product details', async () => {
      logSub(5, 'Get and validate product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      console.log(selectedProductDetails);
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC001_6 | Verify cart details', async () => {
      logSub(6, 'Verify cart details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details were not captured before cart validation.');
      }
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
      console.log('Cart quantity normalized to 1 for selected product');
      await withdrawalPage.validateCartItemWithSelectedProduct({
        productName: selectedProductDetails.productName,
        productWeight: selectedProductDetails.productWeight,
        quantity: 1,
        });
      await withdrawalPage.validateCartPayableMatchesMakingCharges(
        selectedProductDetails.makingAndDeliveryChargesAmount,
      );
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC001_7 | Verify investment details before withdrawal', async () => {
      logSub(7, 'Verify investment details before withdrawal');
      const investmentSummary = await withdrawalPage.getAndLogInvestmentListSummary();
      investmentListTotalGoldRequired = investmentSummary.goldRequired;
    });

    await test.step('TC001_8 | Verify Vault card value before withdrawal', async () => {
      logSub(8, 'Verify Vault card value before withdrawal');
      const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
      beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
      beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
      console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
      console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);

    });

    await test.step('TC001_9 | Validate Proceed to Withdraw state for invalid and valid quantities', async () => {
      logSub(9, 'Validate quantity boundaries against Total Gold Required');
      withdrawalPage.assertGoldVaultMeetsRequiredGold({
        vaultTotalGold: beforeWithdrawalVaultTotalGold,
        goldRequired: investmentListTotalGoldRequired,
        stepLabel: TC001(9),
      });
      validQty = await withdrawalPage.validateGoldVaultQuantityBoundariesAndSetValid({
        goldRequired: investmentListTotalGoldRequired,
        remainingGoldBefore: beforeWithdrawalVaultRemainingGold,
        stepLabel: TC001(9),
      });
    });
    await test.step('TC001_10 | Validate delivery information', async () => {
      logSub(10, 'Validate delivery information');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress({
        openAddressFormFirst: true,
      });
    });

    await test.step('TC001_11 | Validate checkout page details', async () => {
      logSub(11, 'Validate checkout page details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details were not captured before checkout validation.');
      }
      if (!deliveryInformation) {
        throw new Error('Delivery information was not captured before checkout validation.');
      }

      await withdrawalPage.completeWithdrawalCheckoutWithNetbanking({
        selectedProductDetails,
        deliveryInformation,
        quantity: 1,
      });
    });


    await test.step('TC001_12 | Verify payment page details', async () => {
      logSub(12, 'Verify payment page details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details were not captured before payment validation.');
      }
      await paymentPage.validateAndCompleteWithdrawalNetbankingPayment(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        'HDFC Bank',
        { tc005Mode: true, logLabel: 'TC_001 VALIDATION' },
      );
      console.log('Payment successful');
    });

    await test.step('TC001_13 | Dashboard — gold  balance after redeem', async () => {
      logSub(13, 'Dashboard balance update');
      await dashboardPage.goto('/dashboard');
      await dashboardPage.waitForUrl(/dashboard/i);
      const totalGoldAfter = await dashboardPage.getTotalGoldValue();
      const expectedGoldAfter = Number((totalGoldBeforePurchase - validQty).toFixed(4));
      console.log(`[${TC001(13)}] Gold before/after/expected:`, totalGoldBeforePurchase, totalGoldAfter, expectedGoldAfter);
      expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
    });


    await test.step('TC001_14 | My orders — delivery card matches cart', async () => {
      logSub(14, 'My orders delivery card');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before my-orders validation.');
      }
      await myOrderVerificationPage.validateWithdrawalDeliveryOrderPending({
        productName: selectedProductDetails.productName,
        productWeight: selectedProductDetails.productWeight,
        quantity: 1,
        expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });
  });
});
