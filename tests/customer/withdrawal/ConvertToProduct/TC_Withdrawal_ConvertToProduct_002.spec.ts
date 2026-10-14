import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

test.describe('TC_Withdrawal_ConvertToProduct_002 @customer-flows', () => {
  test('TC002 — withdrawal flow with SIP convert to silver coin @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(300_000);
    const SILVER_PRODUCT =
      tc004Dataset.tc005ProductName || 'Augmont 1GM Silver Coin 999 Purity';

    const TC002 = (n: number): string => `TC002_${n}`;
    let selectedSipName = '';
    let selectedSipMetalValue = '';
    let selectedSipMetalValueNumber = 0;
    let selectedSipMetalType: 'Gold' | 'Silver' = 'Gold';
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let beforeWithdrawalVaultRemainingSilver = 0;
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
    let selectedProductGm = 0;

    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC002(n)}] ${title}`);
    };

    await test.step('TC002_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
      logSub(1, 'Login & Dashboard');
      await page.goto('/dashboard');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireSilver: true }));
      console.log(`[${TC002(1)}] Portfolio Value (Rs):`, portfolioValue);
      console.log(`[${TC002(1)}] Total Gold (g):`, totalGoldBeforePurchase);
      console.log(`[${TC002(1)}] Total Silver (g):`, totalSilverBeforePurchase);
      console.log(`[${TC002(1)}] Gold FD+:`, goldFD);
    });

    await test.step('TC002_2 | Withdrawal — open withdrawal options', async () => {
      logSub(2, 'Open withdrawal options');
      await page.goto('/dashboard');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC002_3 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(3, 'Withdrawal options — Get Coins and Bars');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC002_4 | Withdrawal — Select Convert to Silver & Jewellery → product list', async () => {
      logSub(4, 'Convert to Silver & Jewellery');
      await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
    });

    await test.step('TC002_5 | Product List — categories, metal path = silver product', async () => {
      logSub(5, 'Product list');
      console.log(
        `[${TC002(5)}] Dashboard snapshot — Total Gold (g):`,
        totalGoldBeforePurchase,
        'Total Silver (g):',
        totalSilverBeforePurchase,
      );
      const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
      console.log(`[${TC002(5)}] Product from withdrawal workbook (WithdrawalTc005ProductName):`, SILVER_PRODUCT);
      await withdrawalPage.browseAndSelectCoinProduct(SILVER_PRODUCT, { requireSilverInCatalog: true });
    });

    await test.step('TC002_6 | Product Details — name, weight, charges, delivery date', async () => {
      logSub(6, 'Product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      expect(selectedProductDetails.productName).toBeTruthy();
      expect(selectedProductDetails.productWeight).toBeTruthy();
      expect(selectedProductDetails.makingAndDeliveryChargesAmount).toBeGreaterThan(0);
      expect(selectedProductDetails.expectedDeliveryDate).toBeTruthy();
      console.log(`[${TC002(6)}] Product details:`, selectedProductDetails);
    });

    await test.step('TC002_7 | Product Details — Request Delivery (add to cart)', async () => {
      logSub(7, 'Request Delivery');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC002_8 | Cart — single line item after Removing another product from cart', async () => {
      logSub(8, 'Cart details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart.');
      }
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
    });

    await test.step('TC002_9 | Cart — quantity & amount payable vs making charges', async () => {
      logSub(9, 'Cart calculations');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart totals.');
      }
      const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
        selectedProductDetails.productName,
      );
      const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
      const expectedAmountPayable =
        selectedProductDetails.makingAndDeliveryChargesAmount * selectedProductQtyInCart;
      expect(totalAmountPayable).toBe(expectedAmountPayable);
    });

    await test.step('TC002_10 | Cart — Select Investments → investment screen', async () => {
      logSub(10, 'Select Investments');
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC002_11 | Investment — capture totals and select SIP', async () => {
      logSub(11, 'Capture totals and select SIP');
      await test.step('Verify investment details before withdrawal', async () => {
        logSub(11, 'Verify investment details before withdrawal');
        await withdrawalPage.getAndLogInvestmentListSummary();
      });
      await test.step('Select SIP and capture details', async () => {
        logSub(11, 'Select SIP and capture details');
        if (!selectedProductDetails) {
          throw new Error('Selected product details missing before SIP selection.');
        }
        selectedProductGm = Number(
          (selectedProductDetails.productWeight.match(/([0-9]+(?:\.[0-9]+)?)\s*gm?\b/i)?.[1] ?? '0').trim(),
        );
        console.log(`[TC002_PRODUCT_TOTAL_GM] ${selectedProductGm}`);
        const selectedSipDetails = await dashboardPage.deliveryScrollUpAndClickProceedByMatchingSipMetalValue(
          selectedProductGm,
          { onlyMetalType: 'Silver' },
        );
        selectedSipName = selectedSipDetails.sipName;
        selectedSipMetalValue = String(selectedSipDetails.metalValue);
        selectedSipMetalType = selectedSipDetails.metalType;
        selectedSipMetalValueNumber = selectedSipDetails.metalValue;
        console.log('Selected SIP Name:', selectedSipName);
        console.log('Selected SIP Metal Type:', selectedSipMetalType);
        console.log('Selected SIP Metal Value:', selectedSipMetalValue);
        console.log(`[TC002_SIP_CARD_GM] ${selectedSipMetalValueNumber}`);
      });
    });
    await test.step('TC002_12 | Investment — verify withdrawal panel values before withdrawal', async () => {
      logSub(12, 'Verify withdrawal panel values');
      if (!selectedSipName) {
        throw new Error('Selected SIP name missing before SIP card quantity entry.');
      }
      if (selectedProductGm <= 0) {
        throw new Error(`Selected product gm is invalid before SIP card quantity entry: ${selectedProductGm}`);
      }
      const sipCardData = await withdrawalPage.deliveryGetRemainingAndEnterQuantityForSipCard(
        selectedSipName,
        selectedProductGm,
      );
      beforeWithdrawalVaultRemainingSilver = sipCardData.remainingValueInGm;
      console.log(
        `[TC002_CORRESPONDING_SIP_REMAINING_GM] ${sipCardData.sipName}: ${beforeWithdrawalVaultRemainingSilver}`,
      );
      const expectedRemainingAfterEntry = Number((selectedSipMetalValueNumber - selectedProductGm).toFixed(4));
      console.log(`[TC002_EXPECTED_REMAINING_AFTER_ENTRY_GM] ${expectedRemainingAfterEntry}`);
      console.log(`[TC002_ACTUAL_REMAINING_AFTER_ENTRY_GM] ${sipCardData.remainingValueAfterEntryInGm}`);
      expect(sipCardData.remainingValueAfterEntryInGm).toBeCloseTo(expectedRemainingAfterEntry, 4);
      await withdrawalPage.clickDeliveryProceedButton();
    });

    await test.step('TC002_13 | Checkout — same as billing & proceed', async () => {
      logSub(13, 'Address');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
    });

    await test.step('TC002_14 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
      logSub(14, 'Payment summary');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before checkout.');
      }
      const summary = await withdrawalPage.checkoutPageGetPaymentSummary();
      expect(summary.totalAmount).toBeGreaterThan(0);
      expect(summary.netPayableAmount).toBeCloseTo(summary.totalAmount - summary.paidFromFunds, 2);
      await withdrawalPage.checkoutPageValidatePaymentSummaryAgainstMakingCharges(
        selectedProductDetails.makingAndDeliveryChargesAmount,
      );
    });

    await test.step('TC002_15 | Checkout — order details vs product & address, payment method & Proceed to Pay', async () => {
      logSub(15, 'Order details on checkout');
      if (!selectedProductDetails || !deliveryInformation) {
        throw new Error('Missing product or delivery info for checkout validation.');
      }
      await withdrawalPage.completeWithdrawalCheckoutWithNetbanking({
        selectedProductDetails,
        deliveryInformation,
        quantity: 1,
      });
    });

    await test.step('TC002_16 | Payment — complete netbanking', async () => {
      logSub(16, 'Payment');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before payment.');
      }
      console.log('[TC002_PAYMENT] Starting netbanking payment flow');
      await paymentPage.validateAndCompleteWithdrawalNetbankingPayment(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        'HDFC Bank',
        { logLabel: 'TC002_PAYMENT' },
      );
      console.log('[TC002_PAYMENT] Netbanking payment flow completed (post-success click stage)');
    });

    await test.step('TC002_17 | Dashboard — silver balance after redeem', async () => {
      logSub(17, 'Dashboard silver update');
      if (selectedProductGm <= 0) {
        throw new Error(`selectedProductGm missing for silver balance check: ${selectedProductGm}`);
      }
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/i);
      const totalSilverAfter = await dashboardPage.getTotalSilverValue();
      const expectedSilverAfter = Number((totalSilverBeforePurchase - selectedProductGm).toFixed(4));
      console.log(
        `[${TC002(17)}] Total Silver before:`,
        totalSilverBeforePurchase,
        'after:',
        totalSilverAfter,
        'expected (before − withdrawn gm):',
        expectedSilverAfter,
        'withdrawnGm:',
        selectedProductGm,
      );
      expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
    });

    await test.step('TC002_18 | My orders — delivery card matches cart', async () => {
      logSub(18, 'My orders delivery card');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before my-orders.');
      }
      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);
      await myOrderVerificationPage.validateWithdrawalDeliveryOrderPending({
        productName: selectedProductDetails.productName,
        productWeight: selectedProductDetails.productWeight,
        quantity: 1,
        expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });
  });
});
