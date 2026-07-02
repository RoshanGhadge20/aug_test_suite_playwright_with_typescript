import { test, expect } from '../../../../fixtures/base.fixture';
import { getShopDataset } from '../../../../utils/data/customer-excel-data';

test.describe('TC_Shop_ProductListing_003 @customer-flows', () => {
  test('TC_Shop_ProductListing_003|AT-1665 -search — partial and exact match on shop listing', async ({ page, shopPage, shopSearchPage }) => {
    test.setTimeout(120_000);

    const { productName } = getShopDataset();
    const partialSearchTerm = 'Gold Coin';
    let partialResults: string[] = [];

    await test.step('open shop product listing', async () => {
      await shopPage.openShopListing();
      await expect(page).toHaveURL(/\/shop-new\/product/i);
    });

    await test.step('search for a product with partial match', async () => {
      console.log(`[search] partial term: ${partialSearchTerm} | excel product: ${productName}`);
      await shopSearchPage.searchProduct(partialSearchTerm);
      partialResults = await shopSearchPage.verifyProductInSearchResults(partialSearchTerm);
      console.log(`[search] partial result count: ${partialResults.length}`);
      await shopSearchPage.closeDialog();
    });

    await test.step('search for a product with case-insensitive partial match', async () => {
      const caseInsensitiveTerm = partialSearchTerm.toLowerCase();
      await shopPage.openShopListing();
      console.log(`[search] case-insensitive partial term: ${caseInsensitiveTerm}`);
      await shopSearchPage.searchProduct(caseInsensitiveTerm);
      const insensitiveResults = await shopSearchPage.verifyProductInSearchResults(partialSearchTerm);
      console.log(`[search] case-insensitive result count: ${insensitiveResults.length}`);
      expect(insensitiveResults.length).toBe(partialResults.length);
      expect([...insensitiveResults].sort()).toEqual([...partialResults].sort());
      await shopSearchPage.closeDialog();
    });

    await test.step('search for a product with exact match', async () => {
      console.log(`[search] exact product from excel: ${productName}`);
      await shopPage.openShopListing();
      await shopSearchPage.searchProduct(productName);
      const exactResults = await shopSearchPage.verifyProductInSearchResults(productName);
      console.log(`[search] exact result count: ${exactResults.length}`);
      expect(exactResults.length).toBe(1);
      expect(exactResults[0]).toBe(productName);
    });
  });
});
