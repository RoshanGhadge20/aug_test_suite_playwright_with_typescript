import { test, expect } from '../../../../fixtures/base.fixture';

const SILVER_PRODUCT_NAME = 'Augmont 1GM Silver Coin 999 Purity';

const validAddress = {
  firstName: 'Augmont',
  lastName: 'QA Delivery',
  address: 'Bandra Kurla Complex Plot C',
  pincode: '400051',
  stateOptionLabel: 'Maharashtra',
  cityOptionLabel: 'Mumbai',
} as const;

test.describe('TC_Withdrawal_ConvertToProduct_010 @customer-flows', () => {
  test(
    'TC_010-Verify delivery address form validation for required fields and invalid pincode',
    async ({ page, dashboardPage, withdrawalPage }) => {
      test.setTimeout(180_000);

      const TC010 = (n: number): string => `TC010_${n}`;
      const logSub = (n: number, title: string): void => {
        console.log(`\n[${TC010(n)}] ${title}`);
      };

      let selectedProductDetails: Awaited<ReturnType<typeof withdrawalPage.getAndLogSelectedProductDetails>> | null =
        null;
      let productGm = 0;

      await test.step(
        'TC010_1 | Select silver coin product and add to cart',
        async () => {
          logSub(1, 'Select silver coin product and add to cart');
          await page.goto('/dashboard');
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
        'TC010_2 | Fund order via Silver SIP and open the delivery address form',
        async () => {
          logSub(2, 'Fund order via Silver SIP and open the delivery address form');
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
        'TC010_3 | Enter blank Address and invalid Pincode — validate inline errors',
        async () => {
          logSub(3, 'Enter blank Address and invalid Pincode — validate inline errors');

          await withdrawalPage.fillManualDeliveryAddress({
            firstName: validAddress.firstName,
            lastName: validAddress.lastName,
            address: '',
            pincode: '123',
            stateOptionLabel: validAddress.stateOptionLabel,
            cityOptionLabel: validAddress.cityOptionLabel,
          });

          await withdrawalPage.settleMs(1000);

          const allErrors = await withdrawalPage.getAllVisibleDeliveryFormErrorTexts();
          console.log(`[${TC010(3)}] All visible delivery form errors:`, allErrors);

          expect(allErrors.some((e) => /address is required/i.test(e))).toBe(true);

          const pincodeError = await withdrawalPage.getDeliveryFieldInlineError('pinCode');
          console.log(`[${TC010(3)}] Pincode field error:`, pincodeError);

          expect(pincodeError).toBe('Enter a valid Pincode');
        },
      );

      await test.step(
        'TC010_4 | Verify Proceed stays blocked with invalid delivery data',
        async () => {
          logSub(4, 'Verify Proceed stays blocked with invalid delivery data');

          const proceedClicked = await withdrawalPage.clickDeliveryProceedButtonIfEnabled();
          console.log(`[${TC010(4)}] Proceed clicked (was enabled):`, proceedClicked);

          expect(proceedClicked).toBe(false);
        },
      );

      await test.step(
        'TC010_5 | Fill valid delivery data — errors clear but Proceed still needs billing',
        async () => {
          logSub(5, 'Fill valid delivery data — errors clear but Proceed still needs billing');

          await withdrawalPage.fillManualDeliveryAddress({
            firstName: validAddress.firstName,
            lastName: validAddress.lastName,
            address: validAddress.address,
            pincode: validAddress.pincode,
            stateOptionLabel: validAddress.stateOptionLabel,
            cityOptionLabel: validAddress.cityOptionLabel,
          });

          await withdrawalPage.settleMs(1000);

          const remainingErrors = await withdrawalPage.getAllVisibleDeliveryFormErrorTexts();
          console.log(`[${TC010(5)}] Remaining visible delivery form errors:`, remainingErrors);

          expect(remainingErrors).toHaveLength(0);

          const proceedClickedBeforeBilling = await withdrawalPage.clickDeliveryProceedButtonIfEnabled();
          console.log(
            `[${TC010(5)}] Proceed clicked (enabled) before billing is set:`,
            proceedClickedBeforeBilling,
          );

          expect(
            proceedClickedBeforeBilling,
            'Proceed must stay disabled until the billing address is also set, even with a valid delivery row.',
          ).toBe(false);
        },
      );

      await test.step(
        'TC010_6 | Select "Same as billing address" — Proceed becomes enabled',
        async () => {
          logSub(6, 'Select "Same as billing address" — Proceed becomes enabled');

          await withdrawalPage.clickSameAsBillingAddressCheckbox();
          await withdrawalPage.settleMs(1000);

          const proceedClicked = await withdrawalPage.clickDeliveryProceedButtonIfEnabled();
          console.log(`[${TC010(6)}] Proceed clicked (enabled) after same-as-billing:`, proceedClicked);

          expect(proceedClicked).toBe(true);
          await expect(page).toHaveURL(/\/withdraw\/product-list\/checkout$/);
        },
      );
    },
  );
});
