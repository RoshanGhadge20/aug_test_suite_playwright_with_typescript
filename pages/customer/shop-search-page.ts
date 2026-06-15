import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class ShopSearchPage extends BasePage {
  private readonly searchInput: Locator;
  private readonly searchIcon: Locator;
  private readonly searchDialog: Locator;
  private readonly dialogProductNames: Locator;
  private readonly closeButton: Locator;
  private readonly resultsText: Locator;
  private readonly listingProductImages: Locator;

  constructor(page: Page) {
    super(page);

    this.searchInput = page.getByPlaceholder('Search on Augmont');
    this.searchIcon = page.getByPlaceholder('Search on Augmont').locator('xpath=preceding-sibling::*[1]');
    this.searchDialog = page.locator('.p-dialog').filter({
      has: page.locator('button[aria-label="Close"]'),
    });
    this.dialogProductNames = this.searchDialog.locator('app-product h3');
    this.closeButton = this.searchDialog.locator('button[aria-label="Close"]');
    this.resultsText = page.getByText(/\d+\s+results?/i).first();
    this.listingProductImages = page.locator('figure img[alt]');
  }

  /** Partial match — opens search dialog suggestions. */
  async searchProduct(searchText: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(searchText);
    await this.searchInput.press('Enter');
  }


  async getSearchResultNames(): Promise<string[]> {
    await expect(this.searchDialog).toBeVisible();
    await expect(this.dialogProductNames.first()).toBeVisible();
    return (await this.dialogProductNames.allInnerTexts()).map((name) => name.trim()).filter(Boolean);
  }

  async verifyProductInSearchResults(productName: string): Promise<string[]> {
    const names = await this.getSearchResultNames();
    console.log('Search Results :', names);

    const term = productName.trim().toLowerCase();
    expect(names.some((name) => name.toLowerCase().includes(term))).toBeTruthy();
    return names;
  }

  async closeDialog(): Promise<void> {
    if (!(await this.searchDialog.isVisible())) return;
    await this.page.keyboard.press('Escape');
    await this.searchDialog.waitFor({ state: 'hidden', timeout: 10_000 });
  }
}
