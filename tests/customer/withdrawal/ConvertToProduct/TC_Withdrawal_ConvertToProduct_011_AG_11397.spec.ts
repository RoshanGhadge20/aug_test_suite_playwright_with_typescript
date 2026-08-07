import { test, expect } from '../../../../fixtures/base.fixture';

const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';
const ORDER_QUANTITY = 2;

const deliveryAddress = {
  firstName: 'Augmont',
  lastName: 'QA Delivery',
  address: 'Bandra Kurla Complex Plot C',
  pincode: '400051',
  stateOptionLabel: 'Maharashtra',
  cityOptionLabel: 'Mumbai',
} as const;

test.describe('TC_Withdrawal_ConvertToProduct_011 @customer-flows', () => {
  test(
    'TC_011-Verify cart quantity 2 for a single product scales making charges, payment, and delivery deduction correctly',
    async ({ page, dashboardPage, withdrawalPage, paymentPage, myOrderVerificationPage }) => {
      test.setTimeout(300_000);

      const TC011 = (n: number): string => `TC011_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC011(n)}] ${title}`);
      };

      let totalSilverBefore = 0;
      let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null =
        null;
      let productGm = 0;
      let expectedTotalCharges = 0;

      await test.step(
        'TC011_1 | Login & Dashboard — capture total silver',
        async () => {
          logSub(1, 'Login & Dashboard');
          await page.goto('/dashboard');
          ({ totalSilver: totalSilverBefore } = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          }));
          console.log(`[${TC011(1)}] Total Silver Before:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC011_2 | Select silver coin product and add to cart',
        async () => {
          logSub(2, 'Select silver coin product and add to cart');
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.openConvertToCoinsAndBarsProductList();
          await withdrawalPage.selectCoinCategoryIfNotSelected();
          await withdrawalPage.browseAndSelectCoinProduct(SILVER_PRODUCT_NAME, {
            requireSilverInCatalog: true,
          });

          selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
          console.log('Product details:', selectedProductDetails);

          await withdrawalPage.clickRequestDelivery();
          await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
        },
      );

      await test.step(
        'TC011_3 | Increase cart quantity to 2 and validate scaled amount payable',
        async () => {
          logSub(3, 'Increase cart quantity to 2 and validate scaled amount payable');
          if (!selectedProductDetails) {
            throw new Error('Selected product details missing before cart quantity change.');
          }

          await withdrawalPage.increaseSelectedProductQuantityInCart(
            selectedProductDetails.productName,
            ORDER_QUANTITY,
          );

          const cartQuantity = await withdrawalPage.getSelectedProductQuantityInCart(
            selectedProductDetails.productName,
          );
          expect(cartQuantity).toBe(ORDER_QUANTITY);

          expectedTotalCharges = selectedProductDetails.makingAndDeliveryChargesAmount * ORDER_QUANTITY;

          const totalAmountPayable = await withdrawalPage.getCartTotalAmountPayable();
          console.log(`[${TC011(3)}] Total amount payable:`, totalAmountPayable, 'expected:', expectedTotalCharges);

          expect(totalAmountPayable).toBe(expectedTotalCharges);
        },
      );

      await test.step(
        'TC011_4 | Fund order via Silver SIP for quantity 2',
        async () => {
          logSub(4, 'Fund order via Silver SIP for quantity 2');
          if (!selectedProductDetails) {
            throw new Error('Selected product details missing before investment selection.');
          }

          await withdrawalPage.clickSelectInvestments();

          const singleUnitGm = Number((selectedProductDetails.productWeight.match(/[\d.]+/)?.[0] ?? '0').trim());
          expect(singleUnitGm, 'Selected product weight must be a positive number.').toBeGreaterThan(0);
          productGm = Number((singleUnitGm * ORDER_QUANTITY).toFixed(4));

          const sipEntry = await withdrawalPage.enterQuantityInFirstSipCard(productGm, {
            metalType: 'Silver',
          });
          console.log('SIP entry:', sipEntry);

          await withdrawalPage.clickDeliveryProceedButton();
          await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
        },
      );

      await test.step(
        'TC011_5 | Fill delivery address, select same-as-billing, and proceed to checkout',
        async () => {
          logSub(5, 'Fill delivery address, select same-as-billing, and proceed to checkout');

          await withdrawalPage.fillManualDeliveryAddress(deliveryAddress);
          await withdrawalPage.settleMs(500);
          await withdrawalPage.clickSameAsBillingAddressCheckbox();
          await withdrawalPage.settleMs(500);

          const proceeded = await withdrawalPage.clickDeliveryProceedButtonIfEnabled();
          expect(proceeded).toBe(true);
          await expect(page).toHaveURL(/\/withdraw\/product-list\/checkout$/);
        },
      );

      await test.step(
        'TC011_6 | Validate checkout payment summary reflects charges x 2 and select Netbanking',
        async () => {
          logSub(6, 'Validate checkout payment summary reflects charges x 2 and select Netbanking');

          await withdrawalPage.checkoutPageValidatePaymentSummaryAgainstMakingCharges(expectedTotalCharges);

          await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
          await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
          await withdrawalPage.checkoutPageClickProceedToPay();
        },
      );

      await test.step(
        'TC011_7 | Complete netbanking payment',
        async () => {
          logSub(7, 'Complete netbanking payment');
          await paymentPage.validateAndCompleteWithdrawalNetbankingPayment(expectedTotalCharges, 'HDFC Bank', {
            logLabel: TC011(7),
          });
        },
      );

      await test.step(
        'TC011_8 | Dashboard — silver balance decreased by quantity x weight',
        async () => {
          logSub(8, 'Dashboard silver balance update');
          await page.goto('/dashboard');
          await expect(page).toHaveURL(/dashboard/i);

          const totalSilverAfter = await dashboardPage.getTotalSilverValue();
          const expectedSilverAfter = Number((totalSilverBefore - productGm).toFixed(4));

          console.log(`[${TC011(8)}] Total Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);

          expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
        },
      );

      await test.step(
        'TC011_9 | My orders — delivery card shows quantity 2',
        async () => {
          logSub(9, 'My orders delivery card shows quantity 2');
          if (!selectedProductDetails) {
            throw new Error('Selected product details missing before my-orders validation.');
          }

          // My Orders lands on the BUY tab by default; the Convert-to-Product delivery
          // order only becomes reachable after switching to the SELL tab.
          await myOrderVerificationPage.goToMyOrders();
          await myOrderVerificationPage.clickSellTab();
          await myOrderVerificationPage.waitForOrderRow();
          await myOrderVerificationPage.clickOnDelivery();
          await myOrderVerificationPage.waitForProductOrderCard();
          // The delivery order card shows the making/delivery charge x quantity (same total
          // already validated against the checkout summary and payment amount above).
          await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
            productName: selectedProductDetails.productName,
            productWeight: selectedProductDetails.productWeight,
            quantity: ORDER_QUANTITY,
            expectedAmount: expectedTotalCharges,
          });
        },
      );
    },
  );
});
