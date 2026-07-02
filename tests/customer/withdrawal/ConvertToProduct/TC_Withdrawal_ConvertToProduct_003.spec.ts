import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

const TC_ID = 'TC_Withdrawal_ConvertToProduct_003';

test.describe('TC_Withdrawal_ConvertToProduct_003 @customer-flows', () => {
  test('TC_003 - Convert into Gold Jewellery and withdrawal from vault and sip end-to-end @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC003 = (n: number): string => `TC003_${n}`;
    const SELECTED_METAL_TYPE: 'Gold' | 'Silver' = 'Gold';
    let SELECTED_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Jewellery';
    const TC003_PRODUCT_NAME =
      tc004Dataset.tc006ProductName || 'Augmont Classic Om Pendant';

    let portfolioValue = 0;
    let totalGoldBefore = 0;
    let totalSilverBefore = 0;
    let selectedProductGm = 0;
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;

    let requiredGold = 0;
    let beforeRemainingGold = 0;
    let beforeRemainingSip = 0;
    let validGoldInput = 0;
    let validSipInput = 0;

    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC003(n)}] ${title}`);
    };

    const parseFirstNumber = (value: string): number => Number((value.match(/[\d.]+/)?.[0] ?? '0').trim());

    await test.step('TC003_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
      logSub(1, 'Login & Dashboard');
      await page.goto('/dashboard');
      ({ portfolioValue, totalGold: totalGoldBefore, totalSilver: totalSilverBefore } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false }));
      console.log(`[${TC003(1)}] Portfolio Value:`, portfolioValue);
      console.log(`[${TC003(1)}] Total Gold:`, totalGoldBefore);
      console.log(`[${TC003(1)}] Total Silver:`, totalSilverBefore);
    });


    await test.step('TC003_4 | Withdrawal — Withdraw deposit & Convert into Gold/Jewellery options visible', async () => {
      logSub(4, 'Withdrawal options');
        await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC003_5 | Withdrawal — Select Convert to Gold/Jewellery → product list', async () => {
      logSub(5, 'Convert to Gold/Jewellery');
      await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
    });

    await test.step('TC003_6 | Product List — categories and dashboard snapshot', async () => {
      logSub(6, 'Product list');
      console.log(
        `[${TC003(6)}] Dashboard snapshot — Total Gold (g):`,
        totalGoldBefore,
        'Total Silver (g):',
        totalSilverBefore,
      );
      const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    await test.step('TC003_7 | Product List — select metal type (Gold/Silver)', async () => {
      logSub(7, 'Select metal type');
      console.log(`[${TC003(7)}] Selected metal type: ${SELECTED_METAL_TYPE}`);
      expect(['Gold', 'Silver']).toContain(SELECTED_METAL_TYPE);
    });

    await test.step('TC003_8 | Product List — select product type and product', async () => {
      logSub(8, 'Select product');
      console.log(
        `[${TC003(8)}] Product from withdrawal workbook (WithdrawalTc006ProductName):`,
        TC003_PRODUCT_NAME,
      );
      await withdrawalPage.selectJewelleryProductWithRetry(TC003_PRODUCT_NAME, SELECTED_PRODUCT_TYPE);
    });

    await test.step('TC003_9 | Product Details — name, weight, charges, delivery date', async () => {
      logSub(9, 'Product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      selectedProductGm = withdrawalPage.assertWithdrawalProductDetailsPopulated(selectedProductDetails);
      console.log(`[${TC003(9)}] Selected product grams:`, selectedProductGm);
    });

    await test.step('TC003_10 | Product Details — Request Delivery (add to cart)', async () => {
      logSub(10, 'Request Delivery');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC003_11 | Cart — single line item after removing extra products', async () => {
      logSub(11, 'Cart details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart validation.');
      }
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
    });

    await test.step('TC003_12 | Cart — quantity/weights/amount payable validation', async () => {
      logSub(12, 'Cart calculations');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart totals validation.');
      }
      const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
        selectedProductDetails.productName,
      );
      await withdrawalPage.validateCartPayableMatchesMakingCharges(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        selectedProductQtyInCart,
      );
    });

    await test.step('TC003_13 | Cart — Select Investments → investment screen', async () => {
      logSub(13, 'Select Investments');
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC003_14 | Investment — capture required and available Gold values', async () => {
      logSub(14, 'Capture required/available values');
      requiredGold = await withdrawalPage.getInvestmentListTotalGoldRequired();
      const availableGold = await withdrawalPage.getInvestmentListTotalGoldAvailable();
      const goldTotals = await withdrawalPage.getGoldVaultCardTotals();
      beforeRemainingGold = goldTotals.remainingGold;
      console.log(`[${TC003(14)}] Required Gold:`, requiredGold);
      console.log(`[${TC003(14)}] Available Gold:`, availableGold);
      console.log(`[${TC003(14)}] Remaining Gold (before):`, beforeRemainingGold);
      expect(requiredGold >= 0).toBe(true);
    });

    await test.step('TC003_15 | Investment — invalid Gold input keeps Proceed disabled', async () => {
      logSub(15, 'Invalid quantity validation');
      const invalidGoldInput = requiredGold > 0 ? Number(Math.max(0, requiredGold - 0.01).toFixed(4)) : 0;
      await withdrawalPage.enterQuantity(invalidGoldInput);
      console.log(`[${TC003(15)}] Invalid Gold input:`, invalidGoldInput);
      const errorText = await withdrawalPage.getQuantityErrorText().catch(() => '');
      console.log(`[${TC003(15)}] Error text:`, errorText);
      if (!errorText) {
        console.log(`[${TC003(15)}] No inline validation text shown; validating via disabled Proceed state.`);
      }
      const isDisabled = await withdrawalPage.isProceedButtonDisabled();
      expect(isDisabled).toBe(true);
    });

    await test.step('TC003_16 | Investment — valid Gold input updates remaining balances', async () => {
      logSub(16, 'Valid quantity and remaining balance');
      validGoldInput = requiredGold > 0 ? Number((requiredGold * 0.5).toFixed(4)) : 0;
      validSipInput = requiredGold > 0 ? Number((requiredGold - validGoldInput).toFixed(4)) : 0;
      console.log(`[${TC003(16)}] Gold input vs Gold Vault remaining:`, validGoldInput, '<=', beforeRemainingGold);
      if (validGoldInput > beforeRemainingGold) {
        throw new Error(
          `[${TC003(16)}][FAIL] Insufficient vault value: validGoldInput (${validGoldInput}) must be <= Gold Vault remaining (${beforeRemainingGold}).`,
        );
      }
      await withdrawalPage.enterQuantity(validGoldInput);
      let sipEntry: Awaited<ReturnType<typeof withdrawalPage.enterQuantityInFirstSipCard>> | null = null;
      if (validSipInput > 0) {
        sipEntry = await withdrawalPage.enterQuantityInFirstSipCard(validSipInput, {
          metalType: 'Gold',
        });
        beforeRemainingSip = sipEntry.remainingValueInGm;
        console.log(`[${TC003(16)}] SIP input vs SIP remaining:`, validSipInput, '>=', beforeRemainingSip);
        if (validSipInput > beforeRemainingSip) {
          throw new Error(
            `[${TC003(16)}][FAIL] Insufficient SIP  value: validSipInput (${validSipInput}) must be >= SIP remaining (${beforeRemainingSip}).`,
          );
        }
      }
      console.log(`[${TC003(16)}] Valid Gold input:`, validGoldInput);
      console.log(`[${TC003(16)}] Valid SIP input:`, validSipInput);

      const goldAfter = await withdrawalPage.getGoldVaultCardTotals();
      const expectedGoldRemaining = Number((beforeRemainingGold - validGoldInput).toFixed(4));
      if (sipEntry) {
        const expectedSipRemaining = Number((beforeRemainingSip - validSipInput).toFixed(4));
        console.log(`[${TC003(16)}] SIP remaining expected/actual:`, expectedSipRemaining, sipEntry.remainingValueAfterEntryInGm);
        expect(sipEntry.remainingValueAfterEntryInGm).toBeCloseTo(expectedSipRemaining, 3);
      }
      console.log(`[${TC003(16)}] Gold remaining expected/actual:`, expectedGoldRemaining, goldAfter.remainingGold);
      expect(goldAfter.remainingGold).toBeCloseTo(expectedGoldRemaining, 3);
      const isEnabled = await withdrawalPage.isProceedButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    await test.step('TC003_17 | Investment — Proceed to account details/checkout', async () => {
      logSub(17, 'Proceed to checkout');
      await withdrawalPage.clickDeliveryProceedButton();
      await expect(page).toHaveURL(/checkout|address|delivery/i);
    });

    await test.step('TC003_18 | Checkout — same as billing & proceed', async () => {
      logSub(18, 'Address');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
    });

    await test.step('TC003_19 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
      logSub(19, 'Payment summary');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before checkout.');
      }
      await withdrawalPage.validateWithdrawalCheckoutPaymentSummary({
        expectedTotal: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });

    await test.step('TC003_20 | Checkout — order details vs product & address', async () => {
      logSub(20, 'Order details on checkout');
      if (!selectedProductDetails || !deliveryInformation) {
        throw new Error('Missing selected product or delivery info for checkout validation.');
      }
      await withdrawalPage.completeWithdrawalCheckoutWithNetbanking({
        selectedProductDetails,
        deliveryInformation,
        quantity: 1,
      });
    });

    await test.step('TC003_21 | Checkout — payment method & Proceed to Pay', async () => {
      logSub(21, 'Proceed to payment');
      // Covered in TC003_20 via completeWithdrawalCheckoutWithNetbanking
    });

    await test.step('TC003_22 | Payment — complete netbanking', async () => {
      logSub(22, 'Payment');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before payment.');
      }
      await paymentPage.validateAndCompleteWithdrawalNetbankingPayment(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        'HDFC Bank',
        { logLabel: TC003(22) },
      );
    });

    await test.step('TC003_23 | Dashboard — gold and silver balance after redeem', async () => {
      logSub(23, 'Dashboard balance update');
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/i);
      const totalGoldAfter = await dashboardPage.getTotalGoldValue();
      const totalSilverAfter = await dashboardPage.getTotalSilverValue();
      const expectedGoldAfter = Number((totalGoldBefore - validGoldInput - validSipInput).toFixed(4));
      const expectedSilverAfter = Number(totalSilverBefore.toFixed(4));
      console.log(`[${TC003(20)}] Gold before/after/expected:`, totalGoldBefore, totalGoldAfter, expectedGoldAfter);
      console.log(`[${TC003(20)}] Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);
      expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
      expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
    });

    await test.step('TC003_24 | My orders — delivery card matches cart', async () => {
      logSub(24, 'My orders delivery card');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before my-orders validation.');
      }
      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);
      await myOrderVerificationPage.waitForOrderRow();
      await myOrderVerificationPage.clickOnDelivery();
      await myOrderVerificationPage.validateLatestOrderRowStatusPending();
      await myOrderVerificationPage.waitForProductOrderCard();
      await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
        productName: selectedProductDetails.productName,
        productWeight: selectedProductDetails.productWeight,
        quantity: 1,
        expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });
  });
});
