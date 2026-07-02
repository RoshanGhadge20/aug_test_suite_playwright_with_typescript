import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

const TC_ID = 'TC_Withdrawal_ConvertToProduct_007';

test.describe('TC_Withdrawal_ConvertToProduct_007 @customer-flows', () => {
  /**
   * After checkout loads, open **Edit**, change the address in the form, save, then confirm **Summary → To Deliver At**
   * shows the new line (and no longer the pre-edit line).
   */
  test('TC_007-Verify delivery address on checkout summary after editing delivery information @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
  }) => {
    test.setTimeout(300_000);
    const TC007_PRODUCT_NAME = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';
    const manualAddress = {
      firstName: 'Augmont',
      lastName: 'QA Delivery',
      address: 'Bandra Kurla Complex Plot C',
      pincode: '400051',
      stateOptionLabel: 'Maharashtra',
      cityOptionLabel: 'Mumbai',
    } as const;
    /** Same pin/state/city; new street line to prove Summary picked up the edit. */
    const editedManualAddress = {
      ...manualAddress,
      address: 'Worli Sea Face Road Plot D',
    } as const;
    const billingFullName = `${manualAddress.firstName} ${manualAddress.lastName}`.trim();
    const billingMobile = '9876543210';
    let portfolioValue = 0;
    let totalGoldBeforePurchase = 0;
    let totalSilverBeforePurchase = 0;
    let goldFD = '';
    let investmentListTotalGoldRequired = 0;
    let beforeWithdrawalVaultTotalGold = 0;
    let beforeWithdrawalVaultRemainingGold = 0;
    let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null = null;
    const TC007 = (n: number): string => `TC007_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC007(n)}] ${title}`);
    };

    await test.step('TC007_1 | Get and validate portfolio values', async () => {
      logSub(1, 'Get and validate portfolio values');
      ({ portfolioValue, totalGold: totalGoldBeforePurchase, totalSilver: totalSilverBeforePurchase, goldFD } =
        await dashboardPage.captureWithdrawalDashboardSnapshot({ requireSilver: false }));
    });

    await test.step('TC007_2 | Withdrawal — open withdrawal options', async () => {
      logSub(2, 'Open withdrawal options');
      await dashboardPage.clickWithdrawInvestment();
    });

    await test.step('TC007_3 | Withdrawal — Get Coins and Bars / Get Cash options visible', async () => {
      logSub(3, 'Withdrawal options — Get Coins and Bars');
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
    });

    await test.step('TC007_4 | Verify product list and select product', async () => {
      logSub(4, 'Verify product list is available and select product');
      console.log(`[${TC007(4)}] Product selected from withdrawal workbook:`, TC007_PRODUCT_NAME);
      await withdrawalPage.browseAndSelectCoinProduct(TC007_PRODUCT_NAME, { maxAttempts: 3 });
      await withdrawalPage.waitForProductDetailsPage();
    });

    await test.step('TC007_5 | Get product details and Request Delivery', async () => {
      logSub(5, 'Get and validate product details');
      await withdrawalPage.waitForProductDetailsPage();
      selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      console.log(selectedProductDetails);
      await withdrawalPage.clickRequestDelivery();
    });

    await test.step('TC007_6 | Verify cart details', async () => {
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

    await test.step('TC007_7 | Investment summary — required vs available metal', async () => {
      logSub(7, 'Verify investment details before withdrawal');
      const investmentSummary = await withdrawalPage.getAndLogInvestmentListSummary();
      investmentListTotalGoldRequired = investmentSummary.goldRequired;
    });

    await test.step('TC007_8 | Gold Vault card totals before withdrawal', async () => {
      logSub(8, 'Verify Vault card value before withdrawal');
      const beforeWithdrawalVaultTotals = await withdrawalPage.getGoldVaultCardTotals();
      beforeWithdrawalVaultTotalGold = beforeWithdrawalVaultTotals.totalGold;
      beforeWithdrawalVaultRemainingGold = beforeWithdrawalVaultTotals.remainingGold;
      console.log('beforeWithdrawalVaultTotalGold:', beforeWithdrawalVaultTotalGold);
      console.log('beforeWithdrawalVaultRemainingGold:', beforeWithdrawalVaultRemainingGold);
    });

    await test.step('TC007_9 | Enter valid gold quantity for delivery', async () => {
      logSub(9, 'Validate quantity against Total Gold Required and proceed');
      withdrawalPage.assertGoldVaultMeetsRequiredGold({
        vaultTotalGold: beforeWithdrawalVaultTotalGold,
        goldRequired: investmentListTotalGoldRequired,
        stepLabel: TC007(9),
      });
      await withdrawalPage.validateGoldVaultQuantityBoundariesAndSetValid({
        goldRequired: investmentListTotalGoldRequired,
        remainingGoldBefore: beforeWithdrawalVaultRemainingGold,
        stepLabel: TC007(9),
      });
    });

    await test.step('TC007_10 | Open delivery address form', async () => {
      logSub(10, 'Proceed from delivery summary to address fields');
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
    });

    await test.step('TC007_11 | Fill initial delivery row + billing (pre-edit address)', async () => {
      logSub(11, 'Delivery row then billing — initial Bandra Kurla address');
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

    await test.step('TC007_12 | Capture delivery snapshot and navigate to checkout', async () => {
      logSub(12, 'Proceed to checkout');
      await withdrawalPage.getAndLogDeliveryInformation();
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.expectCheckoutDeliveryOrAddressUrl();
    });

    await test.step('TC007_13 | Checkout — Edit and replace address in form', async () => {
      logSub(13, 'Edit on checkout, set Worli address on delivery row + billing, Proceed');
      await withdrawalPage.checkoutPageClickEditDeliveryAddress();
      await withdrawalPage.scrollCheckoutBillingSectionIntoView();
      const deliveryRow = withdrawalPage.getDeliveryAddressFormSection();
      if (await deliveryRow.isVisible().catch(() => false)) {
        const addrInput = deliveryRow.locator('#address').first();
        if (await addrInput.isVisible().catch(() => false)) {
          if (await addrInput.isEnabled().catch(() => false)) {
            await addrInput.fill(editedManualAddress.address);
          }
        }
      }
      await withdrawalPage.fillCheckoutBillingAddress({
        fullName: billingFullName,
        mobile: billingMobile,
        address: editedManualAddress.address,
        pincode: editedManualAddress.pincode,
        stateOptionLabel: editedManualAddress.stateOptionLabel,
        cityOptionLabel: editedManualAddress.cityOptionLabel,
      });
      await withdrawalPage.settleMs(400);
      await withdrawalPage.clickDeliveryProceedButton();
      await withdrawalPage.settleMs(600);
    });

    await test.step('TC007_14 | Summary — To Deliver At shows edited address', async () => {
      logSub(14, 'Verify Summary tab reflects new address and not the original line');
      await withdrawalPage.checkoutPageClickSummaryTab();
      await withdrawalPage.expectCheckoutToDeliverAtHeadingVisible({ timeoutMs: 15_000 });
      const checkoutDeliverySnapshot = await withdrawalPage.checkoutPageGetAndLogDeliveryAddressDisplay();
      const normalizeAddr = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
      expect(normalizeAddr(checkoutDeliverySnapshot.addressBodyNormalized)).toContain(
        normalizeAddr(editedManualAddress.address),
      );
      expect(normalizeAddr(checkoutDeliverySnapshot.addressBodyNormalized)).not.toContain(
        normalizeAddr(manualAddress.address),
      );
      await withdrawalPage.checkoutPageValidateDeliveryAddressAgainstDeliveryInfo(
        {
          firstName: manualAddress.firstName,
          lastName: manualAddress.lastName,
          address: editedManualAddress.address,
          pincode: editedManualAddress.pincode,
          state: editedManualAddress.stateOptionLabel,
          cityOrDistrict: editedManualAddress.cityOptionLabel,
        },
        { prefetchedDisplay: checkoutDeliverySnapshot },
      );
    });
  });
});
