import { test, expect } from '../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

const TC_ID = 'TC_WITHDRAWAL_016';

test.describe('TC_WITHDRAWAL_016 @customer-flows', () => {
  /**
   * Checkout delivery address — TC id is TC_016 because TC_014 is reserved for silver vault bank withdrawal.
   */
  test('TC_016-Verify delivery address section on the checkout page in withdrawal flow @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
  }) => {
    test.setTimeout(300_000);
    const TC016_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
    /** Manual shipping data (must match state ↔ pincode rules in the app). */
    const manualAddress = {
      firstName: 'Augmont',
      lastName: 'QA Delivery',
      address: 'Bandra Kurla Complex Plot C',
      pincode: '400051',
      stateOptionLabel: 'Maharashtra',
      cityOptionLabel: 'Mumbai',
    } as const;
    /** Checkout billing card uses single full name + mobile (`#name`, `#mobileNumber`). */
    const billingFullName = `${manualAddress.firstName} ${manualAddress.lastName}`.trim();
    const billingMobile = '9876543210';
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
    const TC016 = (n: number): string => `TC016_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC016(n)}] ${title}`);
    };

    await test.step('TC016_1 | Get and validate portfolio values', async () => {
      logSub(1, 'Get and validate portfolio values');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireSilver: false }));
    });

    await test.step('TC016_2 | Withdrawal — open withdrawal options', async () => {
      logSub(2, 'Open withdrawal options');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC016_3 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(3, 'Withdrawal options — Get Coins and Bars');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC016_4 | Verify product list and select product', async () => {
      logSub(4, 'Verify product list is available and select product');
      console.log(`[${TC016(4)}] Product selected from withdrawal workbook:`, TC016_PRODUCT_NAME);
      await withdrawalPage.browseAndSelectCoinProduct(TC016_PRODUCT_NAME, { maxAttempts: 3 });
    });

    await test.step('TC016_5 | Get product details and Request Delivery', async () => {
      logSub(5, 'Get and validate product details');
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      console.log(selectedProductDetails);
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC016_6 | Verify cart details', async () => {
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

    await test.step('TC016_7 | Investment summary — required vs available metal', async () => {
      logSub(7, 'Verify investment details before withdrawal');
      const investmentSummary = await withdrawalPage.getAndLogInvestmentListSummary();
      investmentListTotalGoldRequired = investmentSummary.goldRequired;
    });

    await test.step('TC016_8 | Gold Vault card totals before withdrawal', async () => {
      logSub(8, 'Verify Vault card value before withdrawal');
      const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
      beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
      beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
      console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
      console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);
    });

    await test.step('TC016_9 | Enter valid gold quantity for delivery', async () => {
      logSub(9, 'Validate quantity against Total Gold Required and proceed');
      withdrawalPage.assertGoldVaultMeetsRequiredGold({
        vaultTotalGold: beforeWithdrawalVaultTotalGold,
        goldRequired: investmentListTotalGoldRequired,
        stepLabel: TC016(9),
      });
      validQty = await withdrawalPage.validateGoldVaultQuantityBoundariesAndSetValid({
        goldRequired: investmentListTotalGoldRequired,
        remainingGoldBefore: beforeWithdrawalVaultRemainingGold,
        stepLabel: TC016(9),
      });
    });

    await test.step('TC016_10 | Open delivery address form', async () => {
      logSub(10, 'Proceed from delivery summary to address fields');
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
    });

    await test.step('TC016_11 | Withdraw — fill delivery row + billing card (Proceed stays disabled until billing is valid)', async () => {
      logSub(11, 'Delivery row then billing (#name, #mobileNumber, …) — same screen as Delivery Information tab');
      await withdrawalPage.fillManualDeliveryAddress({
        firstName: manualAddress.firstName,
        lastName: manualAddress.lastName,
        address: manualAddress.address,
        pincode: manualAddress.pincode,
        stateOptionLabel: manualAddress.stateOptionLabel,
        cityOptionLabel: manualAddress.cityOptionLabel,
      });
      await withdrawalPage.scrollCheckoutBillingSectionIntoView();
      await withdrawalPage.fillCheckoutBillingAddress({
        fullName: billingFullName,
        mobile: billingMobile,
        address: manualAddress.address,
        pincode: manualAddress.pincode,
        stateOptionLabel: manualAddress.stateOptionLabel,
        cityOptionLabel: manualAddress.cityOptionLabel,
      });
      await withdrawalPage.settleMs(400);
    });

    await test.step('TC016_12 | Capture delivery snapshot and navigate to checkout', async () => {
      logSub(12, 'Proceed to checkout');
      deliveryInformation = await withdrawalPage.getAndLogDeliveryInformation();
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.expectCheckoutDeliveryOrAddressUrl();
    });

    await test.step(
      'TC016_13 | Checkout billing — click each textbox, Tab (blur), read & print field errors',
      async () => {
        logSub(13, 'Edit form: clear billing text fields → click each input → Tab → inline errors');
        await withdrawalPage.checkoutPageClickEditDeliveryAddress();
        await withdrawalPage.scrollCheckoutBillingSectionIntoView();
        await withdrawalPage.logCheckoutBillingValidationAfterTabThrough({ logPrefix: TC016(13) });

        await withdrawalPage.fillCheckoutBillingAddress({
          fullName: billingFullName,
          mobile: billingMobile,
          address: manualAddress.address,
          pincode: manualAddress.pincode,
          stateOptionLabel: manualAddress.stateOptionLabel,
          cityOptionLabel: manualAddress.cityOptionLabel,
        });
        await withdrawalPage.settleMs(400);
        await withdrawalPage.clickDeliveryProceedButton();
        await withdrawalPage.settleMs(600);
      },
    );

    await test.step('TC016_14 | Checkout — To Deliver At matches manual delivery info', async () => {
      logSub(14, 'Verify delivery address section on checkout page');
      if (!deliveryInformation) {
        throw new Error('Delivery information was not captured before checkout validation.');
      }
      await withdrawalPage.checkoutPageClickSummaryTab();
      await withdrawalPage.expectCheckoutToDeliverAtHeadingVisible({ timeoutMs: 15_000 });
      const checkoutDeliverySnapshot = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay();
      await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(
        {
          ...deliveryInformation,
          // Summary line reflects billing full name after TC016_13 save, not profile delivery-row names.
          firstName: manualAddress.firstName,
          lastName: manualAddress.lastName,
        },
        { prefetchedDisplay: checkoutDeliverySnapshot },
      );
    });
  });
});
