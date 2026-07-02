import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc004Dataset } from '../../../../utils/data/customer-excel-data';

const tc004Dataset = getWithdrawalTc004Dataset();

const TC_ID = 'TC_Withdrawal_ConvertToProduct_008';

test.describe('TC_Withdrawal_ConvertToProduct_008 @customer-flows', () => {
  test('TC_008-Verify withdrawal cart add/remove product and Start Shopping navigation. @customer-flows', async ({
    page,
    dashboardPage,
    withdrawalPage,
  }) => {
    test.setTimeout(240_000);
    const TC008 = (n: number): string => `TC008_${n}`;
    const logSub = (n: number, title: string): void => {
      console.log(`\n[${TC008(n)}] ${title}`);
    };

    const primaryProductName = tc004Dataset.productName || 'Augmont 0.5Gm Gold Coin (999 Purity)';

    await test.step('TC008_1 | Open dashboard and navigate to convert product list', async () => {
      logSub(1, 'Open withdrawal options and product list');
      await dashboardPage.goto('/dashboard');
      await dashboardPage.clickWithdrawInvestment();
      await withdrawalPage.openConvertToCoinsAndBarsProductList();
      const categoryNames = await withdrawalPage.getAndLogProductCategoryNames();
      expect(categoryNames.length).toBeGreaterThan(0);
    });

    await test.step('TC008_2 | Select one product and validate cart product details', async () => {
      logSub(2, 'Select one product and validate cart details');
      await withdrawalPage.selectCoinCategoryIfNotSelected();
      await withdrawalPage.selectProductByName(primaryProductName, 'Coin');
      console.log(`[${TC008(2)}] Product selected: ${primaryProductName}`);
      const selectedProductDetails = await withdrawalPage.getAndLogSelectedProductDetails();
      await withdrawalPage.clickRequestDelivery();
      await withdrawalPage.normalizeCartToSingleProduct(selectedProductDetails.productName, 1);
      await withdrawalPage.validateCartItemWithSelectedProduct({
        productName: selectedProductDetails.productName,
        productWeight: selectedProductDetails.productWeight,
        quantity: 1,
      });
    });

    await test.step('TC008_3 | Remove all cart items and validate empty cart message', async () => {
      logSub(3, 'Remove item and validate empty cart message');
      await withdrawalPage.removeAllProductsFromCart();
      await withdrawalPage.validateEmptyCartMessageVisible();
    });

    await test.step('TC008_4 | Click Continue Shopping and validate URL', async () => {
      logSub(4, 'Continue shopping navigation');
      await withdrawalPage.clickContinueShoppingFromCart();
      await withdrawalPage.waitForProductListPage();
      const currentUrl = page.url();
      const expectedUrlPattern = /\/withdraw\/product-list(?:\/)?(?:\?.*)?$/i;
      console.log('[TC008 VALIDATION] Continue shopping URL | expected pattern:', expectedUrlPattern);
      console.log('[TC008 VALIDATION] Continue shopping URL | actual:', currentUrl);
      expect(currentUrl).toMatch(expectedUrlPattern);
      console.log('[TC008 VALIDATION] Continue shopping URL validation: PASS');
    });
  });
});
