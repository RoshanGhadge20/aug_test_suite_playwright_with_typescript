import { test, expect } from '../../../../fixtures/base.fixture';

test.describe('TC_Withdrawal_ConvertToProduct_005 @customer-flows', () => {
  test('TC_005-Convert to Silver or/Jewellery -Verify No Silver Deduction After Failed Payment During SIP Withdrawal Conversion @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC005 = (n: number): string => `TC005_${n}`;
    const SILVER_PRODUCT = 'Augmont 1GM Silver Coin 999 Purity';

    let selectedSipName = '';
    let selectedSipMetalValue = '';
    let selectedSipMetalValueNumber = 0;
    let selectedSipMetalType: 'Gold' | 'Silver' = 'Silver';
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
    let selectedProductGm = 0;
    let capturedFailureMessage = '';

    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC005(n)}] ${title}`);
    };

    await test.step('TC005_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
      logSub(1, 'Login & Dashboard');
      await page.goto('/dashboard');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireSilver: true }));
      console.log(`[${TC005(1)}] Portfolio Value (Rs):`, portfolioValue);
      console.log(`[${TC005(1)}] Total Gold (g):`, totalGoldBeforePurchase);
      console.log(`[${TC005(1)}] Total Silver (g):`, totalSilverBeforePurchase);
      console.log(`[${TC005(1)}] Gold FD+:`, goldFD);
    });


    await test.step('TC005_2 | Withdrawal — open withdrawal options', async () => {
      logSub(2, 'Open withdrawal options');
      await page.goto('/dashboard');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC005_3 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(3, 'Withdrawal options');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC005_4 | Withdrawal — Select Convert to Silver & Jewellery → product list', async () => {
      logSub(4, 'Convert to Silver & Jewellery');
      await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
    });

    await test.step('TC005_5 | Product List — categories, metal path = silver product', async () => {
      logSub(5, 'Product list');
      console.log(
        `[${TC005(5)}] Dashboard snapshot — Total Gold (g):`,
        totalGoldBeforePurchase,
        'Total Silver (g):',
        totalSilverBeforePurchase,
      );
      await withdrawalPage.browseAndSelectCoinProduct(SILVER_PRODUCT, {
        requireSilverInCatalog: true,
        maxAttempts: 3,
      });
    });

    await test.step('TC005_6 | Product Details — name, weight, charges, delivery date', async () => {
      logSub(6, 'Product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      selectedProductGm = withdrawalPage.assertWithdrawalProductDetailsPopulated(selectedProductDetails);
      console.log(`[${TC005(6)}] Product details:`, selectedProductDetails);
    });

    await test.step('TC005_7 | Product Details — Request Delivery (add to cart)', async () => {
      logSub(7, 'Request Delivery');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC005_8 | Cart — single line item after Removing another product from cart', async () => {
      logSub(8, 'Cart details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart.');
      }
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
    });

    await test.step('TC005_9 | Cart — quantity & amount payable vs making charges', async () => {
      logSub(9, 'Cart calculations');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart totals.');
      }
      const selectedProductQtyInCart = await withdrawalPage.getSelectedProductQuantityInCart(
        selectedProductDetails.productName,
      );
      await withdrawalPage.validateCartPayableMatchesMakingCharges(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        selectedProductQtyInCart,
      );
    });

    await test.step('TC005_10 | Cart — Select Investments → investment screen', async () => {
      logSub(10, 'Select Investments');
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC005_11 | Investment — capture totals and select SIP', async () => {
      logSub(11, 'Capture totals and select SIP');
      await withdrawalPage.getAndLogInvestmentListSummary();

      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before SIP selection.');
      }
      if (selectedProductGm <= 0) {
        selectedProductGm = withdrawalPage.assertWithdrawalProductDetailsPopulated(selectedProductDetails);
      }
      console.log(`[TC005_PRODUCT_TOTAL_GM] ${selectedProductGm}`);
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
      console.log(`[TC005_SIP_CARD_GM] ${selectedSipMetalValueNumber}`);
    });

    await test.step('TC005_12 | Investment — verify withdrawal panel values before withdrawal', async () => {
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
      console.log(
        `[TC005_CORRESPONDING_SIP_REMAINING_GM] ${sipCardData.sipName}: ${sipCardData.remainingValueInGm}`,
      );
      const expectedRemainingAfterEntry = Number((selectedSipMetalValueNumber - selectedProductGm).toFixed(4));
      console.log(`[TC005_EXPECTED_REMAINING_AFTER_ENTRY_GM] ${expectedRemainingAfterEntry}`);
      console.log(`[TC005_ACTUAL_REMAINING_AFTER_ENTRY_GM] ${sipCardData.remainingValueAfterEntryInGm}`);
      expect(sipCardData.remainingValueAfterEntryInGm).toBeCloseTo(expectedRemainingAfterEntry, 4);
      await withdrawalPage.clickDeliveryProceedButton();
    });

    await test.step('TC005_13 | Checkout — same as billing & proceed', async () => {
      logSub(13, 'Address');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
    });

    await test.step('TC005_14 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
      logSub(14, 'Payment summary');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before checkout.');
      }
      await withdrawalPage.validateWithdrawalCheckoutPaymentSummary({
        expectedTotal: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });

    await test.step('TC005_15 | Checkout — order details vs product & address, payment method & Proceed to Pay', async () => {
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

    await test.step('TC005_16 | Payment — netbanking with FAILURE in demo bank popup; capture failure message', async () => {
      logSub(16, 'Payment FAILURE');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before payment.');
      }

      capturedFailureMessage = await paymentPage.validateAndFailWithdrawalNetbankingPayment(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        'HDFC Bank',
        { logLabel: TC005(16) },
      );
      console.log(`[${TC005(16)}] Captured failure message:`, capturedFailureMessage || '(none)');

      const failurePatterns =
        /payment\s*(?:was\s*)?(?:failed|unsuccessful|not\s*(?:completed|successful))|payment\s*could\s*not\s*be\s*completed|transaction\s*(?:has\s*)?failed|something\s*went\s*wrong|payment\s*(?:has\s*)?failed/i;
      expect(capturedFailureMessage, 'Captured failure message must not be empty').not.toBe('');
      expect(capturedFailureMessage).toMatch(failurePatterns);
    });

    await test.step('TC005_17 | Dashboard — silver balance UNCHANGED (withdrawal not succeeded)', async () => {
      logSub(17, 'Dashboard silver unchanged');
      if (selectedProductGm <= 0) {
        throw new Error(`selectedProductGm missing for silver balance check: ${selectedProductGm}`);
      }
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/i);
      const totalSilverAfter = await dashboardPage.getTotalSilverValue();
      console.log(
        `[${TC005(17)}] Total Silver before:`,
        totalSilverBeforePurchase,
        'after:',
        totalSilverAfter,
        'attempted-withdraw gm:',
        selectedProductGm,
      );
      expect(totalSilverAfter, 'Silver balance must not decrease after a failed payment').toBeCloseTo(
        totalSilverBeforePurchase,
        2,
      );
    });

    await test.step('TC005_18 | My orders — no NEW Pending DELIVERY for this product (withdrawal not recorded as success)', async () => {
      logSub(18, 'My orders — no successful Pending delivery for failed payment');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before my-orders verification.');
      }

      await page.goto('/my-orders');
      await expect(page).toHaveURL(/my-orders/);

      const noRecord = page.locator('text=No Record Found').first();
      const orderRowsExist = await page
        .locator('div.p-4')
        .filter({ has: page.locator('div.text-10:has-text("Transaction ID")') })
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      if (!orderRowsExist) {
        console.log(`[${TC005(18)}] No order rows present (No Record Found):`, await noRecord.isVisible().catch(() => false));
        console.log(`[${TC005(18)}] Withdrawal correctly NOT recorded — pass.`);
        return;
      }

      await myOrderVerificationPage.waitForOrderRow();
      await myOrderVerificationPage.clickOnDelivery();

      const deliveryCard = page.locator('div.bg-sheengold-ochre').first();
      const deliveryCardVisible = await deliveryCard.isVisible({ timeout: 15_000 }).catch(() => false);

      if (!deliveryCardVisible) {
        console.log(`[${TC005(18)}] No DELIVERY card visible — failed payment did not create a delivery order.`);
        return;
      }

      const cardText = ((await deliveryCard.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const statusBadge = deliveryCard
        .locator('span')
        .filter({ hasText: /^(Pending|Completed|Failed|Processing|Cancelled)$/i })
        .first();
      const cardStatus =
        ((await statusBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
      console.log(`[${TC005(18)}] Latest DELIVERY card status:`, cardStatus || '(unknown)');

      const productInLatestCard = cardText
        .toLowerCase()
        .includes(selectedProductDetails.productName.toLowerCase());
      console.log(
        `[${TC005(18)}] Latest DELIVERY card contains attempted product "${selectedProductDetails.productName}":`,
        productInLatestCard,
      );

      if (productInLatestCard) {
        expect(
          /pending/i.test(cardStatus),
          `Failed payment must NOT create a Pending delivery for "${selectedProductDetails.productName}" (actual status: "${cardStatus || 'N/A'}")`,
        ).toBe(false);
      }
    });
  });
});
