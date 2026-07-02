import { test, expect } from '../../../../fixtures/base.fixture';
import { ShopSortPage } from '../../../../pages/customer/shop-sort.page';

test.describe('TC_Shop_ProductListing_002 @customer-flows', () => {
  test('TC_Shop_ProductListing_002|AT-1664 - sort — default Sorting Options displayed on shop listing', async ({
    page,
    shopPage,
    shopSortPage,
  }) => {
    test.setTimeout(180_000);

    await test.step('open shop product listing', async () => {
      await shopPage.openShopListing();
      await expect(page).toHaveURL(/\/shop-new\/product/i);
    });

    await test.step('select jewellery type Silver', async () => {
      await shopPage.selectJewelleryTypeSilver();
    });

    await test.step('select subcategory USilver', async () => {
      await shopPage.selectUSilverSubcategory();
    });

    await test.step('select price range ₹100 - ₹20000', async () => {
      await shopPage.clickPriceRangeRadio();
    });

    let listingProductCount = 0;

    await test.step('get USilver filtered product count from listing header', async () => {
      const listing = await shopSortPage.getListingProductCount('USilver');
      listingProductCount = listing.count;
      console.log(`[AT-1667] ${listing.category} product count: ${listingProductCount}`);
      expect(listingProductCount).toBeGreaterThan(0);
    });

    await test.step('scroll up to sorting section', async () => {
      await shopSortPage.scrollUpToSortingOptions();
    });

    await test.step('verify default sorting option is Sorting Options', async () => {
      await shopSortPage.expectDefaultSortingOptionDisplayed();
    });

    await test.step('select Price - High to Low from sort dropdown', async () => {
      await shopSortPage.selectSortOption(ShopSortPage.priceHighToLow);
      await shopSortPage.expectSelectedSortOption(ShopSortPage.priceHighToLow);
      await shopSortPage.expectListingProductCount('USilver', listingProductCount);
    });

    await test.step('verify all USilver product prices sorted High to Low', async () => {
      await shopSortPage.expectProductsSortedHighToLow('USilver');
    });

    await test.step('select Price - Low to High from sort dropdown', async () => {
      await shopSortPage.scrollUpToSortingOptions();
      await shopSortPage.selectSortOption(ShopSortPage.priceLowToHigh);
      await shopSortPage.expectSelectedSortOption(ShopSortPage.priceLowToHigh);
      await shopSortPage.expectListingProductCount('USilver', listingProductCount);
    });

    await test.step('verify all USilver product prices sorted Low to High', async () => {
      await shopSortPage.expectProductsSortedLowToHigh('USilver');
    });
  });
});
