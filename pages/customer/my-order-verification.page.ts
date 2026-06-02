import { expect, Locator, Page, type Response } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import type { ShopBillingAddressDetails } from './shop-checkout.page';

/** Product line on my-orders delivery / product detail card (see flex row with h3 + Transaction Id). */
export type MyOrderProductCardDetails = {
  productName: string;
  transactionId: string;
  status: string;
  quantity: number;
  priceAmount: number;
  productImageSrc?: string;
};

export type MyOrderShopCardDetails = {
  productName: string;
  orderId: string;
  status: string;
  quantity: number;
  priceAmount: number;
  orderedOn: string;
  productImageSrc?: string;
};

export type MyOrderShopDetailViewDetails = {
  productName: string;
  netWeight: string;
  quantity: number;
  priceAmount: number;
};

/** Order summary shown after Pay Now on an EMI Booked shop-tab row. */
export type MyOrderShopEmiDetailViewDetails = MyOrderShopDetailViewDetails & {
  dueOn: string;
};

export type MyOrderShopDetailStatusAndDate = {
  orderId: string;
  status: string;
  orderedOn: string;
};

export type MyOrderShopDetailDateTime = {
  dateTimeText: string;
  orderDate: string;
  orderTime: string;
};

export type MyOrderShopProductPropertiesDetails = {
  sku: string;
  metalType: string;
  purity: string;
  productWeight: string;
};

export type MyOrderSellCardDetails = {
  date: string;
  transactionId: string;
  narration: string;
  amountText: string;
  amountValue: number;
};

export type MyOrderViewStatusDetails = {
  transactionId: string;
  narration: string;
  ratePerGm: string;
  amount: string;
  totalAmount: string;
  currentStatus: string;
  paymentRefNo: string;
  paymentMode: string;
  paymentDate: string;
};

export class MyOrderVerificationPage extends BasePage {
  private readonly orderRows: Locator;
  private readonly noRecordLabel: Locator;
  private selectedOrderRow: Locator | null = null;
  private invoicePdfPage: Page | null = null;
  private invoicePdfHref: string | null = null;

  constructor(page: Page) {
    super(page);

    this.orderRows = page.locator('div.p-4').filter({
      has: page.locator('div.text-10:has-text("Transaction ID")'),
    });
    this.noRecordLabel = page.locator('text=No Record Found');
  }

  private logShopInvoice(step: number, message: string): void {
    console.log(`[Shop Invoice] Step ${step}: ${message}`);
  }

  private addressDetailsHeading(): Locator {
    return this.page.getByRole('heading', { name: /Address Details/i }).first();
  }

  private shopInvoiceButton(): Locator {
    return this.page
      .locator('p-button button, button, a')
      .filter({ hasText: /^invoice$/i })
      .or(this.page.getByRole('button', { name: /^invoice$/i }))
      .first();
  }

  /** Invoice control inside Address Details block (avoids unrelated Invoice matches). */
  private shopInvoiceButtonInAddressSection(): Locator {
    const section = this.page.locator('div').filter({ has: this.addressDetailsHeading() });
    return section
      .locator('p-button button, button, a')
      .filter({ hasText: /^invoice$/i })
      .or(section.getByRole('button', { name: /^invoice$/i }))
      .first();
  }

  private async clickShopInvoiceButton(): Promise<void> {
    await this.scrollToShopInvoiceSection();
    const candidates = [this.shopInvoiceButtonInAddressSection(), this.shopInvoiceButton()];
    for (const btn of candidates) {
      const visible = await btn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (!visible) {
        continue;
      }
      await btn.scrollIntoViewIfNeeded();
      await expect(btn).toBeEnabled({ timeout: 8_000 });
      try {
        await btn.click({ timeout: 8_000 });
      } catch {
        await btn.click({ force: true });
      }
      return;
    }
    throw new Error('Invoice button not found or not clickable on order detail.');
  }

  async clickProfileName(text: string): Promise<void> {
    const element = this.page.locator('span.ellipsis', { hasText: text });
    await element.waitFor({ state: 'visible' });
    await element.click();
  }

  async clickLinkByText(linkText: string): Promise<void> {
    const menu = this.page.locator('menu[active]');
    const link = menu.getByRole('link', { name: linkText });
    await link.waitFor({ state: 'visible' });
    await link.click();
  }

  /** Shop-tab rows — legacy ochre cards or compact list row (heading + Order Id + View Detail). */
  private shopOrderListRows(): Locator {
    const listRow = this.page
      .locator('div')
      .filter({ has: this.page.getByRole('heading', { level: 3 }) })
      .filter({ has: this.page.getByText(/^Order Id:/i) })
      .filter({ has: this.page.getByRole('button', { name: /^view detail$/i }) });
    return this.page.locator('motion.div.bg-sheengold-ochre, div.bg-sheengold-ochre').or(listRow);
  }

  private shopOrderCards(): Locator {
    return this.shopOrderListRows();
  }

  /** True when a shop-tab card exposes the given order id (label sibling, not one text node). */
  private async isShopOrderIdOnList(orderId: string): Promise<boolean> {
    const target = orderId.replace(/\D/g, '');
    if (!target) {
      return false;
    }

    for (let scroll = 0; scroll < 18; scroll += 1) {
      const cards = this.shopOrderCards();
      const count = await cards.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const card = cards.nth(i);
        if (!(await card.isVisible({ timeout: 250 }).catch(() => false))) {
          continue;
        }
        const idText = (await this.readShopLabel(card, 'Order Id').catch(() => '')).replace(/\D/g, '');
        if (idText === target) {
          return true;
        }
      }

      const orderIdVisible = await this.page
        .getByText(new RegExp(`Order Id:?\\s*${orderId}`, 'i'))
        .first()
        .isVisible({ timeout: 300 })
        .catch(() => false);
      if (orderIdVisible) {
        return true;
      }

      await this.scrollShopOrdersListDown();
    }

    return false;
  }

  /** Wait until My Orders list has loaded (shop cards, sell rows, or empty state). */
  private async waitForMyOrdersListReady(timeoutMs = 15_000): Promise<void> {
    await Promise.race([
      this.shopOrderCards().first().waitFor({ state: 'visible', timeout: timeoutMs }),
      this.orderRows.first().waitFor({ state: 'visible', timeout: timeoutMs }),
      this.noRecordLabel.waitFor({ state: 'visible', timeout: timeoutMs }),
    ]).catch(() => {});
  }

  /** SHOP list rendered — not BUY-tab Transaction ID rows. */
  private async isShopTabListRendered(): Promise<boolean> {
    const buyListVisible = await this.page
      .getByText(/^Transaction ID$/i)
      .first()
      .isVisible({ timeout: 400 })
      .catch(() => false);
    if (buyListVisible) {
      return false;
    }

    if (await this.noRecordLabel.isVisible({ timeout: 400 }).catch(() => false)) {
      return true;
    }

    const shopSignals = await Promise.all([
      this.shopOrderCards()
        .first()
        .isVisible({ timeout: 400 })
        .catch(() => false),
      this.page
        .getByText(/^ORDERED ON/i)
        .first()
        .isVisible({ timeout: 400 })
        .catch(() => false),
      this.page
        .getByRole('button', { name: /^view detail$/i })
        .first()
        .isVisible({ timeout: 400 })
        .catch(() => false),
    ]);
    return shopSignals.some(Boolean);
  }

  /** True when shop rows have real data (not skeleton placeholders with empty Order Id / heading). */
  private async isShopOrderListHydrated(): Promise<boolean> {
    if (await this.noRecordLabel.isVisible({ timeout: 400 }).catch(() => false)) {
      return true;
    }

    const orderIdWithValue = await this.page
      .getByText(/Order Id:\s*\d{3,}/i)
      .first()
      .isVisible({ timeout: 400 })
      .catch(() => false);
    if (orderIdWithValue) {
      return true;
    }

    const cards = this.shopOrderCards();
    const count = Math.min(await cards.count().catch(() => 0), 5);
    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      if (!(await card.isVisible({ timeout: 300 }).catch(() => false))) {
        continue;
      }
      const heading = (await this.text(card.getByRole('heading', { level: 3 }).first())).trim();
      const idText = (await this.readShopLabel(card, 'Order Id').catch(() => '')).replace(/\D/g, '');
      if (heading.length > 0 && idText.length >= 3) {
        return true;
      }
    }
    return false;
  }

  /** Wait until SHOP rows show product name + order id (not empty skeleton placeholders). */
  private async waitForShopOrderListHydrated(timeoutMs = 45_000): Promise<void> {
    const shopTab = this.page.getByRole('radio', { name: /^SHOP$/i }).first();
    let lastTabClickMs = 0;

    await expect
      .poll(
        async () => {
          if (!(await this.isShopTabListRendered())) {
            return false;
          }
          if (await this.isShopOrderListHydrated()) {
            return true;
          }

          const now = Date.now();
          if (lastTabClickMs === 0 || now - lastTabClickMs >= 10_000) {
            lastTabClickMs = now;
            await shopTab.click({ force: true }).catch(() => {});
            await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000, 3000] },
      )
      .toBeTruthy();
  }

  /** Scroll SHOP list down to load lazy-loaded order rows. */
  private async scrollShopOrdersListDown(): Promise<void> {
    const firstCard = this.shopOrderCards().first();
    if (await firstCard.isVisible({ timeout: 500 }).catch(() => false)) {
      await firstCard.scrollIntoViewIfNeeded().catch(() => {});
    }
    await this.shopOrderCards()
      .last()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.mouse.wheel(0, 450);
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * After SHOP tab click — wait for tab active, blockUI, shop API, and SHOP list DOM (not BUY rows).
   */
  private async waitForShopTabAfterClick(options: {
    shopTab: Locator;
    shopListResponse: Promise<unknown>;
    timeoutMs: number;
    listValidationOnly?: boolean;
  }): Promise<void> {
    const { shopTab, shopListResponse, timeoutMs, listValidationOnly } = options;

    if (!listValidationOnly) {
      await expect
        .poll(async () => shopTab.isChecked().catch(() => false), {
          timeout: 15_000,
          intervals: [200, 500, 1000],
        })
        .toBeTruthy();
    } else {
      await expect
        .poll(
          async () => {
            const checked = await shopTab.isChecked().catch(() => false);
            const ariaChecked = await shopTab.getAttribute('aria-checked').catch(() => null);
            return checked || ariaChecked === 'true';
          },
          { timeout: 15_000, intervals: [200, 500, 1000] },
        )
        .toBeTruthy();
    }

    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: timeoutMs });
    await shopListResponse;
    await this.waitForMyOrdersListReady(15_000);

    await expect
      .poll(async () => this.isShopTabListRendered(), {
        timeout: timeoutMs,
        intervals: [300, 500, 1000, 2000],
      })
      .toBeTruthy();
  }

  /**
   * After SHOP list is visible, wait until order id appears (re-clicks SHOP every 12s to refresh).
   */
  async waitForShopOrderIdOnList(
    orderId: string,
    options?: { productName?: string; timeoutMs?: number },
  ): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? 90_000;
    const shopTab = this.page.getByRole('radio', { name: /^SHOP$/i }).first();
    let lastRefreshMs = 0;
    let lastReloadMs = 0;

    const refreshShopList = async (): Promise<void> => {
      const refreshResponse = this.page
        .waitForResponse(
          (r) =>
            r.ok() &&
            (r.request().method() === 'GET' || r.request().method() === 'POST') &&
            /shop|my-orders|myorders|order-list|customer-order/i.test(r.url()),
          { timeout: 20_000 },
        )
        .catch(() => null);
      await shopTab.click({ force: true }).catch(() => {});
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      await refreshResponse;
      await this.waitForMyOrdersListReady(10_000);
      await expect
        .poll(async () => this.isShopTabListRendered(), {
          timeout: 15_000,
          intervals: [300, 500, 1000],
        })
        .toBeTruthy()
        .catch(() => {});
      await this.waitForShopOrderListHydrated(30_000).catch(() => {});
      await this.scrollShopOrdersListDown();
    };

    await expect
      .poll(
        async () => {
          if (!(await this.isShopOrderListHydrated())) {
            return false;
          }

          if (await this.isShopOrderIdOnList(orderId)) {
            return true;
          }

          if (options?.productName) {
            const card = this.shopOrderCard(options.productName);
            if (await card.isVisible({ timeout: 500 }).catch(() => false)) {
              const idText = (await this.readShopLabel(card, 'Order Id').catch(() => '')).replace(/\D/g, '');
              if (idText === orderId.replace(/\D/g, '')) {
                return true;
              }
            }
          }

          const now = Date.now();
          if (lastReloadMs === 0) {
            lastReloadMs = now;
            lastRefreshMs = now;
            if (!(await this.isShopOrderListHydrated())) {
              await refreshShopList();
            }
          } else if (now - lastReloadMs >= 20_000) {
            lastReloadMs = now;
            lastRefreshMs = now;
            await this.goToMyOrders();
            await this.page.evaluate('window.scrollTo(0, 0)').catch(() => {});
            await refreshShopList();
          } else if (now - lastRefreshMs >= 8_000) {
            lastRefreshMs = now;
            await refreshShopList();
          }

          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 1500, 2000, 3000] },
      )
      .toBeTruthy();
  }

  /**
   * After SHOP tab is selected, wait for shop API/UI (blockUI gone + shop cards or empty state).
   * Ignores BUY-tab rows (Transaction ID / Narration) still visible while shop data loads.
   */
  private async waitForShopTabDataLoaded(options?: {
    productName?: string;
    orderId?: string;
    timeoutMs?: number;
    /** TC004 — wait for shop list rows without requiring SHOP radio isChecked. */
    requireTabChecked?: boolean;
  }): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? 45_000;
    const requireTabChecked = options?.requireTabChecked ?? true;
    const shopTab = this.page.getByRole('radio', { name: /^SHOP$/i }).first();
    const productCard = options?.productName ? this.shopOrderCard(options.productName) : null;
    const orderCard = options?.orderId ? this.shopOrderCardByOrderId(options.orderId) : null;

    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});

    await expect
      .poll(
        async () => {
          if (requireTabChecked && !(await shopTab.isChecked().catch(() => false))) {
            return false;
          }

          if (options?.orderId) {
            if (await this.isShopOrderIdOnList(options.orderId)) {
              return true;
            }
            const orderIdVisible = await this.page
              .getByText(new RegExp(`Order Id:?\\s*${options.orderId}`, 'i'))
              .first()
              .isVisible({ timeout: 500 })
              .catch(() => false);
            if (orderIdVisible) {
              return true;
            }
          }

          if (orderCard) {
            return orderCard.isVisible({ timeout: 500 }).catch(() => false);
          }

          if (productCard) {
            return productCard.isVisible({ timeout: 500 }).catch(() => false);
          }

          const shopCard = await this.shopOrderCards()
            .first()
            .isVisible({ timeout: 500 })
            .catch(() => false);
          if (shopCard) {
            return true;
          }

          const orderedOn = await this.page
            .getByText(/^ORDERED ON/i)
            .first()
            .isVisible({ timeout: 500 })
            .catch(() => false);
          if (orderedOn) {
            return true;
          }

          const viewDetail = await this.page
            .getByRole('button', { name: /view detail/i })
            .first()
            .isVisible({ timeout: 500 })
            .catch(() => false);
          if (viewDetail) {
            return true;
          }

          if (await this.noRecordLabel.isVisible({ timeout: 500 }).catch(() => false)) {
            return true;
          }

          // BUY tab still showing — shop list not ready yet.
          const buyListVisible = await this.page
            .getByText(/^Transaction ID$/i)
            .first()
            .isVisible({ timeout: 300 })
            .catch(() => false);
          return !buyListVisible;
        },
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000] },
      )
      .toBeTruthy();
  }
  private static readonly invoicePdfUrlPattern =
    /emi-backend-api\.gfau\.augmont\.com\/.*(?:finalInvoice|proformaContract).*\.pdf/i;

  private static isInvoicePdfUrl(url: string): boolean {
    return (
      MyOrderVerificationPage.invoicePdfUrlPattern.test(url) ||
      /(?:finalInvoice|proformaContract).*\.pdf/i.test(url) ||
      /\.pdf(\?|$)/i.test(url) ||
      /amazonaws\.com\/.*\.pdf/i.test(url)
    );
  }

  private async waitForInvoiceViewerPage(timeoutMs = 30_000): Promise<Page | null> {
    let found: Page | null = null;
    await expect
      .poll(
        async () => {
          for (const tab of this.page.context().pages()) {
            if (tab.isClosed()) {
              continue;
            }
            const hasPassword = await tab
              .locator('input[type="password"]')
              .first()
              .isVisible({ timeout: 200 })
              .catch(() => false);
            if (hasPassword) {
              found = tab;
              return true;
            }
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [100, 250, 500] },
      )
      .toBeTruthy()
      .catch(() => {});
    return found;
  }

  private async isSellTabActive(): Promise<boolean> {
    const sellTab = this.page.getByRole('radio', { name: /^SELL$/i }).first();
    return sellTab.isChecked({ timeout: 400 }).catch(() => false);
  }

  /** SELL tab selected and list is not BUY/SHOP/Delivery content. */
  private async isSellTabListRendered(): Promise<boolean> {
    if (await this.page.getByRole('radio', { name: /^BUY$/i }).first().isChecked({ timeout: 400 }).catch(() => false)) {
      return false;
    }
    if (!(await this.isSellTabActive())) {
      return false;
    }

    if (await this.page.getByText(/^ORDERED ON/i).first().isVisible({ timeout: 300 }).catch(() => false)) {
      return false;
    }
    if (
      await this.page
        .getByRole('button', { name: /^view detail$/i })
        .first()
        .isVisible({ timeout: 300 })
        .catch(() => false)
    ) {
      return false;
    }

    if (await this.noRecordLabel.isVisible({ timeout: 400 }).catch(() => false)) {
      return true;
    }

    return this.orderRows
      .first()
      .isVisible({ timeout: 400 })
      .catch(() => false);
  }

  /** True when SELL-tab rows are populated (not empty skeletons / stale BUY narrations). */
  private async isSellOrderListHydrated(): Promise<boolean> {
    if (!(await this.isSellTabListRendered())) {
      return false;
    }
    if (await this.noRecordLabel.isVisible({ timeout: 400 }).catch(() => false)) {
      return true;
    }

    const rows = this.orderRows;
    const count = Math.min(await rows.count().catch(() => 0), 8);
    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      if (!(await row.isVisible({ timeout: 300 }).catch(() => false))) {
        continue;
      }
      const txnId = (
        (await row
          .locator('div.text-10:has-text("Transaction ID")')
          .first()
          .locator('xpath=following-sibling::div[1]')
          .first()
          .textContent()
          .catch(() => '')) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const narration = (
        (await row
          .locator('div.text-10:has-text("Narration")')
          .first()
          .locator('xpath=following-sibling::div[1]')
          .first()
          .textContent()
          .catch(() => '')) ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      if (txnId.replace(/\D/g, '').length >= 3 && narration.length > 0 && !/\bbought\b/i.test(narration)) {
        return true;
      }
      if (txnId.replace(/\D/g, '').length >= 3 && /\bsold\b/i.test(narration)) {
        return true;
      }
    }
    return false;
  }

  /** Wait until SELL tab is active and sell rows are populated (not stale BUY/SHOP content). */
  private async waitForSellOrderListHydrated(timeoutMs = 45_000): Promise<void> {
    const sellTab = this.page.getByRole('radio', { name: /^SELL$/i }).first();
    let lastTabClickMs = 0;

    await expect
      .poll(
        async () => {
          if (!(await this.isSellTabListRendered())) {
            return false;
          }
          if (await this.isSellOrderListHydrated()) {
            return true;
          }

          const now = Date.now();
          if (lastTabClickMs === 0 || now - lastTabClickMs >= 10_000) {
            lastTabClickMs = now;
            await sellTab.scrollIntoViewIfNeeded().catch(() => {});
            await sellTab.click({ force: true }).catch(() => {});
            await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000, 3000] },
      )
      .toBeTruthy();
  }

  private async clickSellTabAndWaitForList(hydrateTimeoutMs = 45_000): Promise<void> {
    const sellTab = this.page.getByRole('radio', { name: /^SELL$/i }).first();
    await sellTab.scrollIntoViewIfNeeded();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await sellTab.click({ force: true });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.waitForSellOrderListHydrated(hydrateTimeoutMs);
  }

  /** TC001 / TC004 — single product on SHOP tab (main-branch click + list hydrate). */
  async clickShopTabSingleOrder(): Promise<void> {
    await this.clickShopTabAndWaitForList(20_000);
  }

  /** TC002 / TC003 — multiple products; same tab settle, rows read by exact product name. */
  async clickShopTabMultiProduct(): Promise<void> {
    await this.clickShopTabAndWaitForList(20_000);
  }

  private async clickShopTabAndWaitForList(hydrateTimeoutMs = 20_000): Promise<void> {
    const shopTab = this.page.getByRole('radio', { name: /^SHOP$/i }).first();
    await shopTab.scrollIntoViewIfNeeded();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await shopTab.click({ force: true });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.waitForShopOrderListHydrated(hydrateTimeoutMs);
  }

  /** Scroll SHOP list until the product row is in view. */
  async waitForShopProductOnList(productName: string, timeoutMs = 60_000): Promise<void> {
    await this.resolveShopOrderCardIndex(productName, timeoutMs);
  }

  /** Read shop-tab list row by order id (preferred when multiple products were ordered). */
  async getShopOrderListDetailsByOrderId(
    orderId: string,
    options?: { skipTabLoadWait?: boolean; productName?: string },
  ): Promise<MyOrderShopCardDetails> {
    if (!options?.skipTabLoadWait) {
      await this.waitForShopOrderIdOnList(orderId, { productName: options?.productName });
    }
    const card = await this.resolveShopOrderCardByOrderId(orderId, options?.productName);

    let orderedOn = '';
    try {
      orderedOn = await this.readShopOrderDate(card);
    } catch {
      orderedOn = '';
    }

    return {
      productName: await this.text(card.getByRole('heading', { level: 3 }).first()),
      orderId: await this.readShopLabel(card, 'Order Id'),
      status: await this.text(card.locator('span.rounded-full').first()),
      quantity: Number((await this.readShopLabel(card, 'Quantity')).replace(/\D/g, '') || '0'),
      priceAmount: this.parseAmount(await this.text(card.locator('p').filter({ hasText: /^₹/ }).first())),
      orderedOn,
    };
  }

  /** TC004 — read shop-tab card from list only (no View Detail). */
  async getShopOrderListDetails(options: {
    productName: string;
    orderId?: string;
    /** Set when {@link clickShopTab} already waited for shop list data. */
    skipTabLoadWait?: boolean;
  }): Promise<MyOrderShopCardDetails> {
    if (options.orderId) {
      return this.getShopOrderListDetailsByOrderId(options.orderId, {
        skipTabLoadWait: options.skipTabLoadWait,
      });
    }

    if (!options.skipTabLoadWait) {
      await this.waitForShopTabDataLoaded({
        productName: options.productName,
        timeoutMs: 45_000,
        requireTabChecked: false,
      });
    }
    const card = this.shopOrderCards().nth(await this.resolveShopOrderCardIndex(options.productName));
    await card.scrollIntoViewIfNeeded();
    await card.waitFor({ state: 'visible', timeout: 45_000 });

    let orderedOn = '';
    try {
      orderedOn = await this.readShopOrderDate(card);
    } catch {
      orderedOn = '';
    }

    return {
      productName: await this.text(card.getByRole('heading', { level: 3 }).first()),
      orderId: await this.readShopLabel(card, 'Order Id'),
      status: await this.text(card.locator('span.rounded-full').first()),
      quantity: Number((await this.readShopLabel(card, 'Quantity')).replace(/\D/g, '') || '0'),
      priceAmount: this.parseAmount(await this.text(card.locator('p').filter({ hasText: /^₹/ }).first())),
      orderedOn,
    };
  }

  async clickSellTab(): Promise<void> {
    this.selectedOrderRow = null;
    await this.clickSellTabAndWaitForList(45_000);
  }

  async goToMyOrders(): Promise<void> {
    const onAuthenticatedMyOrders = (): boolean => {
      const u = this.page.url();
      return /my-orders/i.test(u) && !/\/login/i.test(u);
    };

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await this.page.goto('/my-orders', { waitUntil: 'domcontentloaded' });
      await this.page.waitForURL(/\/my-orders/i, { timeout: 12_000 }).catch(() => {});
      await this.waitForMyOrdersListReady(12_000);

      if (onAuthenticatedMyOrders()) {
        return;
      }

      if (/\/login/i.test(this.page.url()) && attempt < 2) {
        await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await this.page.waitForURL(/\/dashboard/i, { timeout: 10_000 }).catch(() => {});
        continue;
      }

      break;
    }

    if (/\/login/i.test(this.page.url())) {
      throw new Error(
        'My Orders opened the login page (session missing or expired). Re-run: npx playwright test --project=auth-setup',
      );
    }

    await this.page.waitForURL(/my-orders/i, { timeout: 20_000 });
  }

  async getShopOrderDetails(
    productName: string,
    _options?: { skipTabLoadWait?: boolean },
  ): Promise<MyOrderShopCardDetails> {
    const card = await this.resolveShopOrderCard(productName);
    return this.readShopOrderCardDetails(card);
  }

  private async resolveShopOrderCard(productName: string, timeoutMs = 60_000): Promise<Locator> {
    const index = await this.resolveShopOrderCardIndex(productName, timeoutMs);
    const card = this.shopOrderCards().nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.waitFor({ state: 'visible', timeout: 45_000 });
    return card;
  }

  private async resolveShopOrderCardByOrderId(orderId: string, productName?: string): Promise<Locator> {
    const index = await this.resolveShopOrderCardIndexByOrderId(orderId, {
      productName,
      timeoutMs: 90_000,
    });
    const card = this.shopOrderCards().nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.waitFor({ state: 'visible', timeout: 45_000 });
    return card;
  }

  private async readShopOrderCardDetails(card: Locator): Promise<MyOrderShopCardDetails> {
    return {
      productName: await this.text(card.getByRole('heading', { level: 3 }).first()),
      orderId: await this.readShopLabel(card, 'Order Id'),
      status: await this.text(card.locator('span.rounded-full').first()),
      quantity: Number((await this.readShopLabel(card, 'Quantity')).replace(/\D/g, '') || '0'),
      priceAmount: this.parseAmount(await this.text(card.locator('p').filter({ hasText: /^₹/ }).first())),
      orderedOn: await this.readShopOrderDate(card),
    };
  }

  /** TC003 EMI shop tab row — no Quantity label; quantity defaults to 1. */
  async getShopEmiOrderDetails(productName: string): Promise<MyOrderShopCardDetails> {
    const card = await this.resolveShopOrderCard(productName);

    const quantityLabel = card.getByText(/^Quantity\s*:?/i).first();
    const hasQuantity = await quantityLabel.isVisible({ timeout: 2_000 }).catch(() => false);
    let quantity = 1;
    if (hasQuantity) {
      const raw = await this.readShopLabel(card, 'Quantity');
      const parsed = Number(raw.replace(/\D/g, '') || '0');
      quantity = parsed > 0 ? parsed : 1;
    }

    return {
      productName: await this.text(card.getByRole('heading', { level: 3 }).first()),
      orderId: await this.readShopLabel(card, 'Order Id'),
      status: await this.text(card.locator('span.rounded-full').first()),
      quantity,
      priceAmount: this.parseAmount(await this.text(card.locator('p').filter({ hasText: /^₹/ }).first())),
      orderedOn: await this.readShopOrderDate(card),
    };
  }

  async getShopOrderDate(productName: string): Promise<string> {
    const card = await this.resolveShopOrderCard(productName);
    return this.readShopOrderDate(card);
  }

  /** TC001 / TC004 — open View Detail for the single shop order row. */
  async openShopOrderDetailSingle(productName: string): Promise<void> {
    await this.openShopOrderDetailForProduct(productName, 'single');
  }

  /** TC002 / TC003 — open View Detail for one of several shop order rows. */
  async openShopOrderDetailMulti(
    productName: string,
    options?: { orderId?: string },
  ): Promise<void> {
    await this.openShopOrderDetailForProduct(productName, 'multi', options?.orderId);
  }

  private async openShopOrderDetailForProduct(
    productName: string,
    flow: 'single' | 'multi',
    orderId?: string,
  ): Promise<void> {
    const onOrderDetail = await this.shopOrderDetailPanel()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    const u = this.page.url();
    const needMyOrdersList =
      !/\/my-orders/i.test(u) || /\/shop-new\/order\//i.test(u) || onOrderDetail || (flow === 'multi' && !!orderId);

    if (needMyOrdersList) {
      await this.goToMyOrders();
      if (flow === 'single') {
        await this.clickShopTabSingleOrder();
      } else {
        await this.clickShopTabMultiProduct();
      }
    }

    const card = orderId
      ? await this.resolveShopOrderCardByOrderId(orderId, productName)
      : await this.resolveShopOrderCard(productName);
    await card.getByRole('button', { name: /view detail/i }).first().click();
    const panel = this.shopOrderDetailPanelForProduct(productName);
    await panel.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(panel.getByRole('heading', { level: 3 }).first()).toContainText(productName, {
      timeout: 20_000,
    });
    await this.scrollToShopInvoiceSection();
  }

  /** TC003 EMI Booked row — click Pay Now on the shop-tab card to open the EMI order summary. */
  async openShopEmiOrderDetail(productName: string): Promise<void> {
    const u = this.page.url();
    if (!/\/my-orders/i.test(u) || /\/shop-new\/order\//i.test(u)) {
      await this.goToMyOrders();
      await this.clickShopTabMultiProduct();
    }

    const card = await this.resolveShopOrderCard(productName);
    await card.getByRole('button', { name: /^pay now$/i }).click();

    const panel = this.shopEmiOrderDetailPanel();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(panel.getByRole('heading', { level: 3 }).first()).toContainText(productName, {
      timeout: 20_000,
    });
    await expect(panel.getByRole('button', { name: /^pay now$/i })).toBeVisible();
    await expect(panel.getByRole('button', { name: /cancel booking/i })).toBeVisible();
  }

  /** Read product, weight, quantity, price and due date from the EMI Pay Now summary panel. */
  async getShopEmiOrderDetailView(): Promise<MyOrderShopEmiDetailViewDetails> {
    const panel = this.shopEmiOrderDetailPanel();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });

    let quantity = 1;
    const quantityLabel = panel.getByText(/^Quantity:/i).first();
    if (await quantityLabel.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const quantityValue = quantityLabel.locator('xpath=following-sibling::*[1]').first();
      quantity = Number((await this.text(quantityValue)).replace(/\D/g, '') || '1') || 1;
    }

    return {
      productName: await this.text(panel.getByRole('heading', { level: 3 }).first()),
      netWeight: await this.text(panel.getByText(/Net weight:/i).first()),
      quantity,
      priceAmount: this.parseAmount(
        await this.text(panel.locator('p.font-bold').filter({ hasText: /₹/ }).first()),
      ),
      dueOn: await this.text(panel.getByText(/^DUE ON/i).first()),
    };
  }

  /** Navigate to shop order detail before opening the invoice PDF. */
  async prepareShopOrderDetailForInvoice(
    productName: string,
    flow: 'single' | 'multi' = 'single',
    options?: { orderId?: string },
  ): Promise<void> {
    if (await this.isShopOrderDetailReadyForInvoiceWithProduct(productName)) {
      await this.scrollToShopInvoiceSection();
      return;
    }
    await this.goToMyOrders();
    if (flow === 'single') {
      await this.clickShopTabSingleOrder();
      await this.openShopOrderDetailSingle(productName);
    } else {
      await this.clickShopTabMultiProduct();
      await this.openShopOrderDetailMulti(productName, { orderId: options?.orderId });
    }
    await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * TC003 EMI — open order detail where Address Details and Invoice are visible.
   * Uses Pay Now on the shop-tab card (Booked EMI rows); does not click Pay Now inside the summary panel.
   */
  async openShopEmiOrderDetailForInvoice(productName: string): Promise<void> {
    const u = this.page.url();
    const currentHeading = await this.resolveShopOrderDetailProductHeading();
    const needMyOrders =
      !/\/my-orders/i.test(u) ||
      /\/shop-new\/order\//i.test(u) ||
      (currentHeading.length > 0 && !currentHeading.includes(productName));
    if (needMyOrders) {
      await this.goToMyOrders();
      await this.clickShopTabMultiProduct();
    }

    const card = await this.resolveShopOrderCard(productName);
    await card.scrollIntoViewIfNeeded();

    const viewDetailBtn = card.getByRole('button', { name: /view detail/i });
    if (await viewDetailBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await viewDetailBtn.click();
    } else {
      await card.getByRole('button', { name: /^pay now$/i }).click();
      await this.shopEmiOrderDetailPanel().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    }

    await this.scrollToShopInvoiceSection();
    await this.shopInvoiceButton().waitFor({ state: 'visible', timeout: 20_000 });

    const heading = await this.resolveShopOrderDetailProductHeading();
    if (!heading.includes(productName)) {
      throw new Error(
        `EMI order detail for invoice does not show "${productName}" (got "${heading || '(empty)'}").`,
      );
    }
  }

  /** TC003 EMI order detail before invoice — lands on Address Details + Invoice UI. */
  async prepareShopEmiOrderDetailForInvoice(productName: string): Promise<void> {
    await this.openShopEmiOrderDetailForInvoice(productName);
  }

  /**
   * Use existing order detail from step 13 when possible; otherwise open via My Orders.
   * Default behavior matches single-product flows (e.g. TC_SHOP_001): skip when invoice UI is ready.
   * Pass `requireMatchingProduct: true` for multi-product flows so we do not skip when another
   * product's order detail is still open.
   */
  async ensureShopOrderDetailForInvoice(
    productName: string,
    options?: {
      requireMatchingProduct?: boolean;
      /** TC001/TC004 = single; TC002/TC003 = multi (default from requireMatchingProduct). */
      flow?: 'single' | 'multi';
      orderId?: string;
    },
  ): Promise<void> {
    const flow = options?.flow ?? (options?.requireMatchingProduct ? 'multi' : 'single');
    const requireProduct = options?.requireMatchingProduct === true;
    if (requireProduct) {
      if (await this.isShopOrderDetailReadyForInvoiceWithProduct(productName)) {
        this.logShopInvoice(0, 'Order detail already open — scroll to Invoice');
        await this.scrollToShopInvoiceSection();
        return;
      }
    } else if (await this.isShopOrderDetailReadyForInvoice()) {
      this.logShopInvoice(0, 'Order detail already open — scroll to Invoice');
      await this.scrollToShopInvoiceSection();
      return;
    }
    await this.prepareShopOrderDetailForInvoice(productName, flow, { orderId: options?.orderId });
  }

  /** TC003 EMI — same as ensureShopOrderDetailForInvoice but opens EMI invoice-ready detail. */
  async ensureShopEmiOrderDetailForInvoice(
    productName: string,
    options?: { requireMatchingProduct?: boolean },
  ): Promise<void> {
    const requireProduct = options?.requireMatchingProduct === true;
    if (requireProduct) {
      if (await this.isShopEmiOrderDetailReadyForInvoiceWithProduct(productName)) {
        this.logShopInvoice(0, 'EMI order detail already open — skip My Orders navigation');
        return;
      }
    } else if (await this.isShopOrderDetailReadyForInvoice()) {
      this.logShopInvoice(0, 'Order detail already open — skip My Orders navigation');
      return;
    }
    await this.prepareShopEmiOrderDetailForInvoice(productName);
  }

  private async isShopOrderDetailReadyForInvoice(): Promise<boolean> {
    const hasAddress = await this.addressDetailsHeading().isVisible({ timeout: 2_000 }).catch(() => false);
    const hasInvoice = await this.shopInvoiceButton().isVisible({ timeout: 2_000 }).catch(() => false);
    return hasAddress && hasInvoice;
  }

  private async isShopOrderDetailReadyForInvoiceWithProduct(productName: string): Promise<boolean> {
    if (!(await this.isShopOrderDetailReadyForInvoice())) {
      return false;
    }
    const heading = await this.resolveShopOrderDetailProductHeading();
    return heading.includes(productName);
  }

  private async isShopEmiOrderDetailReadyForInvoiceWithProduct(productName: string): Promise<boolean> {
    return this.isShopOrderDetailReadyForInvoiceWithProduct(productName);
  }

  private async resolveShopOrderDetailProductHeading(): Promise<string> {
    const standard = this.shopOrderDetailPanel().getByRole('heading', { level: 3 }).first();
    if (await standard.isVisible({ timeout: 1_500 }).catch(() => false)) {
      return this.text(standard);
    }
    const emi = this.shopEmiOrderDetailPanel().getByRole('heading', { level: 3 }).first();
    if (await emi.isVisible({ timeout: 1_500 }).catch(() => false)) {
      return this.text(emi);
    }
    return '';
  }

  /** Scroll until Address Details (and Invoice) are in view on long EMI order pages. */
  private async scrollToShopInvoiceSection(): Promise<void> {
    const addressHeading = this.addressDetailsHeading();
    for (let i = 0; i < 8; i += 1) {
      if (await addressHeading.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await addressHeading.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
        return;
      }
      await this.page.keyboard.press('PageDown');
      await expect
        .poll(async () => addressHeading.isVisible({ timeout: 200 }).catch(() => false), {
          timeout: 1_500,
          intervals: [100, 200, 400],
        })
        .toBeTruthy()
        .catch(() => false);
    }
    await addressHeading.waitFor({ state: 'visible', timeout: 20_000 });
    await addressHeading.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
    const invoiceBtn = this.shopInvoiceButtonInAddressSection();
    if (await invoiceBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await invoiceBtn.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => {});
    }
  }

  private resetShopInvoiceCapture(): void {
    this.invoicePdfHref = null;
    this.invoicePdfPage = null;
  }

  /**
   * Clears cached invoice URL/page and closes PDF viewer tabs before opening another shop order's invoice.
   * Needed when checkout returns separate order ids (one PDF per product).
   */
  async resetShopInvoiceSession(): Promise<void> {
    this.resetShopInvoiceCapture();
    await this.page.bringToFront().catch(() => {});
    for (const p of this.page.context().pages()) {
      if (p === this.page || p.isClosed()) {
        continue;
      }
      if (MyOrderVerificationPage.isInvoicePdfUrl(p.url())) {
        await p.close().catch(() => {});
      }
    }
  }

  async getShopOrderDetailView(): Promise<MyOrderShopDetailViewDetails> {
    const panel = this.shopOrderDetailPanel();
    await panel.waitFor({ state: 'visible' });

    const quantityLabel = panel.getByText(/^Quantity:/i).first();
    const quantityValue = quantityLabel.locator('xpath=following-sibling::*[1]').first();

    return {
      productName: await this.text(panel.getByRole('heading', { level: 3 }).first()),
      netWeight: await this.text(panel.getByText(/Net weight:/i)),
      quantity: Number((await this.text(quantityValue)).replace(/\D/g, '') || '0'),
      priceAmount: this.parseAmount(await this.text(panel.getByText(/₹\s*[\d,]+/).first())),
    };
  }

  async getShopOrderDetailStatusAndDate(): Promise<MyOrderShopDetailStatusAndDate> {
    const metaLine = await this.text(this.page.getByText(/ORDER ID:\s*\d+/i).first());
    const orderId = metaLine.match(/ORDER\s*ID:\s*(\d+)/i)?.[1] ?? '';
    const orderedPart = metaLine.match(/ORDERED ON\s+(.+)/i)?.[1]?.trim() ?? '';
    const status = await this.text(this.page.getByText(/Payment Received/i).first());

    return {
      orderId,
      status,
      orderedOn: orderedPart ? `ORDERED ON ${orderedPart}` : metaLine,
    };
  }

  async getShopOrderDetailDateTime(): Promise<MyOrderShopDetailDateTime> {
    const dateTimeEl = this.page
      .locator('p.text-gray-600.font-medium')
      .filter({ hasText: /\|\s*\d{1,2}:\d{2}/i })
      .first();
    await dateTimeEl.waitFor({ state: 'visible', timeout: 15_000 });
    const dateTimeText = await this.text(dateTimeEl);
    const [orderDate = '', orderTime = ''] = dateTimeText.split('|').map((part) => part.trim());

    return { dateTimeText, orderDate, orderTime };
  }

  /** Scroll to Address Details, click Invoice, and store the PDF tab/URL. */
  async clickShopInvoice(options?: {
    maxAttempts?: number;
    captureTimeoutMs?: number;
    productName?: string;
    orderId?: string;
    /** TC003 EMI — re-open invoice-ready detail via Pay Now, not View Detail. */
    useEmiOrderDetail?: boolean;
  }): Promise<void> {
    const maxAttempts = options?.maxAttempts ?? 4;
    const captureTimeoutMs = options?.captureTimeoutMs ?? 12_000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (attempt > 1) {
        this.logShopInvoice(0, `Retry ${attempt}/${maxAttempts} — refresh order detail`);
        this.resetShopInvoiceCapture();
        if (options?.productName && attempt === 2) {
          const detailOpen = await this.addressDetailsHeading().isVisible({ timeout: 2_000 }).catch(() => false);
          if (detailOpen) {
            await this.page.reload({ waitUntil: 'domcontentloaded' });
          } else if (options.useEmiOrderDetail) {
            await this.prepareShopEmiOrderDetailForInvoice(options.productName);
          } else {
            await this.prepareShopOrderDetailForInvoice(
              options.productName,
              options.useEmiOrderDetail ? 'multi' : 'single',
            );
          }
        } else {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
        }
        await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
        await this.scrollToShopInvoiceSection();
        await this.shopInvoiceButtonInAddressSection().waitFor({ state: 'visible', timeout: 15_000 });
      }

      try {
        await this.captureShopInvoicePdf(captureTimeoutMs);
        return;
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }
      }
    }
  }

  private async captureShopInvoicePdf(captureTimeoutMs: number): Promise<void> {
    this.logShopInvoice(1, 'Close profile menu if open');
    await this.dismissProfileMenu();

    this.logShopInvoice(2, 'Scroll to Address Details and Invoice button');
    await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
    await this.scrollToShopInvoiceSection();

    this.logShopInvoice(3, `Register PDF listener then click Invoice (wait up to ${captureTimeoutMs}ms)`);
    let networkUrl: string | null = null;
    const onResponse = async (response: Response) => {
      if (networkUrl) {
        return;
      }
      const url = response.url();
      if (MyOrderVerificationPage.isInvoicePdfUrl(url)) {
        this.logShopInvoice(4, `Captured PDF URL from network | ${url.slice(0, 120)}`);
        networkUrl = url;
        return;
      }
      if (!/invoice|finalInvoice|\.pdf|emi-backend-api\.gfau\.augmont\.com/i.test(url)) {
        return;
      }
      try {
        const body = await response.json();
        const fromJson = MyOrderVerificationPage.findPdfUrlInJson(body, url);
        if (fromJson) {
          this.logShopInvoice(4, `Captured PDF URL from JSON | ${fromJson.slice(0, 120)}`);
          networkUrl = fromJson;
        }
      } catch {
        // not JSON
      }
    };
    this.page.context().on('response', onResponse);

    try {
      await this.clickShopInvoiceButton();
    } catch (clickError) {
      this.page.context().off('response', onResponse);
      throw clickError;
    }

    this.logShopInvoice(4, 'Wait for invoice PDF URL');
    let pdfTab: Page | null = null;
    let viewerPage: Page | null = null;

    await expect
      .poll(
        async () => {
          if (networkUrl) {
            return true;
          }
          for (const tab of this.page.context().pages()) {
            if (!tab.isClosed() && MyOrderVerificationPage.isInvoicePdfUrl(tab.url())) {
              networkUrl = tab.url();
              pdfTab = tab;
              this.logShopInvoice(4, `Captured PDF URL from tab | ${networkUrl.slice(0, 120)}`);
              return true;
            }
          }
          viewerPage = await this.waitForInvoiceViewerPage(250);
          if (viewerPage && MyOrderVerificationPage.isInvoicePdfUrl(viewerPage.url())) {
            networkUrl = viewerPage.url();
            pdfTab = viewerPage;
            return true;
          }
          return false;
        },
        { timeout: captureTimeoutMs, intervals: [100, 250, 500] },
      )
      .toBeTruthy();

    this.page.context().off('response', onResponse);

    if (!networkUrl) {
      throw new Error('Invoice PDF URL not found after clicking Invoice.');
    }
    const resolvedUrl = networkUrl as string;

    this.logShopInvoice(5, 'Resolve PDF URL from capture');
    this.invoicePdfHref = resolvedUrl;
    this.invoicePdfPage = pdfTab ?? viewerPage ?? this.page;
    if (this.invoicePdfPage) {
      await this.invoicePdfPage.bringToFront();
    }
    this.logShopInvoice(6, `PDF ready | url=${resolvedUrl.slice(0, 100)}`);
  }

  private async dismissProfileMenu(): Promise<void> {
    const menu = this.page.locator('menu[active]');
    if (await menu.isVisible().catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  private static findPdfUrlInJson(value: unknown, baseUrl: string): string | null {
    if (typeof value === 'string' && /\.pdf/i.test(value)) {
      return value.startsWith('http') ? value : new URL(value, baseUrl).toString();
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = MyOrderVerificationPage.findPdfUrlInJson(item, baseUrl);
        if (found) {
          return found;
        }
      }
    }
    if (value && typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        const found = MyOrderVerificationPage.findPdfUrlInJson(nested, baseUrl);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /** Enter mobile last-4 password and submit on the invoice PDF viewer. */
  async submitShopInvoicePassword(mobile: string): Promise<void> {
    const password = mobile.replace(/\D/g, '').slice(-4);
    const pdfPage = this.invoicePdfPage ?? this.page;

    this.logShopInvoice(7, `Enter PDF password (last 4 digits of mobile)`);
    const passwordInput = pdfPage.locator('input[type="password"]').first();

    if (await passwordInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await passwordInput.fill(password);
    } else {
      await pdfPage.keyboard.type(password, { delay: 100 });
    }

    this.logShopInvoice(8, 'Submit PDF password');
    const submitBtn = pdfPage.locator('cr-button#submit');
    if (await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.click();
    } else {
      await pdfPage.keyboard.press('Enter');
    }
    this.logShopInvoice(9, 'PDF password submitted');
  }

  async getShopInvoicePdfUrl(): Promise<string> {
    if (this.invoicePdfHref) {
      this.logShopInvoice(10, `Return stored PDF URL | ${this.invoicePdfHref.slice(0, 100)}`);
      return this.invoicePdfHref;
    }
    if (this.invoicePdfPage && MyOrderVerificationPage.isInvoicePdfUrl(this.invoicePdfPage.url())) {
      return this.invoicePdfPage.url();
    }
    throw new Error('Shop invoice PDF URL not found.');
  }

  isOrderDateToday(orderDate: string): boolean {
    const trimmed = orderDate.trim().replace(/^ORDERED ON\s+/i, '');
    const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{2,4}))?/i);
    if (match) {
      const day = Number(match[1]);
      const monthIndex = new Date(`${match[2]} 1, 2000`).getMonth();
      if (Number.isNaN(monthIndex)) {
        return false;
      }
      const today = new Date();
      if (day !== today.getDate() || monthIndex !== today.getMonth()) {
        return false;
      }
      if (!match[3]) {
        return true;
      }
      let year = Number(match[3]);
      if (year < 100) {
        return true;
      }
      return year === today.getFullYear();
    }

    const orderedDate = new Date(trimmed);
    if (Number.isNaN(orderedDate.getTime())) {
      return false;
    }
    const today = new Date();
    return (
      orderedDate.getFullYear() === today.getFullYear() &&
      orderedDate.getMonth() === today.getMonth() &&
      orderedDate.getDate() === today.getDate()
    );
  }

  async getShopOrderProductProperties(): Promise<MyOrderShopProductPropertiesDetails> {
    await this.expandShopAccordion(/Product Properties/i);
    const panel = this.page.getByRole('region', { name: /Product Properties/i });

    return {
      sku: await this.readProductPropertyValue(panel, 'SKU'),
      metalType: await this.readProductPropertyValue(panel, 'Metal Type'),
      purity: await this.readProductPropertyValue(panel, 'Purity'),
      productWeight: await this.readProductPropertyValue(panel, 'Product Weight'),
    };
  }

  async getShopOrderAddress(type: 'received' | 'billed'): Promise<ShopBillingAddressDetails> {
    const label = type === 'received' ? /Recieved At|Received At/i : /Billed to|Billed At/i;
    return this.readShopOrderAddressAccordion(label);
  }

  isOrderedOnToday(orderedOn: string): boolean {
    const dateText = orderedOn.replace(/^ORDERED ON\s+/i, '').trim();
    const orderedDate = new Date(dateText);
    if (Number.isNaN(orderedDate.getTime())) {
      return false;
    }
    const today = new Date();
    return (
      orderedDate.getFullYear() === today.getFullYear() &&
      orderedDate.getMonth() === today.getMonth() &&
      orderedDate.getDate() === today.getDate()
    );
  }

  async getShopOrderPaymentMethod(): Promise<string> {
    const paymentRow = this.page
      .locator('motion.div.flex, div.flex')
      .filter({ has: this.page.locator('i.pi-wallet') })
      .first();
    await paymentRow.waitFor({ state: 'visible', timeout: 15_000 });
    return this.text(paymentRow.locator('p.font-semibold').first());
  }

  private async readShopOrderAddressAccordion(namePattern: RegExp): Promise<ShopBillingAddressDetails> {
    const header = this.page.getByRole('button', { name: namePattern }).first();
    await header.waitFor({ state: 'visible', timeout: 15_000 });
    if ((await header.getAttribute('aria-expanded')) !== 'true') {
      await header.click();
    }

    const controlsId = await header.getAttribute('aria-controls');
    const content = controlsId
      ? this.page.locator(`#${controlsId}`)
      : header.locator('xpath=following-sibling::*[1]');
    await content.locator('p.text-gray-600').first().waitFor({ state: 'visible', timeout: 10_000 });

    const headerText = await this.text(header);
    const headerMatch = headerText.match(/(?:Billed to|Billed At|Recieved At|Received At)\s+(.+?),\s*(\d{6})/i);
    const lines = (await content.locator('p.text-gray-600').allTextContents())
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const pinLine = lines.find((line) => /\b\d{6}\b/.test(line)) ?? '';
    const pincode = pinLine.match(/\b(\d{6})\b/)?.[1] ?? headerMatch?.[2] ?? '';
    const mobile = lines.find((line) => line.replace(/\D/g, '').length === 10)?.replace(/\D/g, '') ?? '';

    return {
      fullName: headerMatch?.[1]?.trim() ?? '',
      mobile,
      address: lines.filter((line) => line !== pinLine && line.replace(/\D/g, '') !== mobile).join(', '),
      pincode,
    };
  }

  private async expandShopAccordion(name: RegExp): Promise<void> {
    const header = this.page.getByRole('button', { name }).first();
    if ((await header.getAttribute('aria-expanded')) !== 'true') {
      await header.click();
    }
  }

  private async readProductPropertyValue(panel: Locator, label: string): Promise<string> {
    const row = panel
      .getByRole('heading', { name: label, level: 4, exact: true })
      .locator('xpath=parent::*');
    return this.text(row.getByRole('heading', { level: 4 }).last());
  }

  private shopOrderDetailPanel(): Locator {
    return this.page
      .locator('motion.div.flex.flex-col.gap-4, div.flex.flex-col.gap-4')
      .filter({ has: this.page.getByRole('heading', { level: 3 }) })
      .filter({ has: this.page.getByText(/Net weight:/i) })
      .first();
  }

  private shopOrderDetailPanelForProduct(productName: string): Locator {
    return this.page
      .locator('motion.div.flex.flex-col.gap-4, div.flex.flex-col.gap-4')
      .filter({ has: this.page.getByRole('heading', { level: 3, name: productName }) })
      .filter({ has: this.page.getByText(/Net weight:/i) })
      .first();
  }

  /** EMI Pay Now summary (Pay Now + Cancel Booking + DUE ON footer). */
  private shopEmiOrderDetailPanel(): Locator {
    return this.page
      .locator('div.bg-sheengold-ochre.rounded-lg.shadow-sm, motion.div.bg-sheengold-ochre.rounded-lg.shadow-sm')
      .filter({ has: this.page.getByRole('button', { name: /^pay now$/i }) })
      .filter({ has: this.page.getByRole('button', { name: /cancel booking/i }) })
      .filter({ has: this.page.getByText(/Net weight:/i) })
      .filter({ has: this.page.getByText(/^DUE ON/i) })
      .first();
  }

  private shopOrderCard(productName: string): Locator {
    const heading = this.page.getByRole('heading', { level: 3, name: productName, exact: true });
    const listRow = this.page
      .locator('div')
      .filter({ has: heading })
      .filter({ has: this.page.getByText(/^Order Id:/i) })
      .filter({ has: this.page.getByRole('button', { name: /^view detail$/i }) });
    const ochre = this.page
      .locator('motion.div.bg-sheengold-ochre, div.bg-sheengold-ochre')
      .filter({ has: heading });
    return ochre.or(listRow).first();
  }

  /** Find shop-tab row index by exact product heading (avoids partial regex matching wrong coin weight). */
  private async resolveShopOrderCardIndex(productName: string, timeoutMs = 60_000): Promise<number> {
    let foundIndex = -1;
    await expect
      .poll(
        async () => {
          const cards = this.shopOrderCards();
          const count = await cards.count().catch(() => 0);
          for (let i = 0; i < count; i += 1) {
            const heading = (
              await this.text(cards.nth(i).getByRole('heading', { level: 3 }).first())
            ).trim();
            if (heading === productName) {
              foundIndex = i;
              return true;
            }
          }
          await this.scrollShopOrdersListDown();
          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000] },
      )
      .toBeTruthy();

    if (foundIndex < 0) {
      throw new Error(`Shop order card not found for "${productName}".`);
    }
    return foundIndex;
  }

  /** Find shop-tab row index by order id (optional product heading disambiguates shared ids). */
  private async resolveShopOrderCardIndexByOrderId(
    orderId: string,
    options?: { productName?: string; timeoutMs?: number },
  ): Promise<number> {
    const target = orderId.replace(/\D/g, '');
    const timeoutMs = options?.timeoutMs ?? 90_000;
    let foundIndex = -1;

    await expect
      .poll(
        async () => {
          const cards = this.shopOrderCards();
          const count = await cards.count().catch(() => 0);
          for (let i = 0; i < count; i += 1) {
            const card = cards.nth(i);
            if (!(await card.isVisible({ timeout: 250 }).catch(() => false))) {
              continue;
            }
            const idText = (await this.readShopLabel(card, 'Order Id').catch(() => '')).replace(/\D/g, '');
            if (idText !== target) {
              continue;
            }
            if (options?.productName) {
              const heading = (
                await this.text(card.getByRole('heading', { level: 3 }).first())
              ).trim();
              if (heading !== options.productName) {
                continue;
              }
            }
            foundIndex = i;
            return true;
          }
          await this.scrollShopOrdersListDown();
          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000] },
      )
      .toBeTruthy();

    if (foundIndex < 0) {
      throw new Error(`Shop order card not found for order id "${orderId}".`);
    }
    return foundIndex;
  }

  private shopOrderCardByOrderId(orderId: string, productName?: string): Locator {
    let card = this.page
      .locator('div')
      .filter({ has: this.page.getByText(new RegExp(`Order Id:?\\s*${orderId}`, 'i')) })
      .filter({ has: this.page.getByRole('button', { name: /^view detail$/i }) })
      .filter({ has: this.page.getByRole('heading', { level: 3 }) });
    if (productName) {
      card = card.filter({
        has: this.page.getByRole('heading', { level: 3, name: productName, exact: true }),
      });
    }
    return card.first();
  }

  private async readShopOrderDate(card: Locator): Promise<string> {
    const inCard = card.locator('span').filter({ hasText: /^ORDERED ON/i }).first();
    if (await inCard.isVisible({ timeout: 1_000 }).catch(() => false)) {
      return this.text(inCard);
    }
    const following = card.locator('xpath=following-sibling::*[1]').filter({ hasText: /^ORDERED ON/i }).first();
    return this.text(following);
  }

  private async readShopLabel(card: Locator, label: string): Promise<string> {
    const labelCell = card.getByText(new RegExp(`^${label}\\s*:?`, 'i')).first();
    const sibling = labelCell.locator('xpath=following-sibling::*[1]').first();
    let value = await this.text(sibling);
    if (!value || !/\S/.test(value)) {
      const rowText = ((await labelCell.locator('xpath=ancestor::*[2]').textContent()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const match = rowText.match(new RegExp(`${label}\\s*:?\\s*([^\\n|]+)`, 'i'));
      if (match?.[1]) {
        value = match[1].trim();
      }
    }
    return value;
  }

  private async text(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  private async getFieldValue(label: string): Promise<string> {
    const valueLocator = this.getLatestOrderRow()
      .locator(`div.text-10:has-text("${label}")`)
      .first()
      .locator('xpath=following-sibling::div[1]')
      .first();

    await valueLocator.waitFor({ state: 'visible', timeout: 20_000 });
    return (await valueLocator.textContent())?.trim() ?? '';
  }

  async getDate(): Promise<string> {
    return await this.getFieldValue('Date');
  }

  async getTransactionId(): Promise<string> {
    return await this.getFieldValue('Transaction ID');
  }

  async getTimeOfPurchase(): Promise<string> {
    return await this.getFieldValue('Time of Purchase');
  }

  async getAmount(): Promise<number> {
    const text = await this.getLatestOrderRow()
      .locator('div.text-10:has-text("Amount")')
      .first()
      .locator('xpath=following-sibling::div[1]')
      .first()
      .innerText();

    return Number(text.replace(/,/g, '').trim());
  }

  async getNarration(): Promise<string> {
    return (
      await this.getLatestOrderRow()
        .locator('div.text-10:has-text("Narration")')
        .first()
        .locator('xpath=following-sibling::div[1]')
        .first()
        .innerText()
    ).trim();
  }


  async getNarrationQuantity(): Promise<number | null> {
    const narration = await this.getNarration();
    const match = narration.match(/([\d.]+)\s*gm/i);
    return match ? parseFloat(match[1]) : null;
  }

  async waitForOrderRow(): Promise<void> {
    this.selectedOrderRow = null;
    await this.page
      .locator('text=No Record Found')
      .waitFor({ state: 'detached' })
      .catch(() => {});

    await this.getLatestOrderRow().waitFor({ state: 'visible', timeout: 30_000 });
  }

  async waitForSellOrderRow(timeout = 30_000): Promise<void> {
    this.selectedOrderRow = null;
    await this.page
      .locator('text=No Record Found')
      .waitFor({ state: 'detached' })
      .catch(() => {});
    await this.getLatestOrderRow().waitFor({ state: 'visible', timeout });
  }

  /**
   * Sell tab — wait for the withdrawal sell row (not a prior "Bought" row).
   * Sets {@link selectedOrderRow} to the matching row for {@link getLatestSellOrderCardDetails}.
   */
  async waitForSellWithdrawalOrderRow(
    expectedAmount: number,
    options?: { narrationHint?: string; amountTolerance?: number; timeoutMs?: number },
  ): Promise<void> {
    const hint = options?.narrationHint ?? 'Sold';
    await this.waitForOrderRowByTextAndAmount(
      hint,
      expectedAmount,
      options?.amountTolerance ?? 1,
      options?.timeoutMs ?? 60_000,
    );
  }

  /** Delivery tab — poll until withdrawal product card is visible (UAT may lag after payment). */
  async waitForWithdrawalDeliveryOrderCard(timeoutMs = 60_000): Promise<Locator> {
    const card = this.page
      .locator('motion.div.bg-sheengold-ochre, div.bg-sheengold-ochre')
      .filter({ has: this.page.locator('h3') })
      .filter({ has: this.page.getByText(/Transaction\s*Id/i) })
      .first();

    let lastReloadMs = 0;

    await expect
      .poll(
        async () => {
          if (await card.isVisible({ timeout: 500 }).catch(() => false)) {
            return true;
          }

          const now = Date.now();
          if (lastReloadMs === 0 || now - lastReloadMs >= 12_000) {
            lastReloadMs = now;
            await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
            await this.waitForOrderRow().catch(() => {});
            await this.clickOnDelivery().catch(() => {});
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000, 3000] },
      )
      .toBeTruthy();

    await card.waitFor({ state: 'visible', timeout: 15_000 });
    return card;
  }

  async waitForOrderRowByText(text: string, timeout = 45_000): Promise<void> {
    await this.page
      .locator('text=No Record Found')
      .waitFor({ state: 'detached' })
      .catch(() => {});

    const row = this.orderRows.filter({ hasText: new RegExp(text, 'i') }).first();
    await row.waitFor({ state: 'visible', timeout });
    this.selectedOrderRow = row;
  }

  /** Poll My Orders until a row matches text + amount (confirms payment posted a new order). */
  async waitForOrderRowByTextAndAmount(
    text: string,
    expectedAmount: number,
    amountTolerance = 1,
    timeoutMs = 60_000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    const pattern = new RegExp(text, 'i');

    while (Date.now() < deadline) {
      await this.page
        .locator('text=No Record Found')
        .waitFor({ state: 'detached' })
        .catch(() => {});

      const rows = this.orderRows.filter({ hasText: pattern });
      const count = await rows.count();
      for (let i = 0; i < count; i += 1) {
        const row = rows.nth(i);
        if (!(await row.isVisible().catch(() => false))) {
          continue;
        }
        this.selectedOrderRow = row;
        const orderAmount = await this.getAmount();
        if (Math.abs(orderAmount - expectedAmount) <= amountTolerance) {
          return;
        }
      }

      await this.page.waitForTimeout(3_000);
      await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.clickSellTab().catch(() => {});
    }

    throw new Error(
      `My Orders: no "${text}" row with amount ~${expectedAmount} (±${amountTolerance}) within ${timeoutMs}ms`,
    );
  }

  getLatestOrderRow(): Locator {
    return this.selectedOrderRow ?? this.orderRows.first();
  }

  private static isPreCompletionDeliveryStatus(status: string): boolean {
    const s = status.trim();
    if (!s) return false;
    if (/^(Completed|Failed)$/i.test(s)) return false;
    return /pending|processing|payment|confirmed|booked|order placed|in transit|shipped/i.test(s);
  }

  private async getStatusFromLatestOrderRow(): Promise<string> {
    const fromProductCard = async (): Promise<string> => {
      try {
        await this.getProductOrderCardRoot().waitFor({ state: 'visible', timeout: 8_000 });
        const details = await this.getProductDetailsFromOrderCard();
        return details.status.trim();
      } catch {
        return '';
      }
    };

    const cardStatus = await fromProductCard();
    if (cardStatus) {
      return cardStatus;
    }

    const row = this.getLatestOrderRow();
    const rowBadge = row
      .locator('span,div,p')
      .filter({
        hasText:
          /^(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)$/i,
      })
      .first();
    const rowBadgeText = ((await rowBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    if (rowBadgeText) {
      const normalized = rowBadgeText.match(
        /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i,
      )?.[1];
      if (normalized) {
        return normalized.trim();
      }
    }

    const rowText = ((await row.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const statusFromText =
      rowText.match(
        /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i,
      )?.[1] ?? '';
    if (statusFromText.trim()) {
      return statusFromText.trim();
    }

    const globalBadge = this.page
      .locator('span,div,p')
      .filter({
        hasText:
          /^(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)$/i,
      })
      .first();
    const globalBadgeText = ((await globalBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const globalNormalized = globalBadgeText.match(
      /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i,
    )?.[1];
    return (globalNormalized ?? globalBadgeText).trim();
  }

  /** After Delivery tab click — wait until order card or status is rendered (UAT can lag). */
  async waitForDeliveryTabContent(timeoutMs = 60_000): Promise<void> {
    const blockUI = this.page.locator('.p-blockui-document');
    await blockUI.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const deliveryCard = this.page
      .locator('motion.div.bg-sheengold-ochre, div.bg-sheengold-ochre')
      .filter({ has: this.page.locator('h3') })
      .filter({ has: this.page.getByText(/Transaction\s*Id/i) })
      .first();

    const productCard = this.getProductOrderCardRoot();

    await expect
      .poll(
        async () => {
          if (await deliveryCard.isVisible({ timeout: 500 }).catch(() => false)) {
            return true;
          }
          if (await productCard.isVisible({ timeout: 500 }).catch(() => false)) {
            return true;
          }
          const status = (await this.getStatusFromLatestOrderRow()).trim();
          return status.length > 0;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000, 3000] },
      )
      .toBeTruthy();
  }

  async validateLatestOrderRowStatusPending(timeoutMs = 60_000): Promise<void> {
    console.log('[My orders list] Expected: pre-completion delivery status (e.g. Pending, Processing, Payment Received)');

    let status = '';
    await expect
      .poll(
        async () => {
          status = (await this.getStatusFromLatestOrderRow()).trim();
          return status.length > 0 && MyOrderVerificationPage.isPreCompletionDeliveryStatus(status);
        },
        {
          timeout: timeoutMs,
          intervals: [500, 1000, 2000, 3000],
          message: 'My orders list: delivery status did not load after clicking Delivery',
        },
      )
      .toBeTruthy();

    console.log('[My orders list] Actual status:', status);
    if (!MyOrderVerificationPage.isPreCompletionDeliveryStatus(status)) {
      throw new Error(
        `My orders list status mismatch. Expected a pre-completion delivery status, actual "${status}"`,
      );
    }
  }

  /**
   * Root of the product row shown after Delivery (or equivalent): title, Transaction Id, Quantity, ₹ price.
   */
  private getProductOrderCardRoot(): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.locator('h3') })
      .filter({ has: this.page.getByText(/Transaction\s*Id:/i) })
      .filter({ has: this.page.locator('p').filter({ hasText: /₹/ }) })
      .first();
  }

  async waitForProductOrderCard(timeout = 30_000): Promise<void> {
    await this.getProductOrderCardRoot().waitFor({ state: 'visible', timeout });
  }

  async getProductDetailsFromOrderCard(): Promise<MyOrderProductCardDetails> {
    const card = this.getProductOrderCardRoot();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    const cardText = ((await card.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();

    const productName = ((await card.locator('h3').first().textContent()) ?? '').replace(/\s+/g, ' ').trim();

    const transactionId = (
      await card
        .locator('span', { hasText: /Transaction\s*Id/i })
        .first()
        .locator('xpath=following-sibling::div[1]')
        .innerText()
    ).trim();
    console.log('[My orders] Transaction ID:', transactionId);

    const statusNodeText = (
      (await card
        .locator('span,div,p')
        .filter({ hasText: /Pending|Completed|Failed|Processing/i })
        .first()
        .textContent()
        .catch(() => '')) ?? ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const status = (statusNodeText.match(/\b(Pending|Completed|Failed|Processing)\b/i)?.[1] ?? '').trim();

    let qtyText = (
      await card
        .locator('span', { hasText: /Quanti(?:ty|y)/i })
        .first()
        .locator('xpath=following-sibling::div[1]')
        .innerText()
        .catch(() => '')
    ).trim();

    if (!qtyText) {
      const fieldRows = card.locator('div.flex').filter({ has: card.locator('span') });
      const fieldCount = await fieldRows.count();
      for (let i = 0; i < fieldCount; i += 1) {
        const row = fieldRows.nth(i);
        const labelText = ((await row.locator('span').first().textContent().catch(() => '')) ?? '')
          .replace(/\s+/g, ' ')
          .trim();
        if (/quanti(?:ty|y)/i.test(labelText)) {
          qtyText = ((await row.locator('div').last().textContent().catch(() => '')) ?? '')
            .replace(/\s+/g, ' ')
            .trim();
          break;
        }
      }
    }

    if (!qtyText) {
      qtyText =
        (cardText.match(/Quanti(?:ty|y)\s*[:|-]?\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1] ??
          cardText.match(/\bQty\s*[:|-]?\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1] ??
          cardText.match(/\b([0-9]+(?:\.[0-9]+)?)\s*(?:Qty|Quantity)\b/i)?.[1] ??
          '')
          .trim();
    }
    const quantity = Number((qtyText || '0').replace(/,/g, ''));

    const priceText = (
      (await card.locator('p').filter({ hasText: /₹/ }).first().textContent()) ?? ''
    ).trim();
    const priceAmount = Number((priceText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));

    const img = card.locator('img').first();
    const productImageSrc = (await img.getAttribute('src').catch(() => null)) ?? undefined;

    console.log('[My orders product card]', {
      productName,
      transactionId,
      status,
      quantity,
      priceAmount,
      productImageSrc: productImageSrc?.slice(0, 80),
    });

    return { productName, transactionId, status, quantity, priceAmount, productImageSrc };
  }

  /**
   * Asserts my-order product card matches expected product/quantity/amount (e.g. same values as cart validation used before payment).
   */
  async validateProductOrderCardAgainstExpected(
    expected: { productName: string; productWeight: string; quantity: number; expectedAmount?: number },
    options?: { amountTolerance?: number },
  ): Promise<void> {
    const tol = options?.amountTolerance ?? 1;
    console.log('[My orders validation] Expected:', {
      productName: expected.productName,
      productWeight: expected.productWeight,
      quantity: expected.quantity,
      expectedAmount: expected.expectedAmount,
      amountTolerance: tol,
    });

    const order = await this.getProductDetailsFromOrderCard();
    console.log('[My orders validation] Actual:', {
      productName: order.productName,
      transactionId: order.transactionId,
      status: order.status,
      quantity: order.quantity,
      priceAmount: order.priceAmount,
    });

    const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

    if (expected.productName && !normalize(order.productName).includes(normalize(expected.productName))) {
      throw new Error(
        `My order product name mismatch. Expected title to contain "${expected.productName}", actual "${order.productName}"`,
      );
    }

    if (expected.quantity > 0 && Math.abs(order.quantity - expected.quantity) > 0.0001) {
      throw new Error(
        `My order quantity mismatch. Expected "${expected.quantity}", actual "${order.quantity}"`,
      );
    }

    const expectedWeightGm = Number(expected.productWeight.match(/[\d.]+/)?.[0] ?? '0');
    const weightInTitle = order.productName.match(/([\d.]+)\s*Gm/i);
    const titleWeightGm = weightInTitle ? Number(weightInTitle[1]) : 0;
    if (expectedWeightGm > 0 && titleWeightGm > 0 && Math.abs(expectedWeightGm - titleWeightGm) > 0.001) {
      throw new Error(
        `My order product weight mismatch vs cart. Cart weight implied "${expected.productWeight}" (${expectedWeightGm} g), title shows ${titleWeightGm} g`,
      );
    }

    if (expected.expectedAmount !== undefined) {
      if (Math.abs(order.priceAmount - expected.expectedAmount) > tol) {
        throw new Error(
          `My order amount mismatch. Expected ₹${expected.expectedAmount}, actual ₹${order.priceAmount}`,
        );
      }
    }

    const resolvedStatus = (order.status || (await this.getStatusFromLatestOrderRow())).trim();
    if (!MyOrderVerificationPage.isPreCompletionDeliveryStatus(resolvedStatus)) {
      throw new Error(
        `My order status mismatch. Expected a pre-completion delivery status, actual "${resolvedStatus || 'N/A'}"`,
      );
    }
  }

  async clickDownloadInvoiceAndGetUrl(): Promise<string> {
    const row = this.getLatestOrderRow();
    const downloadIcon = row.locator('i.pi.pi-download.cursor-pointer').first();
    await downloadIcon.waitFor({ state: 'visible' });
    await downloadIcon.click();

    const invoiceLink = this.page.locator('a[href*="/public/uploads/invoice/"]').first();
    const href = await invoiceLink.getAttribute('href');
    if (!href) {
      throw new Error('Invoice link href not found after clicking download icon.');
    }

    return new URL(href, this.page.url()).toString();
  }

  /** Clicks the Delivery action on the current order row (after {@link waitForOrderRow} / {@link waitForOrderRowByText}). */
  async clickOnDelivery(): Promise<void> {
    const row = this.getLatestOrderRow();
    const deliveryRadio = row.getByRole('radio', { name: /^DELIVERY$/i }).first();
    if (await deliveryRadio.isVisible().catch(() => false)) {
      await deliveryRadio.click({ force: true });
    } else {
      const button = row.getByRole('button', { name: /^DELIVERY$/i }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click({ force: true });
      } else {
        const labelledControl = row.locator('[role="radio"][aria-label="DELIVERY"]').first();
        if (await labelledControl.isVisible().catch(() => false)) {
          await labelledControl.click({ force: true });
        } else {
          const label = row.locator('span.p-button-label', { hasText: /^DELIVERY$/i }).first();
          if (await label.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await label.click({ force: true });
          } else {
            const globalRadio = this.page.getByRole('radio', { name: /^DELIVERY$/i }).first();
            if (await globalRadio.isVisible({ timeout: 10_000 }).catch(() => false)) {
              await globalRadio.click({ force: true });
            } else {
              const globalButton = this.page.getByRole('button', { name: /^DELIVERY$/i }).first();
              if (await globalButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
                await globalButton.click({ force: true });
              } else {
                const globalLabel = this.page.locator('span.p-button-label', { hasText: /^DELIVERY$/i }).first();
                await globalLabel.waitFor({ state: 'visible', timeout: 15_000 });
                await globalLabel.click({ force: true });
              }
            }
          }
        }
      }
    }

    await this.waitForDeliveryTabContent();
  }

  async getLatestSellOrderCardDetails(): Promise<MyOrderSellCardDetails> {
    const row = this.getLatestOrderRow();
    await row.waitFor({ state: 'visible', timeout: 30_000 });

    const getFieldValue = async (label: string): Promise<string> => {
      const value = await row
        .locator(`xpath=.//div[normalize-space()="${label}"]/following-sibling::div[1]`)
        .first()
        .textContent();
      return (value ?? '').replace(/\s+/g, ' ').trim();
    };

    const date = await getFieldValue('Date');
    const transactionId = await getFieldValue('Transaction ID');
    const narration = await getFieldValue('Narration');
    const amountText = await getFieldValue('Amount (₹)');
    const amountValue = Number((amountText.match(/[\d,]+(?:\.\d+)?/)?.[0] ?? '0').replace(/,/g, ''));

    return {
      date,
      transactionId,
      narration,
      amountText,
      amountValue,
    };
  }

  async isViewStatusVisibleOnLatestOrderRow(): Promise<boolean> {
    return this.getLatestOrderRow()
      .locator('a', { hasText: /View Status/i })
      .first()
      .isVisible()
      .catch(() => false);
  }

  async clickViewStatusOnLatestOrderRow(): Promise<void> {
    const viewStatusLink = this.getLatestOrderRow().locator('a', { hasText: /View Status/i }).first();
    await viewStatusLink.waitFor({ state: 'visible', timeout: 15_000 });
    await viewStatusLink.click({ force: true });
  }

  async getViewStatusOrderDetails(): Promise<MyOrderViewStatusDetails> {
    const detailsGrid = this.page
      .locator('div.grid.grid-cols-2.gap-3')
      .filter({ hasText: /Transaction ID\s*:|Narration\s*:|Current Status\s*:/i })
      .first();
    await detailsGrid.waitFor({ state: 'visible', timeout: 20_000 });

    const getValueByLabel = async (label: string): Promise<string> => {
      const value = await detailsGrid
        .locator(
          `xpath=.//div[contains(normalize-space(), "${label}") and contains(normalize-space(), ":")]/ancestor::div[contains(@class,"col-span-1")][1]/following-sibling::div[1]//div[contains(@class,"text-nickel")]`,
        )
        .first()
        .textContent();
      return (value ?? '').replace(/\s+/g, ' ').trim();
    };

    return {
      transactionId: await getValueByLabel('Transaction ID'),
      narration: await getValueByLabel('Narration'),
      ratePerGm: await getValueByLabel('Rate per 1 gm (₹)'),
      amount: await getValueByLabel('Amount (₹)'),
      totalAmount: await getValueByLabel('Total Amount (₹)'),
      currentStatus: await getValueByLabel('Current Status'),
      paymentRefNo: await getValueByLabel('Payment Ref No'),
      paymentMode: await getValueByLabel('Payment Mode'),
      paymentDate: await getValueByLabel('Payment Date'),
    };
  }
}
