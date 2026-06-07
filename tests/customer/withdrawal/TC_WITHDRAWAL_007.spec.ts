import { test, expect } from '../../../fixtures/base.fixture';

const TC_ID = 'TC_WITHDRAWAL_007';

test.describe('TC_WITHDRAWAL_007 @customer-flows', () => {
  test('TC_007 - Convert into Gold/Jewellery — gold + silver in cart; withdraw from Gold Vault and Silver Vault @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
    paymentPage,
    myOrderVerificationPage,
  }) => {
    test.setTimeout(360_000);

    const TC007 = (n: number): string => `TC007_${n}`;
    const GOLD_PRODUCT_NAME = 'Augmont Classic Om Pendant';
    const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';
    let SELECTED_GOLD_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Jewellery';
    const SILVER_PRODUCT_TYPE: 'Coin' | 'Jewellery' = 'Coin';

    let portfolioValue = 0;
    let totalGoldBefore = 0;
    let totalSilverBefore = 0;
    let goldProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let silverProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    let deliveryInformation: Awaited<ReturnType<typeof withdrawalPage.getAndLogDeliveryInformation>> | null = null;

    let requiredGold = 0;
    let requiredSilver = 0;
    let availableGold = 0;
    let availableSilver = 0;
    let beforeRemainingGold = 0;
    let beforeRemainingSilver = 0;
    let validGoldInput = 0;
    let validSilverInput = 0;

    type CartItemDetails = {
      productName: string;
      productWeight: string;
      quantity: number;
      pricePerItem: number;
    };
    let cartItems: CartItemDetails[] = [];
    let cartTotalAmountPayable = 0;

    const captureCartItemDetails = async (productName: string): Promise<CartItemDetails> => {
      const cardLocator = page
        .locator('div.border.border-sheengold.rounded-2xl.p-4.mb-4')
        .filter({
          has: page.locator('div.text-20.text-darkgunmetal.font-cabinetgroteskextrabold', {
            hasText: productName,
          }),
        })
        .first();
      await cardLocator.waitFor({ state: 'visible', timeout: 15_000 });

      const titleText = (
        (await cardLocator
          .locator('div.text-20.text-darkgunmetal.font-cabinetgroteskextrabold')
          .first()
          .textContent()) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();

      const cardText = ((await cardLocator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const priceMatches = [...cardText.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)];
      if (priceMatches.length === 0) {
        throw new Error(`No ₹ price found on cart card for "${productName}". Card text: ${cardText}`);
      }
      const lastPriceText = priceMatches[priceMatches.length - 1][1];
      const pricePerItem = Number(lastPriceText.replace(/,/g, ''));

      const weightMatch = cardText.match(/([\d.]+)\s*gm[s]?/i);
      const productWeight = weightMatch ? `${weightMatch[1]}gm` : '';

      const quantity = await withdrawalPage.getSelectedProductQuantityInCart(productName);

      return { productName: titleText, productWeight, quantity, pricePerItem };
    };

    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC007(n)}] ${title}`);
    };

    const parseFirstNumber = (value: string): number => Number((value.match(/[\d.]+/)?.[0] ?? '0').trim());

    const combinedMakingChargesAmount = (): number => {
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Gold/silver product details missing for combined charges.');
      }
      return Number(
        (
          goldProductDetails.makingAndDeliveryChargesAmount + silverProductDetails.makingAndDeliveryChargesAmount
        ).toFixed(2),
      );
    };

    await test.step('TC007_1 | Login & Dashboard — capture portfolio, total gold, total silver', async () => {
      logSub(1, 'Login & Dashboard');
      await page.goto('/dashboard');
      ({ portfolioValue, totalGold: totalGoldBefore, totalSilver: totalSilverBefore } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireGoldFd: false }));
      console.log(`[${TC007(1)}] Portfolio Value:`, portfolioValue);
      console.log(`[${TC007(1)}] Total Gold:`, totalGoldBefore);
      console.log(`[${TC007(1)}] Total Silver:`, totalSilverBefore);
    });


    await test.step('TC007_4 | Withdrawal — Withdraw deposit & Convert into Gold/Jewellery options visible', async () => {
      logSub(4, 'Withdrawal options');
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC007_5 | Withdrawal — Select Convert to Gold/Jewellery → product list', async () => {
      logSub(5, 'Convert to Gold/Jewellery');
     // await withdrawalPage.clickProceedForConvertGoldJewellery();
      await expect(page).toHaveURL(/\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i);
    });

    await test.step('TC007_6 | Product List — categories and dashboard snapshot', async () => {
      logSub(6, 'Product list');
      console.log(
        `[${TC007(6)}] Dashboard snapshot — Total Gold (g):`,
        totalGoldBefore,
        'Total Silver (g):',
        totalSilverBefore,
      );
      const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    await test.step('TC007_7 | Product List — metal path: gold jewellery first, then silver coin', async () => {
      logSub(7, 'Metal / product plan');
      console.log(`[${TC007(7)}] Gold product: ${GOLD_PRODUCT_NAME} (${SELECTED_GOLD_PRODUCT_TYPE})`);
      console.log(`[${TC007(7)}] Silver product: ${SILVER_PRODUCT_NAME} (${SILVER_PRODUCT_TYPE})`);
    });

    await test.step('TC007_8 | Product List — select gold jewellery product', async () => {
      logSub(8, 'Select gold jewellery');
      await withdrawalPage.selectJewelleryProductWithRetry(GOLD_PRODUCT_NAME, SELECTED_GOLD_PRODUCT_TYPE);
    });

    await test.step('TC007_9 | Product Details (gold) — name, weight, charges, delivery date', async () => {
      logSub(9, 'Gold product details');
      goldProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      withdrawalPage.assertWithdrawalProductDetailsPopulated(goldProductDetails);
      const goldGm = Number((goldProductDetails.productWeight.match(/[\d.]+/)?.[0] ?? '0').trim());
      console.log(`[${TC007(9)}] Gold product grams:`, goldGm);
    });

    await test.step('TC007_10 | Product Details (gold) — Request Delivery (first line in cart)', async () => {
      logSub(10, 'Request Delivery (gold)');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC007_11 | Product List — add silver coin (second line in cart)', async () => {
      logSub(11, 'Return to product list & select silver');
      await withdrawalPage.selectCoinProductWithRetry(SILVER_PRODUCT_NAME, SILVER_PRODUCT_TYPE);
    });

    await test.step('TC007_12 | Product Details (silver) — name, weight, charges, delivery date', async () => {
      logSub(12, 'Silver product details');
      silverProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      withdrawalPage.assertWithdrawalProductDetailsPopulated(silverProductDetails);
      const silverGm = Number((silverProductDetails.productWeight.match(/[\d.]+/)?.[0] ?? '0').trim());
      console.log(`[${TC007(12)}] Silver product grams:`, silverGm);
    });

    await test.step('TC007_13 | Product Details (silver) — Request Delivery', async () => {
      logSub(13, 'Request Delivery (silver)');
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC007_14 | Cart — multiple products (Gold + Silver) total quantity 2 (reduce each by one if total > 2)', async () => {
      logSub(14, 'Cart details (Gold + Silver, total qty = 2)');
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Product details missing before cart validation.');
      }
      await withdrawalPage.normalizeCartToTwoProducts(
        goldProductDetails.productName,
        silverProductDetails.productName,
      );
    });

    await test.step('TC007_15 | Cart (Gold + Silver) — quantity/weights/amount payable validation', async () => {
      logSub(15, 'Cart calculations (Gold + Silver)');
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Product details missing before cart totals validation.');
      }
      const goldQty = await withdrawalPage.getSelectedProductQuantityInCart(goldProductDetails.productName);
      const silverQty = await withdrawalPage.getSelectedProductQuantityInCart(silverProductDetails.productName);
      const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
      const expectedAmountPayable =
        goldProductDetails.makingAndDeliveryChargesAmount * goldQty +
        silverProductDetails.makingAndDeliveryChargesAmount * silverQty;
      expect(totalAmountPayable).toBe(expectedAmountPayable);

      const goldCartItem = await captureCartItemDetails(goldProductDetails.productName);
      const silverCartItem = await captureCartItemDetails(silverProductDetails.productName);
      cartItems = [goldCartItem, silverCartItem];
      cartTotalAmountPayable = totalAmountPayable;
      console.log(
        `[${TC007(15)}] Captured cart item details (read from cart UI):\n${JSON.stringify(cartItems, null, 2)}`,
      );
      console.log(`[${TC007(15)}] Cart total amount payable:`, cartTotalAmountPayable);

      expect(goldCartItem.quantity).toBe(goldQty);
      expect(silverCartItem.quantity).toBe(silverQty);
      expect(goldCartItem.pricePerItem).toBe(goldProductDetails.makingAndDeliveryChargesAmount);
      expect(silverCartItem.pricePerItem).toBe(silverProductDetails.makingAndDeliveryChargesAmount);
      expect(cartItems.reduce((sum, line) => sum + line.pricePerItem * line.quantity, 0)).toBe(
        totalAmountPayable,
      );
    });

    await test.step('TC007_16 | Cart — Select Investments → investment screen', async () => {
      logSub(16, 'Select Investments');
      await withdrawalPage.clickSelectInvestments();
    });

    await test.step('TC007_17 | Investment — capture required and available metal values', async () => {
      logSub(17, 'Capture required/available values');
      requiredGold = await withdrawalPage.getInvestmentListTotalGoldRequired();
      requiredSilver = await withdrawalPage.getInvestmentListTotalSilverRequired();
      availableGold = await withdrawalPage.getInvestmentListTotalGoldAvailable();
      availableSilver = await withdrawalPage.getInvestmentListTotalSilverAvailable();
      const goldTotals = await withdrawalPage.getGoldVaultCardTotals();
      const silverTotals = await withdrawalPage.getSilverVaultCardTotals();
      beforeRemainingGold = goldTotals.remainingGold;
      beforeRemainingSilver = silverTotals.remainingSilver;
      console.log(`[${TC007(17)}] Required Gold:`, requiredGold);
      console.log(`[${TC007(17)}] Required Silver:`, requiredSilver);
      console.log(`[${TC007(17)}] Available Gold:`, availableGold);
      console.log(`[${TC007(17)}] Available Silver:`, availableSilver);
      console.log(`[${TC007(17)}] Remaining Gold (before):`, beforeRemainingGold);
      console.log(`[${TC007(17)}] Remaining Silver (before):`, beforeRemainingSilver);
      expect(requiredGold >= 0).toBe(true);
      expect(requiredSilver >= 0).toBe(true);

      const goldVaultSufficient = beforeRemainingGold >= requiredGold;
      const silverVaultSufficient = beforeRemainingSilver >= requiredSilver;
      console.log(
        `[${TC007(17)}] Gold Vault check (remaining >= required):`,
        `${beforeRemainingGold} >= ${requiredGold} -> ${goldVaultSufficient ? 'PASS' : 'FAIL'}`,
      );
      console.log(
        `[${TC007(17)}] Silver Vault check (remaining >= required):`,
        `${beforeRemainingSilver} >= ${requiredSilver} -> ${silverVaultSufficient ? 'PASS' : 'FAIL'}`,
      );

      if (!goldVaultSufficient || !silverVaultSufficient) {
        throw new Error(
          `[${TC007(17)}][FAIL] Insufficient vault value: Gold Vault remaining=${beforeRemainingGold}, Gold required=${requiredGold}, Silver Vault remaining=${beforeRemainingSilver}, Silver required=${requiredSilver}.`,
        );
      }
    });

    await test.step('TC007_18 | Investment — invalid Gold/Silver input keeps Proceed disabled', async () => {
      logSub(18, 'Invalid quantity validation');
      const invalidGoldInput = requiredGold > 0 ? Number(Math.max(0, requiredGold - 0.01).toFixed(4)) : 0;
      const invalidSilverInput = requiredSilver > 0 ? Number(Math.max(0, requiredSilver - 0.01).toFixed(4)) : 0;
      await withdrawalPage.enterQuantity(invalidGoldInput);
      await withdrawalPage.enterQuantityInSilverVault(invalidSilverInput);
      console.log(`[${TC007(18)}] Invalid Gold input:`, invalidGoldInput);
      console.log(`[${TC007(18)}] Invalid Silver input:`, invalidSilverInput);
      const errorText = await withdrawalPage.getQuantityErrorText().catch(() => '');
      console.log(`[${TC007(18)}] Error text:`, errorText);
      if (!errorText) {
        console.log(`[${TC007(18)}] No inline validation text shown; validating via disabled Proceed state.`);
      }
      const isDisabled = await withdrawalPage.isProceedButtonDisabled();
      expect(isDisabled).toBe(true);
    });

    await test.step('TC007_19 | Investment — withdraw from Gold Vault and Silver Vault (valid inputs)', async () => {
      logSub(19, 'Gold vault + Silver vault withdrawal');
      validGoldInput = requiredGold > 0 ? Number(requiredGold.toFixed(4)) : 0;
      validSilverInput = requiredSilver > 0 ? Number(requiredSilver.toFixed(4)) : 0;

      await withdrawalPage.enterQuantity(validGoldInput);
      await withdrawalPage.enterQuantityInSilverVault(validSilverInput);

      console.log(`[${TC007(19)}] Gold withdrawn (Gold Vault):`, validGoldInput);
      console.log(`[${TC007(19)}] Silver withdrawn (Silver Vault):`, validSilverInput);

      const goldAfter = await withdrawalPage.getGoldVaultCardTotals();
      const silverAfter = await withdrawalPage.getSilverVaultCardTotals();
      const expectedGoldRemaining = Number((beforeRemainingGold - validGoldInput).toFixed(4));
      const expectedSilverRemaining = Number((beforeRemainingSilver - validSilverInput).toFixed(4));
      console.log(`[${TC007(19)}] Gold remaining expected/actual:`, expectedGoldRemaining, goldAfter.remainingGold);
      console.log(`[${TC007(19)}] Silver remaining expected/actual:`, expectedSilverRemaining, silverAfter.remainingSilver);
      expect(goldAfter.remainingGold).toBeCloseTo(expectedGoldRemaining, 3);
      expect(silverAfter.remainingSilver).toBeCloseTo(expectedSilverRemaining, 3);
      const isEnabled = await withdrawalPage.isProceedButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    await test.step('TC007_20 | Investment — Proceed to account details/checkout', async () => {
      logSub(20, 'Proceed to checkout');
      await withdrawalPage.clickDeliveryProceedButton();
      await expect(page).toHaveURL(/checkout|address|delivery/i);
    });

    await test.step('TC007_21 | Checkout — same as billing & proceed', async () => {
      logSub(21, 'Address');
      deliveryInformation = await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
    });

    await test.step('TC007_22 | Checkout (Gold + Silver) — payment summary (total, paid from funds, net payable)', async () => {
      logSub(22, 'Payment summary (Gold + Silver combined)');
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Product details missing before checkout.');
      }
      await withdrawalPage.validateWithdrawalCheckoutPaymentSummary({
        expectedTotal: combinedMakingChargesAmount(),
      });
    });

    await test.step('TC007_23 | Checkout (Gold + Silver) — order details vs products & address', async () => {
      logSub(23, 'Order details on checkout (Gold + Silver)');
      if (!goldProductDetails || !silverProductDetails || !deliveryInformation) {
        throw new Error('Missing product or delivery info for checkout validation.');
      }
      const expectedFullName = `${deliveryInformation.firstName} ${deliveryInformation.lastName}`.trim();
      const goldTitlePrefix = goldProductDetails.productName.split('(')[0].trim();
      const silverTitlePrefix = silverProductDetails.productName.split('(')[0].trim();
      await expect(page.getByText(new RegExp(goldTitlePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first()).toBeVisible();
      await expect(page.getByText(new RegExp(silverTitlePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first()).toBeVisible();

      const actualDelivery = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay({ log: false });
      const normalizedAddressBody = actualDelivery.addressBodyNormalized.toLowerCase();
      expect(actualDelivery.contactName.toLowerCase()).toBe(expectedFullName.toLowerCase());
      expect(normalizedAddressBody).toContain(deliveryInformation.address.toLowerCase());
      expect(normalizedAddressBody).toContain(deliveryInformation.cityOrDistrict.toLowerCase());
      expect(normalizedAddressBody).toContain(deliveryInformation.state.toLowerCase());
      expect(normalizedAddressBody).toContain(deliveryInformation.pincode.trim());
    });

    await test.step('TC007_24 | Checkout — payment method & Proceed to Pay', async () => {
      logSub(24, 'Proceed to payment');
      await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
      await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
      await withdrawalPage.checkoutPageClickProceedToPay();
    });

    await test.step('TC007_25 | Payment (Gold + Silver) — complete netbanking with combined amount', async () => {
      logSub(25, 'Payment (Gold + Silver combined)');
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Product details missing before payment.');
      }
      await paymentPage.validateAndCompleteWithdrawalNetbankingPayment(
        combinedMakingChargesAmount(),
        'HDFC Bank',
        { logLabel: TC007(25) },
      );
    });

    await test.step('TC007_26 | Dashboard (Gold + Silver) — gold and silver balance after redeem', async () => {
      logSub(26, 'Dashboard balance update (Gold + Silver)');
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/i);
      const totalGoldAfter = await dashboardPage.getTotalGoldValue();
      const totalSilverAfter = await dashboardPage.getTotalSilverValue();
      const expectedGoldAfter = Number((totalGoldBefore - validGoldInput).toFixed(4));
      const expectedSilverAfter = Number((totalSilverBefore - validSilverInput).toFixed(4));
      console.log(`[${TC007(26)}] Gold before/after/expected:`, totalGoldBefore, totalGoldAfter, expectedGoldAfter);
      console.log(`[${TC007(26)}] Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);
      expect(totalGoldAfter).toBeCloseTo(expectedGoldAfter, 2);
      expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
    });

    await test.step('TC007_27 | My orders (Gold + Silver) — both products on Delivery card with same Transaction Id', async () => {
      logSub(27, 'My orders delivery (Gold + Silver, same Txn Id)');
      if (!goldProductDetails || !silverProductDetails) {
        throw new Error('Product details missing before my-orders validation.');
      }


      await myOrderVerificationPage.goToMyOrders();
      await myOrderVerificationPage.waitForOrderRow();
      await myOrderVerificationPage.clickOnDelivery();
      await myOrderVerificationPage.validateLatestOrderRowStatusPending();

      const deliveryOrderCard = await myOrderVerificationPage.waitForWithdrawalDeliveryOrderCard(60_000);

      const statusBadge = deliveryOrderCard
        .locator('span')
        .filter({ hasText: /^(Pending|Completed|Failed|Processing|Cancelled)$/i })
        .first();
      await statusBadge.waitFor({ state: 'visible', timeout: 15_000 });
      const deliveryStatusText = ((await statusBadge.textContent()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`[${TC007(27)}] Delivery card status (extracted):`, deliveryStatusText);
      expect(deliveryStatusText, 'Delivery card status must be exactly "Pending"').toBe('Pending');

      const productHeadings = deliveryOrderCard.locator('h3');
      await expect(productHeadings).toHaveCount(2, { timeout: 15_000 });

      type CapturedLine = {
        name: string;
        transactionId: string;
        quantity: number;
        price: number;
      };
      const captured: CapturedLine[] = [];
      const headingCount = await productHeadings.count();
      for (let i = 0; i < headingCount; i += 1) {
        const heading = productHeadings.nth(i);
        const block = heading.locator(
          'xpath=ancestor::div[contains(@class,"space-y-2")][1]',
        );

        const name = ((await heading.textContent()) ?? '').replace(/\s+/g, ' ').trim();

        const txnIdText = (
          (await block
            .locator('span')
            .filter({ hasText: /Transaction\s*Id/i })
            .first()
            .locator('xpath=following-sibling::div[1]')
            .textContent()) ?? ''
        )
          .replace(/\s+/g, ' ')
          .trim();

        const qtyText = (
          (await block
            .locator('span')
            .filter({ hasText: /Quanti(?:ty|y)/i })
            .first()
            .locator('xpath=following-sibling::div[1]')
            .textContent()) ?? ''
        ).trim();
        const quantity = Number((qtyText.match(/[\d.]+/)?.[0] ?? '0'));

        const priceText = (
          (await block.locator('p').filter({ hasText: /₹/ }).first().textContent()) ?? ''
        ).trim();
        const price = Number(
          (priceText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''),
        );

        captured.push({ name, transactionId: txnIdText, quantity, price });
      }

      console.log(
        `[${TC007(27)}] Captured delivery cards:\n${JSON.stringify(captured, null, 2)}`,
      );

      if (cartItems.length !== 2) {
        throw new Error(
          `Cart items snapshot missing/invalid before delivery validation. cartItems=${JSON.stringify(cartItems)}`,
        );
      }
      console.log(
        `[${TC007(27)}] Cart item details for hard assertion:\n${JSON.stringify(cartItems, null, 2)}`,
      );

      expect(captured.length, 'Delivery card should have exactly 2 product lines').toBe(2);
      expect(captured[0].transactionId, 'Transaction Id must be present').not.toBe('');
      expect(captured[0].transactionId, 'Both products must share the same Transaction Id').toBe(
        captured[1].transactionId,
      );

      const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
      for (const cartItem of cartItems) {
        const expectedName = normalize(cartItem.productName);
        const matchedLine = captured.find((line) => normalize(line.name).includes(expectedName));
        if (!matchedLine) {
          throw new Error(
            `Cart item "${cartItem.productName}" not found in delivery card. Captured: ${JSON.stringify(captured)}`,
          );
        }
        console.log(`[${TC007(27)}] Cart vs delivery line for "${cartItem.productName}":`, {
          expected: cartItem,
          actual: matchedLine,
        });
        expect(
          normalize(matchedLine.name).includes(expectedName),
          `Delivery card product name should contain cart item "${cartItem.productName}"`,
        ).toBe(true);
        expect(matchedLine.quantity, `Quantity for "${cartItem.productName}" must match cart`).toBe(
          cartItem.quantity,
        );
        expect(matchedLine.price, `Price for "${cartItem.productName}" must match cart making charges`).toBe(
          cartItem.pricePerItem,
        );
      }
    });
  });
});
