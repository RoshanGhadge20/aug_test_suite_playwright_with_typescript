import { test, expect } from '../../../../fixtures/base.fixture';
import { getBuyMetalDataset } from '../../../../utils/data/customer-excel-data';

const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';
const ORDER_QUANTITY = 1;

const deliveryAddress = {
  firstName: 'Augmont',
  lastName: 'QA Delivery',
  address: 'Bandra Kurla Complex Plot C',
  pincode: '400051',
  stateOptionLabel: 'Maharashtra',
  cityOptionLabel: 'Mumbai',
} as const;

test.describe('TC_Withdrawal_ConvertToProduct_012 @customer-flows', () => {
  test(
    'TC_012-Verify Convert-to-Product checkout completes successfully via Card payment',
    async ({ page, dashboardPage, withdrawalPage, paymentPage, myOrderVerificationPage }) => {
      test.setTimeout(240_000);

      const TC012 = (n: number): string => `TC012_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC012(n)}] ${title}`);
      };

      const cardDataset = getBuyMetalDataset();

      let totalSilverBefore = 0;
      let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null =
        null;
      let productGm = 0;

      await test.step(
        'TC012_1 | Login & Dashboard — capture total silver',
        async () => {
          logSub(1, 'Login & Dashboard');
          await page.goto('/dashboard');
          ({ totalSilver: totalSilverBefore } = await dashboardPage.captureWithdrawalDashboardSnapshot({
            requireGoldFd: false,
          }));
          console.log(`[${TC012(1)}] Total Silver Before:`, totalSilverBefore);
        },
      );

      await test.step(
        'TC012_2 | Select silver coin product and add to cart',
        async () => {
          logSub(2, 'Select silver coin product and add to cart');
          await dashboardPage.clickWithdrawInvestment();
          await withdrawalPage.openConvertToCoinsAndBarsProductList();
          await withdrawalPage.selectCoinCategoryIfNotSelected();
          await withdrawalPage.browseAndSelectCoinProduct(SILVER_PRODUCT_NAME, {
            requireSilverInCatalog: true,
            maxAttempts: 3,
          });

          selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
          console.log('Product details:', selectedProductDetails);

          await withdrawalPage.clickRequestDelivery();
          await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, ORDER_QUANTITY);
        },
      );

      await test.step(
        'TC012_3 | Fund order via Silver SIP',
        async () => {
          logSub(3, 'Fund order via Silver SIP');
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
          await withdrawalPage.waitForDeliveryAddressFormSectionVisible();
        },
      );

      await test.step(
        'TC012_4 | Fill delivery address, select same-as-billing, and proceed to checkout',
        async () => {
          logSub(4, 'Fill delivery address, select same-as-billing, and proceed to checkout');

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
        'TC012_5 | Select Card payment type and open Razorpay',
        async () => {
          logSub(5, 'Select Card payment type and open Razorpay');

          await withdrawalPage.checkoutPageGetAndLogPaymentTypes();
          await withdrawalPage.checkoutPageSelectPaymentTypeCard();
          await withdrawalPage.checkoutPageClickProceedToPay();
        },
      );

      await test.step(
        'TC012_6 | Complete card payment',
        async () => {
          logSub(6, 'Complete card payment');

          if (!selectedProductDetails) {
            throw new Error('Selected product details missing before payment.');
          }

          await paymentPage.validateAndCompleteWithdrawalCardPayment(
            selectedProductDetails.makingAndDeliveryChargesAmount * ORDER_QUANTITY,
            {
              cardNumber: cardDataset.cardNumber,
              cardExpiry: cardDataset.cardExpiry,
              cardCvv: cardDataset.cardCvv,
              cardHolderName: cardDataset.cardHolderName,
              cardOtp: cardDataset.cardOtp,
            },
            { logLabel: TC012(6) },
          );
        },
      );

      await test.step(
        'TC012_7 | Dashboard — silver balance decreased by product weight',
        async () => {
          logSub(7, 'Dashboard silver balance update');
          await page.goto('/dashboard');
          await expect(page).toHaveURL(/dashboard/i);

          const totalSilverAfter = await dashboardPage.getTotalSilverValue();
          const expectedSilverAfter = Number((totalSilverBefore - productGm).toFixed(4));

          console.log(`[${TC012(7)}] Total Silver before/after/expected:`, totalSilverBefore, totalSilverAfter, expectedSilverAfter);

          expect(totalSilverAfter).toBeCloseTo(expectedSilverAfter, 2);
        },
      );

      await test.step(
        'TC012_8 | My orders — delivery card shows the Card-paid order',
        async () => {
          logSub(8, 'My orders delivery card shows the Card-paid order');
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
          await myOrderVerificationPage.validateProductOrderCardAgainstExpected({
            productName: selectedProductDetails.productName,
            productWeight: selectedProductDetails.productWeight,
            quantity: ORDER_QUANTITY,
            expectedAmount: selectedProductDetails.makingAndDeliveryChargesAmount,
          });
        },
      );
    },
  );
});
