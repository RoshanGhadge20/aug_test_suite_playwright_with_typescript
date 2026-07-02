import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export type ShopCartItemDetails = {
  productName: string;
  netWeight: string;
  quantity: string;
  itemPrice: number;
};

/** EMI cart row (TC003) — no quantity dropdown; line price is Net Payable. */
export type ShopEmiCartItemDetails = {
  productName: string;
  netWeight: string;
  itemPrice: number;
};

export type ShopCartPriceDetails = {
  metalPrice: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
};

/** TC003 — EMI + Buy Now cart price panel (TAX, Initial Payment, etc.). */
export type ShopEmiMixedCartPriceDetails = {
  metalPrice: number;
  initialPayment: number;
  makingAndDeliveryCharges: number;
  tax: number;
  grandTotal: number;
};

export class ShopCartPage extends BasePage {
  private readonly cartItemsHeading: Locator;
  private readonly emptyCartMessage: Locator;
  private readonly cartProductCards: Locator;
  private readonly trashIcon: Locator;
  private readonly removeButton: Locator;
  private readonly proceedToPayButton: Locator;
  private readonly priceDetailsSection: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItemsHeading = page.getByRole('heading', { name: /Cart Items/i, level: 2 });
    this.emptyCartMessage = page.getByText(/your bag is empty/i);
    this.cartProductCards = this.cartItemsHeading.locator('xpath=following-sibling::div/div');
    this.trashIcon = page.locator('i.pi-trash');
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.proceedToPayButton = page.getByRole('button', { name: /Proceed to Pay/i });
    this.priceDetailsSection = page
      .getByRole('heading', { name: 'Price Details', level: 3 })
      .locator('xpath=..');
  }

  async clearCart(): Promise<void> {
    await this.page.goto('/shop-new/cart');
    await this.waitForCart();
    await this.removeAllCartItems();
  }

  async expectCartHasProducts(productNames: string[]): Promise<void> {
    await this.waitForCart();
    expect(await this.getCartItemCount()).toBe(productNames.length);
    const cartNames = await this.getAllCartProductNames();
    for (const name of productNames) {
      expect(cartNames.some((cartName) => cartName.includes(name) || name.includes(cartName))).toBe(true);
    }
  }

  async waitForCart(): Promise<void> {
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await Promise.race([
      this.cartItemsHeading.waitFor({ state: 'visible', timeout: 15_000 }),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
  }

  async getAllCartProductNames(): Promise<string[]> {
    await this.waitForCart();
    const count = await this.cartProductCards.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await this.text(this.cartProductCards.nth(i).getByRole('heading', { level: 3 }));
      if (name) names.push(name);
    }
    return names;
  }

  async clickTrash(): Promise<void> {
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.trashIcon.first().click({ timeout: 15_000 });
  }

  async clickRemove(): Promise<void> {
    await this.removeButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.removeButton.click();
  }

  get proceedToPay(): Locator {
    return this.proceedToPayButton;
  }

  async clickProceedToPay(): Promise<void> {
    await this.proceedToPayButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.proceedToPayButton.click();
  }

  async continueShopping(): Promise<void> {
    const link = this.page.getByRole('link', { name: /continue shopping/i }).first();
    if (await link.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await link.click();
      await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
      return;
    }
    await this.page.goto('/shop-new/product');
    await this.page.waitForURL(/shop-new\/product/i, { timeout: 15_000 });
  }

  async removeAllCartItems(): Promise<string[]> {
    await this.waitForCart();
    const removed: string[] = [];

    while (
      !(await this.emptyCartMessage.isVisible().catch(() => false)) &&
      ((await this.cartProductCards.count()) > 0 ||
        (await this.trashIcon.first().isVisible().catch(() => false)))
    ) {
      const name = await this.text(
        this.cartProductCards.first().getByRole('heading', { level: 3 }),
      );
      await this.clickTrash();
      await this.clickRemove();
      removed.push(name);
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }

    return removed;
  }

  async getCartItemCount(): Promise<number> {
    await this.page.waitForURL(/shop-new\/cart/i, { timeout: 15_000 });
    return this.cartProductCards.count();
  }

  async getCartItemDetails(productName: string): Promise<ShopCartItemDetails> {
    await this.waitForCart();
    const item = this.cartItem(productName);
    await item.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      productName: await this.text(item.getByRole('heading', { level: 3 })),
      netWeight: await this.text(item.getByText(/Net weight:/i)),
      quantity: await this.text(item.locator('.p-dropdown .p-dropdown-label').first()),
      itemPrice: this.parseAmount(
        await this.text(item.locator('p.font-bold').filter({ hasText: /^₹/ })),
      ),
    };
  }

  /** TC003 only — EMI lines omit quantity; do not use for Buy Now rows (use getCartItemDetails). */
  async getEmiCartItemDetails(productName: string): Promise<ShopEmiCartItemDetails> {
    await this.waitForCart();
    const item = this.cartItem(productName);
    await item.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      productName: await this.text(item.getByRole('heading', { level: 3 })),
      netWeight: await this.text(item.getByText(/Net weight:/i)),
      itemPrice: this.parseAmount(
        await this.text(item.locator('p.font-bold').filter({ hasText: /^₹/ })),
      ),
    };
  }

  async expectEmiCartItemMatchesNetPayable(
    productName: string,
    expectedNetPayable: number,
  ): Promise<ShopEmiCartItemDetails> {
    const cartItem = await this.getEmiCartItemDetails(productName);
    expect(cartItem.productName).toContain(productName);
    expect(cartItem.itemPrice).toBe(expectedNetPayable);
    return cartItem;
  }

  async getCartPriceDetails(): Promise<ShopCartPriceDetails> {
    await this.waitForCart();
    await this.priceDetailsSection.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      metalPrice: await this.priceRow('Metal Price'),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges'),
      tax: await this.priceRow('Tax'),
      grandTotal: await this.priceRow('Grand Total'),
    };
  }

  /** TC003 only — mixed EMI cart uses TAX and Initial Payment rows. */
  async getEmiMixedCartPriceDetails(): Promise<ShopEmiMixedCartPriceDetails> {
    await this.waitForCart();
    await this.priceDetailsSection.waitFor({ state: 'visible', timeout: 10_000 });

    return {
      metalPrice: await this.priceRow('Metal Price'),
      initialPayment: await this.priceRow('Initial Payment'),
      makingAndDeliveryCharges: await this.priceRow('Making & Delivery Charges'),
      tax: await this.priceRowEither('Tax', 'TAX'),
      grandTotal: await this.priceRow('Grand Total'),
    };
  }

  private cartItem(productName: string): Locator {
    return this.cartProductCards.filter({
      has: this.page.getByRole('heading', { name: productName, level: 3 }),
    });
  }

  private async priceRow(label: string): Promise<number> {
    const labelCell = this.priceDetailsSection.getByText(label, { exact: true });
    return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
  }

  private async priceRowEither(...labels: string[]): Promise<number> {
    for (const label of labels) {
      const labelCell = this.priceDetailsSection.getByText(label, { exact: true });
      if (await labelCell.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return this.parseAmount(await this.text(labelCell.locator('xpath=following-sibling::*[1]')));
      }
    }
    throw new Error(`Price row not found in cart: ${labels.join(' | ')}`);
  }

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
