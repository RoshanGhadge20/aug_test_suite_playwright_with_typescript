import { test, expect } from '../../../fixtures/base.fixture';

const TC_ID = 'TC_WITHDRAWAL_008';

test.describe('TC_WITHDRAWAL_008 @customer-flows', () => {
  test('TC_008-Convert to Silver or/Jewellery -Verify No Silver Deduction After Failed Payment During SIP Withdrawal Conversion @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC008 = (n: number): string => `TC008_${n}`;
    const SILVER_PRODUCT = 'Augmont 1GM Silver Coin 999 Purity';

    let sipName = '';
    let selectedSipName = '';
    let selectedSipMetalValue = '';
    let selectedSipMetalValueNumber = 0;
    let selectedSipMetalType: 'Gold' | 'Silver' = 'Silver';
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let currentUrl = '';
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;
    let selectedProductGm = 0;
    let capturedFailureMessage = '';

    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC008(n)}] ${title}`);
    };

    await test.step('TC008_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
      logSub(1, 'Login & Dashboard');
      await page.goto('/dashboard');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireSilver: true }));
      console.log(`[${TC008(1)}] Portfolio Value (Rs):`, portfolioValue);
      console.log(`[${TC008(1)}] Total Gold (g):`, totalGoldBeforePurchase);
      console.log(`[${TC008(1)}] Total Silver (g):`, totalSilverBeforePurchase);
      console.log(`[${TC008(1)}] Gold FD+:`, goldFD);
    });

    await test.step('TC008_2 | SIP — get approved SIP with positive investment', async () => {
      logSub(2, 'Get approved SIP with positive investment');
      await dashboardPage.clickViewAll();
      sipName = await dashboardPage.getApprovedSipNameWithPositiveInvestment();
      console.log('SIP Name:', sipName);
    });

    await test.step('TC008_3 | Withdrawal — open withdrawal options', async () => {
      logSub(3, 'Open withdrawal options');
      await page.goto('/dashboard');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC008_4 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(4, 'Withdrawal options');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC008_5 | Withdrawal — Select Convert to Silver & Jewellery → product list', async () => {
      logSub(5, 'Convert to Silver & Jewellery');
      await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
    });

    await test.step('TC008_6 | Product List — categories, metal path = silver product', async () => {
      logSub(6, 'Product list');
      console.log(
        `[${TC008(6)}] Dashboard snapshot — Total Gold (g):`,
        totalGoldBeforePurchase,
        'Total Silver (g):',
        totalSilverBeforePurchase,
      );
      await withdrawalPage.browseAndSelectCoinProduct(SILVER_PRODUCT, {
        requireSilverInCatalog: true,
        maxAttempts: 3,
      });
    });

    await test.step('TC008_7 | Product Details — name, weight, charges, delivery date', async () => {
      logSub(7, 'Product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      selectedProductGm = withdrawalPage.assertWithdrawalProductDetailsPopulated(selectedProductDetails);
      console.log(`[${TC008(7)}] Product details:`, selectedProductDetails);
    });

    await test.step('TC008_8 | Product Details — Request Delivery (add to cart)', async () => {
      logSub(8, 'Request Delivery');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC008_9 | Cart — single line item after Removing another product from cart', async () => {
      logSub(9, 'Cart details');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before cart.');
      }
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
    });

    await test.step('TC008_10 | Cart — quantity & amount payable vs making charges', async () => {
      logSub(10, 'Cart calculations');
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

    await test.step('TC008_11 | Cart — Select Investments → investment screen', async () => {
      logSub(11, 'Select Investments');
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC008_12 | Investment — capture totals and select SIP', async () => {
      logSub(12, 'Capture totals and select SIP');
      await withdrawalPage.getAndLogInvestmentListSummary();

      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before SIP selection.');
      }
      if (selectedProductGm <= 0) {
        selectedProductGm = withdrawalPage.assertWithdrawalProductDetailsPopulated(selectedProductDetails);
      }
      console.log(`[TC008_PRODUCT_TOTAL_GM] ${selectedProductGm}`);
      const selectedSipDetails = await dashboardPage.deliveryScrollUpAndClickProceedByMatchingSipMetalValue(
        sipName,
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
      console.log(`[TC008_SIP_CARD_GM] ${selectedSipMetalValueNumber}`);
    });

    await test.step('TC008_13 | Investment — verify withdrawal panel values before withdrawal', async () => {
      logSub(13, 'Verify withdrawal panel values');
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
        `[TC008_CORRESPONDING_SIP_REMAINING_GM] ${sipCardData.sipName}: ${sipCardData.remainingValueInGm}`,
      );
      const expectedRemainingAfterEntry = Number((selectedSipMetalValueNumber - selectedProductGm).toFixed(4));
      console.log(`[TC008_EXPECTED_REMAINING_AFTER_ENTRY_GM] ${expectedRemainingAfterEntry}`);
      console.log(`[TC008_ACTUAL_REMAINING_AFTER_ENTRY_GM] ${sipCardData.remainingValueAfterEntryInGm}`);
      expect(sipCardData.remainingValueAfterEntryInGm).toBeCloseTo(expectedRemainingAfterEntry, 4);
      await withdrawalPage.clickDeliveryProceedButton();
    });

    await test.step('TC008_14 | Checkout — same as billing & proceed', async () => {
      logSub(14, 'Address');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
    });

    await test.step('TC008_15 | Checkout — payment summary (total, paid from funds, net payable)', async () => {
      logSub(15, 'Payment summary');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before checkout.');
      }
      await withdrawalPage.validateWithdrawalCheckoutPaymentSummary({
        expectedTotal: selectedProductDetails.makingAndDeliveryChargesAmount,
      });
    });

    await test.step('TC008_16 | Checkout — order details vs product & address', async () => {
      logSub(16, 'Order details on checkout');
      if (!selectedProductDetails || !deliveryInformation) {
        throw new Error('Missing product or delivery info for checkout validation.');
      }
      await withdrawalPage.completeWithdrawalCheckoutWithNetbanking({
        selectedProductDetails,
        deliveryInformation,
        quantity: 1,
      });
    });

    await test.step('TC008_17 | Checkout — payment method & Proceed to Pay', async () => {
      logSub(17, 'Proceed to payment');
      // Covered in TC008_16 via completeWithdrawalCheckoutWithNetbanking
    });

    await test.step('TC008_18 | Payment — netbanking with FAILURE in demo bank popup; capture failure message', async () => {
      logSub(18, 'Payment FAILURE');
      if (!selectedProductDetails) {
        throw new Error('Selected product details missing before payment.');
      }

      capturedFailureMessage = await paymentPage.validateAndFailWithdrawalNetbankingPayment(
        selectedProductDetails.makingAndDeliveryChargesAmount,
        'HDFC Bank',
        { logLabel: TC008(18) },
      );
      console.log(`[${TC008(18)}] Captured failure message:`, capturedFailureMessage || '(none)');

      const failurePatterns =
        /payment\s*(?:was\s*)?(?:failed|unsuccessful|not\s*(?:completed|successful))|payment\s*could\s*not\s*be\s*completed|transaction\s*(?:has\s*)?failed|something\s*went\s*wrong|payment\s*(?:has\s*)?failed/i;
      expect(capturedFailureMessage, 'Captured failure message must not be empty').not.toBe('');
      expect(capturedFailureMessage).toMatch(failurePatterns);
    });

    await test.step('TC008_19 | Dashboard — silver balance UNCHANGED (withdrawal not succeeded)', async () => {
      logSub(19, 'Dashboard silver unchanged');
      if (selectedProductGm <= 0) {
        throw new Error(`selectedProductGm missing for silver balance check: ${selectedProductGm}`);
      }
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/i);
      const totalSilverAfter = await dashboardPage.getTotalSilverValue();
      console.log(
        `[${TC008(19)}] Total Silver before:`,
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

    await test.step('TC008_20 | My orders — no NEW Pending DELIVERY for this product (withdrawal not recorded as success)', async () => {
      logSub(20, 'My orders — no successful Pending delivery for failed payment');
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
        console.log(`[${TC008(20)}] No order rows present (No Record Found):`, await noRecord.isVisible().catch(() => false));
        console.log(`[${TC008(20)}] Withdrawal correctly NOT recorded — pass.`);
        return;
      }

      await myOrderVerificationPage.waitForOrderRow();
      await myOrderVerificationPage.clickOnDelivery();

      const deliveryCard = page.locator('div.bg-sheengold-ochre').first();
      const deliveryCardVisible = await deliveryCard.isVisible({ timeout: 15_000 }).catch(() => false);

      if (!deliveryCardVisible) {
        console.log(`[${TC008(20)}] No DELIVERY card visible — failed payment did not create a delivery order.`);
        return;
      }

      const cardText = ((await deliveryCard.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const statusBadge = deliveryCard
        .locator('span')
        .filter({ hasText: /^(Pending|Completed|Failed|Processing|Cancelled)$/i })
        .first();
      const cardStatus =
        ((await statusBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
      console.log(`[${TC008(20)}] Latest DELIVERY card status:`, cardStatus || '(unknown)');

      const productInLatestCard = cardText
        .toLowerCase()
        .includes(selectedProductDetails.productName.toLowerCase());
      console.log(
        `[${TC008(20)}] Latest DELIVERY card contains attempted product "${selectedProductDetails.productName}":`,
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
