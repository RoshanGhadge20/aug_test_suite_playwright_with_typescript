import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

/**
 * Top navigation — PRODUCTS mega-menu and product entry links.
 */
export class ProductMenuPage extends BasePage {
  private readonly productsMenu: Locator;
  private readonly productsMenuPanel: Locator;
  private readonly digitalGoldLink: Locator;
  private readonly digitalSilverLink: Locator;
  private readonly shopLink: Locator;
  private readonly goldFdPlusLink: Locator;
  private readonly jewelleryLink: Locator;
  private readonly coinLink: Locator;
  private readonly barLink: Locator;

  constructor(page: Page) {
    super(page);

    this.productsMenu = page.getByText('PRODUCTS', { exact: true });
    this.productsMenuPanel = page
      .locator('[role="menu"], .p-megamenu-panel, .p-menu-overlay, nav')
      .filter({ has: page.getByRole('link', { name: /Digital Gold/i }) })
      .first();

    this.digitalGoldLink = page.getByRole('link', { name: /Digital Gold Buy and save/i });
    this.digitalSilverLink = page.getByRole('link', { name: /Digital Silver Buy and save/i });
    this.shopLink = page.getByRole('link', { name: /Shop-Gold/i });
    this.goldFdPlusLink = page.getByRole('link', { name: /Gold FD\+|Gold FD Plus/i });
    this.jewelleryLink = page.getByRole('link', { name: /Jewellery/i });
    this.coinLink = page.getByRole('link', { name: /^Coin$/i });
    this.barLink = page.getByRole('link', { name: /^Bar$/i });
  }

  /** PRODUCTS trigger in the header. */
  get productsMenuTrigger(): Locator {
    return this.productsMenu;
  }

  /** Dropdown / mega-menu panel (visible after hover). */
  get productsDropdown(): Locator {
    return this.productsMenuPanel;
  }

  get digitalGold(): Locator {
    return this.digitalGoldLink;
  }

  get digitalSilver(): Locator {
    return this.digitalSilverLink;
  }

  get shop(): Locator {
    return this.shopLink;
  }

  get goldFdPlus(): Locator {
    return this.goldFdPlusLink;
  }

  get jewellery(): Locator {
    return this.jewelleryLink;
  }

  get coin(): Locator {
    return this.coinLink;
  }

  get bar(): Locator {
    return this.barLink;
  }

  /** Any product submenu link by visible name (partial match). */
  productLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  /**
   * Opens the PRODUCTS mega-menu (hover). Waits until any known submenu link is visible.
   * Timeout matches `actionTimeout` in playwright.config (10s) — not 15s.
   */
  async openProductsMenu(timeoutMs = 10_000): Promise<void> {
    await this.productsMenu.waitFor({ state: 'visible', timeout: timeoutMs });
    await this.productsMenu.hover();
    const submenuReady = this.shopLink
      .or(this.digitalGoldLink)
      .or(this.digitalSilverLink)
      .first();
    await submenuReady.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async isProductsMenuVisible(): Promise<boolean> {
    return this.productsMenu.isVisible();
  }

  async isProductsDropdownVisible(): Promise<boolean> {
    await this.openProductsMenu();
    return this.productsMenuPanel.isVisible().catch(() => false);
  }

  async clickDigitalGold(): Promise<void> {
    await this.openProductsMenu();
    await this.digitalGoldLink.click();
  }

  async clickDigitalSilver(): Promise<void> {
    await this.openProductsMenu();
    await this.digitalSilverLink.click();
  }

  async clickShop(): Promise<void> {
    await this.openProductsMenu();
    await this.shopLink.click();
  }

  async clickGoldFdPlus(): Promise<void> {
    await this.openProductsMenu();
    await this.goldFdPlusLink.click();
  }

  async clickProductLink(name: string | RegExp): Promise<void> {
    await this.openProductsMenu();
    await this.productLink(name).click();
  }
}
