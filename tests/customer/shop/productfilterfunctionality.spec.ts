import { test, expect } from '../../../fixtures/base.fixture';
import { ShopFilterPage } from '../../../pages/customer/shop-filter.page';

test.describe('product filter functionality @customer-flows', () => {
  test('AT-1663 - filter by price range and metal weight, verify product weight on PDP', async ({
    page,
    shopPage,
    shopFilterPage,
  }) => {
    test.setTimeout(360_000);

    let filteredProductCount = 0
    await test.step('open shop product listing', async () => {
      await shopPage.openShopListing();
      await expect(page).toHaveURL(/\/shop-new\/product/i);
    });

    await test.step('select price range ₹100 - ₹20000', async () => {
      await shopFilterPage.selectPriceRange100To20000();
    });

    await test.step('select metal weight 6 - 8 grms', async () => {
      await shopFilterPage.selectMetalWeight6To8Grams();
    });

    await test.step('scroll up and get filtered product count', async () => {
      filteredProductCount = await shopFilterPage.getFilteredProductCount();
      console.log(`[AT-1668] Filtered product count: ${filteredProductCount}`);
      expect(filteredProductCount).toBeGreaterThan(0);
    });

    await test.step('verify each product weight is between 6 and 8 gm', async () => {
      await shopFilterPage.verifyEachProductWeightInRange(
        shopPage,
        ShopFilterPage.minWeightGrams,
        ShopFilterPage.maxWeightGrams,
      );
    });
  });
});
