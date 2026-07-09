import { test, expect } from '../../../../fixtures/base.fixture';

const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';

test.describe('TC_Withdrawal_ConvertToProduct_009 @customer-flows', () => {
  test(
    'TC_009-Verify closing the payment popup without completing payment creates no order and leaves balance unchanged',
    async ({
      page,
      dashboardPage,
      withdrawalPage,
      paymentPage,
      myOrderVerificationPage,
    }) => {
      test.setTimeout(240_000);

      const TC009 = (n: number): string => `TC009_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC009(n)}] ${title}`);
      };

      let totalSilverBefore = 0;
      let deliveryOrderCountBefore = 0;
      let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null =
        null;
      let productGm = 0;

      await test.step(
        'TC009_1 | Login & Dashboard — capture total silver',
        async () => {
          logSub(1, 'Login & Dashboard');
          await page.goto('/dashboard');
          ({ totalSilver: totalSilverBefore } = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          }));
          console.log(`[${TC009(1)}] Total Silver Before:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC009_2 | My Orders — capture Delivery order count before the attempt',
        async () => {
          logSub(2, 'Capture Delivery order count before the attempt');
          await myOrderVerificationPage.goToMyOrders();
          await myOrderVerificationPage.clickOnDelivery();
          deliveryOrderCountBefore = await myOrderVerificationPage.getOrderRowCount();
          console.log(`[${TC009(2)}] Delivery order count before:`, deliveryOrderCountBefore);
        },
      );

      await test.step(
        'TC009_3 | Select silver coin product and add to cart',
        async () => {
          logSub(3, 'Select silver coin product and add to cart');
          await dashboardPage.goto('/dashboard');
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
        'TC009_4 | Fund order via Silver SIP and proceed to checkout',
        async () => {
          logSub(4, 'Fund order via Silver SIP and proceed to checkout');
          if (!selectedProductDetails) {
            throw new Error('Selected product details missing before investment selection.');
          }

          await withdrawalPage.clickSelectInvestments();

          productGm = Number((selectedProductDetails.productWeight.match(/[\d.]+/)?.[0] ?? '0').trim());
          expect(productGm, 'Selected product weight must be a positive number.').toBeGreaterThan(0);

          const sipEntry = await withdrawalPage.enterQuantityInFirstSipCard(productGm, {
            metalType: 'Silver',
          });
          console.log('SIP entry:', sipEntry);

          await withdrawalPage.clickDeliveryProceedButton();
          await withdrawalPage.proceedThroughDeliveryWithSameBillingAddress();
        },
      );

      await test.step(
        'TC009_5 | Select Netbanking and open the Razorpay payment popup',
        async () => {
          logSub(5, 'Select Netbanking and open the Razorpay payment popup');
          await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
          await withdrawalPage.checkoutPageSelectPaymentTypeNetbanking();
          await withdrawalPage.checkoutPageClickProceedToPay();
        },
      );

      await test.step(
        'TC009_6 | Abandon payment by closing the popup instead of completing it',
        async () => {
          logSub(6, 'Abandon payment by closing the popup instead of completing it');
          const popupClosed = await paymentPage.abandonWithdrawalPaymentByClosingPopup('HDFC Bank');
          expect(popupClosed, 'Demo-bank payment popup must appear and be closed for this test to be valid.').toBe(
            true,
          );
        },
      );

      await test.step(
        'TC009_7 | Validate no new Delivery order was created',
        async () => {
          logSub(7, 'Validate no new Delivery order was created');
          await myOrderVerificationPage.goToMyOrders();
          await myOrderVerificationPage.clickOnDelivery();
          const deliveryOrderCountAfter = await myOrderVerificationPage.getOrderRowCount();

          console.log(`[${TC009(7)}] Delivery order count before/after:`, deliveryOrderCountBefore, deliveryOrderCountAfter);

          expect(deliveryOrderCountAfter).toBe(deliveryOrderCountBefore);

          const hasPendingOrderForProduct = await myOrderVerificationPage.hasPendingOrderRowForProduct(
            SILVER_PRODUCT_NAME,
          );

          console.log(`[${TC009(7)}] Pending order row found for "${SILVER_PRODUCT_NAME}":`, hasPendingOrderForProduct);

          expect(
            hasPendingOrderForProduct,
            `Abandoning the payment popup must not create a Pending order for "${SILVER_PRODUCT_NAME}".`,
          ).toBe(false);
        },
      );

      await test.step(
        'TC009_8 | Validate dashboard total silver is unchanged',
        async () => {
          logSub(8, 'Validate dashboard total silver is unchanged');
          await page.goto('/dashboard');
          const dashboardAfter = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          });

          console.log(`[${TC009(8)}] Total Silver Before/After:`, totalSilverBefore, dashboardAfter.totalSilver);

          expect(dashboardAfter.totalSilver).toBeCloseTo(totalSilverBefore, 4);
        },
      );
    },
  );
});
