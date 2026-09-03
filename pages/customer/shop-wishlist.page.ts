import { BasePage } from '../shared/base.page';
import { Locator, Page, expect } from '@playwright/test';

export type WishlistProductCardDetails = {
  productName: string;
  imageAlt: string;
  titleAttr: string;
  priceText: string;
};

export class ShopWishlistPage extends BasePage {
  static readonly toastMessages = {
    ADDED: 'Product added to wishlist',
    REMOVED: 'Product removed from wishlist',
  } as const;

  private readonly wishlistNavIcon: Locator;
  private readonly wishlistSuccessToast: Locator;

  constructor(page: Page) {
    super(page);
    this.wishlistSuccessToast = page.locator('p-toastitem .p-toast-message');
    this.wishlistNavIcon = page.locator('button[icon="pi pi-heart"]');
  }

  private catalogAppProductCards(): Locator {
    // `ng-reflect-*` attributes only exist in Angular dev builds — this UAT env runs a
    // production build, so they're never present. Called only on the shop catalog page,
    // where every `app-product-new` card is a catalog card anyway.
    return this.page.locator('app-product-new');
  }

  /** Shop home landing tiles (New Arrivals / Recently Viewed) — no app-product-new wrapper. */
  private shopHomeProductCards(): Locator {
    return this.page.locator('figure img[alt]').locator('xpath=ancestor::*[.//figure][1]');
  }

  private async catalogProductTarget(index: number): Promise<{
    productName: string;
    wishlistControl: Locator;
  }> {
    const appCards = this.catalogAppProductCards();

    await expect
      .poll(async () => Math.max(await appCards.count(), await this.shopHomeProductCards().count()))
      .toBeGreaterThan(index);

    if ((await appCards.count()) > index) {
      const card = appCards.nth(index);
      const image = card.locator('img').first();
      await image.scrollIntoViewIfNeeded();
      return {
        productName: (await image.getAttribute('alt'))?.trim() ?? '',
        wishlistControl: card.locator('.pi-heart, i[class*="pi-heart"]').first(),
      };
    }

    const card = this.shopHomeProductCards().nth(index);
    const image = card.locator('figure img[alt]').first();
    await image.scrollIntoViewIfNeeded();
    return {
      productName: (await image.getAttribute('alt'))?.trim() ?? '',
      // The `preceding-sibling` div is a flex wrapper Playwright treats as zero-size —
      // the actual clickable heart icon is the svg inside it.
      wishlistControl: card
        .locator('figure')
        .locator('xpath=preceding-sibling::*[1]')
        .locator('svg')
        .first(),
    };
  }

  private wishlistPageCards(): Locator {
    // Same `ng-reflect-*` issue as catalogAppProductCards — called only on the /wishlist
    // page, where every `app-product-new` card is a wishlist card.
    return this.page.locator('app-product-new');
  }

  private wishlistProductCard(productName: string): Locator {
    return this.wishlistPageCards().filter({
      has: this.page.locator(`img[alt="${productName}"]`),
    });
  }

  private async readToastMessage(): Promise<string> {
    const toastMessage = this.page
      .locator('p-toastitem .font-gilroy')
      .or(this.page.getByText(/Product (added|removed) from wishlist/i));
    await expect(toastMessage.first()).toBeVisible({ timeout: 10_000 });
    const message = (await toastMessage.first().textContent())?.trim() ?? '';
    await this.wishlistSuccessToast.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    return message;
  }

  async openShopHome(): Promise<void> {
    await this.goto('/shop-new');
    await expect(this.page).toHaveURL(/shop-new/i);
  }

  async addCatalogProductToWishlist(index = 0): Promise<{
    productName: string;
    toastMessage: string;
  }> {
    const { productName, wishlistControl } = await this.catalogProductTarget(index);
    await wishlistControl.click();

    let toastMessage = await this.readToastMessage();
    if (toastMessage === ShopWishlistPage.toastMessages.REMOVED) {
      await wishlistControl.click();
      toastMessage = await this.readToastMessage();
    }

    console.log(`Toast Message: ${toastMessage}`);
    console.log(`Product added to wishlist: ${productName}`);

    return { productName, toastMessage };
  }

  async addFirstProductToWishlist(): Promise<{
    productName: string;
    toastMessage: string;
  }> {
    return this.addCatalogProductToWishlist(0);
  }

  async clickWishlistIcon(): Promise<void> {
    await this.wishlistNavIcon.waitFor({ state: 'visible' });
    await this.wishlistNavIcon.click();
    await this.page.waitForURL(/wishlist/i);
    await expect(
      this.page.getByRole('heading', { name: 'My Wishlist', level: 2 }),
    ).toBeVisible();
  }

  async getWishlistProductCardDetails(productName: string): Promise<WishlistProductCardDetails> {
    const card = this.wishlistProductCard(productName);
    await expect(card).toHaveCount(1);

    const imageAlt = (await card.locator('img').getAttribute('alt'))?.trim() ?? '';
    const titleAttr = (await card.getAttribute('ng-reflect-title'))?.trim() ?? '';
    const heading = (await card.locator('h3').textContent())?.trim() ?? '';
    const priceText =
      (await card.locator('div').filter({ hasText: /^₹/ }).first().textContent())?.trim() ?? '';

    return {
      productName: heading,
      imageAlt,
      titleAttr,
      priceText,
    };
  }

  async getWishlistProductNames(): Promise<string[]> {
    const cards = this.wishlistPageCards();
    const count = await cards.count();
    const names: string[] = [];

    for (let i = 0; i < count; i += 1) {
      const alt = (await cards.nth(i).locator('img').getAttribute('alt'))?.trim() ?? '';
      if (alt) names.push(alt);
    }

    return names;
  }

  async verifyProductInWishlist(productName: string): Promise<WishlistProductCardDetails> {
    await expect.poll(async () => this.getWishlistProductNames()).toContain(productName);

    const details = await this.getWishlistProductCardDetails(productName);
    expect(details.imageAlt).toBe(productName);
    if (details.titleAttr) {
      expect(details.titleAttr).toBe(productName);
    }
    expect(details.productName).toContain(productName);
    await expect(
      this.wishlistProductCard(productName).getByRole('button', { name: 'Move To Cart' }),
    ).toBeVisible();

    console.log(`Verified wishlist card: ${JSON.stringify(details)}`);
    return details;
  }

  async removeWishlistProduct(productName: string): Promise<string> {
    const productCard = this.wishlistProductCard(productName);
    await expect(productCard).toHaveCount(1);

    await productCard.locator('i.pi-times-circle').click();

    const message = await this.readToastMessage();
    await expect(this.wishlistProductCard(productName)).toHaveCount(0);

    console.log(`Toast Message: ${message}`);
    console.log(`Product removed from wishlist: ${productName}`);

    return message;
  }

  async moveWishlistProductToCart(productName: string): Promise<void> {
    const productCard = this.wishlistProductCard(productName);
    await expect(productCard).toHaveCount(1);

    await productCard.getByRole('button', { name: 'Move To Cart' }).click();

    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    await expect(this.page).toHaveURL(/shop-new\/cart/i);

    console.log(`Moved wishlist product to cart — URL: ${this.page.url()}`);
  }
}
