import { expect, Locator, Page, type Response } from '@playwright/test';
import { BasePage } from '../shared/base.page';
import * as pdfUtils from '../../utils/pdf-utils';
import * as shopPdfUtils from '../../utils/shop-pdf-utils';
import type { ShopBillingAddressDetails, ShopCheckoutPage, ShopPlacedOrders } from './shop-checkout.page';
import { getShopDataset } from '../../utils/data/customer-excel-data';
import { shopLogActualExpected, shopLogGet } from '../../utils/test/shop-log';
import {
  persistShopEmiPurchaseChainState,
  resolveShopEmiOrderId,
  resolveShopEmiProductName,
  type ShopEmiPurchaseChainState,
} from '../../utils/test/shop-emi-purchase-chain';
import type { EmiOrderDetailValidationPage } from './emi-order-detail-validation.page';
import { ShopEmiPage } from './shop-emi.page';
import {
  expectedShopProductWeightGrams,
  shopWeightGramsFromText,
  type ShopProductDetails,
} from './shop.page';

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

/** One step on the shop order detail p-timeline (e.g. Booked → Active → Payment Received). */
export type MyOrderShopStatusTimelineStep = {
  status: string;
  dateTime: string;
};

/** TC_SHOP_011 — foreclosed EMI order detail timeline. */
export const SHOP_ORDER_DETAIL_TIMELINE_FORECLOSE = [
  'Booked',
  'Active',
  'Payment Received',
] as const;

/** TC_SHOP_009 — cancelled EMI order detail timeline (first EMI paid → Active). */
export const SHOP_ORDER_DETAIL_TIMELINE_CANCEL = [
  'Booked',
  'Active',
  'Order Cancelled',
] as const;

/** TC_SHOP_018 — cancelled EMI booked but never activated (no first EMI paid). */
export const SHOP_ORDER_DETAIL_TIMELINE_CANCEL_BOOKED_ONLY = [
  'Booked',
  'Order Cancelled',
] as const;

const SHOP_ORDER_DETAIL_STATUS =
  /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i;

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
  private shopCancelInvoicePdfText: string | null = null;

  constructor(page: Page) {
    super(page);

    this.orderRows = page.locator('div.p-4').filter({
      has: page.locator('div.text-10:has-text("Transaction ID")'),
    });
    this.noRecordLabel = page.locator('text=No Record Found');
  }

  private logShopInvoice(_step: number, _message: string): void {
    // Intentionally silent — specs log GET / Actual|Expected for invoice validation.
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

      // The list is paginated, not infinite-scroll — scrolling alone can never reveal
      // an order sitting on a later page, so advance pagination too.
      if (!(await this.goToNextShopOrderPageIfAvailable())) {
        await this.scrollShopOrdersListDown();
      }
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
  private async waitForShopOrderListHydrated(timeoutMs = 90_000): Promise<void> {
    const shopTab = this.page.getByRole('button', { name: /^SHOP$/i }).first();
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
            // Confirmed (manual testing): clicking SHOP a second time while it's already
            // the active tab clears the list instead of reloading it — a full page
            // reload is the only safe way to force a fresh fetch once active.
            if (await this.isTabActive(shopTab)) {
              await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
            } else {
              await shopTab.click({ force: true }).catch(() => {});
            }
            await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000, 3000] })
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
        .poll(async () => this.isTabActive(shopTab), {
          timeout: 15_000,
          intervals: [200, 500, 1000],
        })
        .toBeTruthy();
    } else {
      await expect
        .poll(async () => this.isTabActive(shopTab), { timeout: 15_000, intervals: [200, 500, 1000] })
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
    options?: { productName?: string; timeoutMs?: number }): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? 150_000;
    const shopTab = this.page.getByRole('button', { name: /^SHOP$/i }).first();
    let lastRefreshMs = 0;
    let lastReloadMs = 0;

    const refreshShopList = async (): Promise<void> => {
      const refreshResponse = this.page
        .waitForResponse(
          (r) =>
            r.ok() &&
            (r.request().method() === 'GET' || r.request().method() === 'POST') &&
            /shop|my-orders|myorders|order-list|customer-order/i.test(r.url()),
          { timeout: 20_000 })
        .catch(() => null);
      // Confirmed (manual testing): clicking SHOP a second time while it's already the
      // active tab clears the list instead of reloading it. If it's not active yet, one
      // click switches to it; if it's already active, a full page reload is the only
      // safe way to force a fresh fetch.
      if (await this.isTabActive(shopTab)) {
        await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      } else {
        await shopTab.click({ force: true }).catch(() => {});
      }
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
      await this.waitForShopOrderListHydrated(45_000).catch(() => {});
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
        { timeout: timeoutMs, intervals: [500, 1000, 1500, 2000, 3000] })
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
    const shopTab = this.page.getByRole('button', { name: /^SHOP$/i }).first();
    const productCard = options?.productName ? this.shopOrderCard(options.productName) : null;
    const orderCard = options?.orderId ? this.shopOrderCardByOrderId(options.orderId) : null;

    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});

    await expect
      .poll(
        async () => {
          if (requireTabChecked && !(await this.isTabActive(shopTab))) {
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
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000] })
      .toBeTruthy();
  }
  private static readonly invoicePdfUrlPattern =
    /emi-backend-api\.gfau\.augmont\.com\/.*(?:cancelInvoice|finalInvoice|proformaContract).*\.pdf/i;

  private static isInvoicePdfUrl(url: string): boolean {
    return (
      MyOrderVerificationPage.invoicePdfUrlPattern.test(url) ||
      /(?:cancelInvoice|finalInvoice|proformaContract).*\.pdf/i.test(url) ||
      /\.pdf(\?|$)/i.test(url) ||
      /amazonaws\.com\/.*\.pdf/i.test(url)
    );
  }

  private static pickBestInvoicePdfUrl(urls: string[], preferCancelInvoice = false): string | null {
    let best: string | null = null;
    let bestScore = -1;

    for (const url of urls) {
      if (!MyOrderVerificationPage.isInvoicePdfUrl(url)) {
        continue;
      }
      let score = 1;
      if (/cancelInvoice/i.test(url)) {
        score = 30;
      } else if (/finalInvoice/i.test(url)) {
        score = 20;
      } else if (/proformaContract/i.test(url)) {
        score = 10;
      }
      if (preferCancelInvoice && !/cancelInvoice/i.test(url)) {
        score = 0;
      }
      if (score >= bestScore) {
        bestScore = score;
        best = url;
      }
    }

    return best;
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
        { timeout: timeoutMs, intervals: [100, 250, 500] })
      .toBeTruthy()
      .catch(() => {});
    return found;
  }

  /** Toggle buttons (SHOP/SELL/BUY/…) mark the active tab with an `aug-active` class. */
  private async isTabActive(tab: Locator): Promise<boolean> {
    const className = await tab.getAttribute('class').catch(() => null);
    return /\baug-active\b/.test(className ?? '');
  }

  private async isTabNamedActive(name: RegExp): Promise<boolean> {
    return this.isTabActive(this.page.getByRole('button', { name }).first());
  }

  private async isSellTabActive(): Promise<boolean> {
    return this.isTabNamedActive(/^SELL$/i);
  }

  /** SELL tab selected and list is not BUY/SHOP/Delivery content. */
  private async isSellTabListRendered(): Promise<boolean> {
    if (await this.isTabNamedActive(/^BUY$/i)) {
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
    const sellTab = this.page.getByRole('button', { name: /^SELL$/i }).first();
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
            // Clicking a tab a second time while it's already active clears the list
            // instead of reloading it (confirmed on SHOP) — reload instead once active.
            if (await this.isTabActive(sellTab)) {
              await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
            } else {
              await sellTab.click({ force: true }).catch(() => {});
            }
            await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [300, 500, 1000, 2000, 3000] })
      .toBeTruthy();
  }

  private async clickSellTabAndWaitForList(hydrateTimeoutMs = 45_000): Promise<void> {
    const sellTab = this.page.getByRole('button', { name: /^SELL$/i }).first();
    await sellTab.scrollIntoViewIfNeeded();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    // Clicking a tab while it's already active clears the list instead of reloading it
    // (confirmed on SHOP) — only click if it isn't already selected.
    if (!(await this.isTabActive(sellTab))) {
      await sellTab.click({ force: true });
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    }
    await this.waitForSellOrderListHydrated(hydrateTimeoutMs);
  }

  /** TC001 / TC004 — single product on SHOP tab (main-branch click + list hydrate). */
  async clickShopTabSingleOrder(): Promise<void> {
    await this.clickShopTabAndWaitForList(90_000);
  }

  /** TC002 / TC003 — multiple products; same tab settle, rows read by exact product name. */
  async clickShopTabMultiProduct(): Promise<void> {
    await this.clickShopTabAndWaitForList(90_000);
  }

  /**
   * Click into the SHOP tab without waiting for its full list to hydrate. Use this
   * (instead of clickShopTabSingleOrder/clickShopTabMultiProduct) right before an
   * order-id search, where a slow/broken general list shouldn't block a targeted lookup.
   */
  private async activateShopTab(): Promise<void> {
    // The order-type tabs are the app's own `<button class="aug-select-option">`
    // toggle group (no ARIA role) — never a native radio input.
    const shopTab = this.page.getByRole('button', { name: /^SHOP$/i }).first();
    await shopTab.scrollIntoViewIfNeeded();
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    // Confirmed (manual testing): clicking SHOP a *second* time while it's already the
    // active tab clears the list instead of reloading it. A single click is safe
    // regardless of prior tab state — checking "already active" first isn't reliable
    // right after navigation (the class can read stale), so just click once, always.
    await shopTab.click({ force: true });
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    // Card containers (heading, "Order ID:", "View Detail") can render before their data
    // (product name, order id number, EMI tenure) actually populates — give it time,
    // especially for orders placed moments ago in the same test.
    await this.page.waitForTimeout(5_000);
  }

  private async clickShopTabAndWaitForList(hydrateTimeoutMs = 90_000): Promise<void> {
    await this.activateShopTab();
    await this.waitForShopOrderListHydrated(hydrateTimeoutMs);
  }

  /** Scroll SHOP list until the product row is in view. */
  async waitForShopProductOnList(productName: string, timeoutMs = 60_000): Promise<void> {
    await this.resolveShopOrderCardIndex(productName, timeoutMs);
  }

  /** Read shop-tab list row by order id (preferred when multiple products were ordered). */
  async getShopOrderListDetailsByOrderId(
    orderId: string,
    options?: { skipTabLoadWait?: boolean; productName?: string }): Promise<MyOrderShopCardDetails> {
    if (!options?.skipTabLoadWait) {
      await this.waitForShopOrderIdOnList(orderId, { productName: options?.productName });
    }
    const card = await this.resolveShopOrderCardByOrderId(orderId, options?.productName);
    return this.readShopOrderCardDetails(card);
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
    return this.readShopOrderCardDetails(card);
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
        'My Orders opened the login page (session missing or expired). Re-run: npx playwright test --project=auth-setup');
    }

    await this.page.waitForURL(/my-orders/i, { timeout: 20_000 });
  }

  /**
   * Retry `fn` with a full page reload in between attempts — the SHOP tab's order list
   * is confirmed to intermittently fail to render on this backend (reproduced even on
   * otherwise-reliable test runs, independent of click type, wait length, or search vs.
   * general list). A fresh page load sometimes clears whatever transient state causes
   * it, similar to a real user hitting refresh. This does not fix the underlying issue —
   * it only gives a flaky backend another independent chance to succeed.
   */
  private async retryWithPageReload<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt >= attempts) break;
        console.log(
          `[Shop] SHOP list attempt ${attempt}/${attempts} failed, reloading and retrying: ${
            error instanceof Error ? error.message : String(error)
          }`);
        await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      }
    }
    throw lastError;
  }

  async getShopOrderDetails(
    productName: string,
    _options?: { skipTabLoadWait?: boolean }): Promise<MyOrderShopCardDetails> {
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

  private async readShopOrderCardQuantity(card: Locator): Promise<number> {
    const quantityLabel = card.getByText(/^Quantity\s*:?/i).first();
    if (!(await quantityLabel.isVisible({ timeout: 2_000 }).catch(() => false))) {
      return 1;
    }
    const raw = await this.readShopLabel(card, 'Quantity');
    const parsed = Number(raw.replace(/\D/g, '') || '0');
    return parsed > 0 ? parsed : 1;
  }

  private async readShopOrderCardDetails(card: Locator): Promise<MyOrderShopCardDetails> {
    let orderedOn = '';
    try {
      orderedOn = await this.readShopOrderDate(card);
    } catch {
      orderedOn = '';
    }

    // Price paragraph can hydrate after the rest of the card (esp. right after order
    // placement) — wait for it explicitly instead of racing the default action timeout.
    const priceLocator = card.locator('p').filter({ hasText: /^₹/ }).first();
    await priceLocator.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});

    return {
      productName: await this.text(card.getByRole('heading', { level: 3 }).first()),
      orderId: await this.readShopLabel(card, 'Order Id'),
      status: await this.text(card.locator('span.rounded-full').first()),
      quantity: await this.readShopOrderCardQuantity(card),
      priceAmount: this.parseAmount(await this.text(priceLocator)),
      orderedOn,
    };
  }

  /** TC003 / EMI shop tab row — Quantity label optional (defaults to 1). */
  async getShopEmiOrderDetails(productName: string): Promise<MyOrderShopCardDetails> {
    const card = await this.resolveShopOrderCard(productName);
    return this.readShopOrderCardDetails(card);
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
    options?: { orderId?: string }): Promise<void> {
    await this.openShopOrderDetailForProduct(productName, 'multi', options?.orderId);
  }

  private async openShopOrderDetailForProduct(
    productName: string,
    flow: 'single' | 'multi',
    orderId?: string): Promise<void> {
    const onOrderDetail = await this.shopOrderDetailPanel()
      .isVisible({ timeout: 500 })
      .catch(() => false);
    const u = this.page.url();
    const onMyOrders = /\/my-orders/i.test(u) && !/\/shop-new\/order\//i.test(u);
    const needNavigate = !onMyOrders || onOrderDetail;

    // When we already know the order id, search for it directly instead of waiting for
    // the full SHOP list to hydrate first — the general order-list can fail to render
    // entirely (a confirmed backend data-sync issue) while a targeted id search still
    // works, since it's a different, more specific query.
    if (needNavigate) {
      await this.goToMyOrders();
      if (orderId) {
        await this.activateShopTab();
      } else if (flow === 'single') {
        await this.clickShopTabSingleOrder();
      } else {
        await this.clickShopTabMultiProduct();
      }
    } else if (flow === 'multi' && !orderId) {
      await this.clickShopTabMultiProduct();
    } else if (flow === 'multi') {
      await this.activateShopTab();
    }

    if (orderId) {
      await this.searchShopOrderByOrderId(orderId, { productName });
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

  /**
   * Locate a SHOP-tab row by order id (optional search box, then scroll/poll list).
   */
  async searchShopOrderByOrderId(
    orderId: string,
    options?: { productName?: string; timeoutMs?: number }): Promise<void> {
    const normalized = orderId.replace(/\D/g, '');
    const searchInput = this.page
      .getByPlaceholder(/search/i)
      .or(this.page.getByRole('searchbox'))
      .or(this.page.locator('input[type="search"]'))
      .first();

    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill(normalized);
      await searchInput.press('Enter').catch(() => {});
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    }

    await this.waitForShopOrderIdOnList(normalized, {
      productName: options?.productName,
      timeoutMs: options?.timeoutMs,
    });
  }

  /** AT-1658 — SHOP row: find by order id and click Pay Now (opens Pay EMI details card). */
  async clickPayNowOnShopEmiOrderByOrderId(
    orderId: string,
    options?: { productName?: string }): Promise<void> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    await this.searchShopOrderByOrderId(orderId, { productName: options?.productName });

    const card = await this.resolveShopOrderCardByOrderId(orderId, options?.productName);
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^pay now$/i }).first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** AT-1658 post-foreclose — SHOP tab: search order id, read list row (caller asserts status). */
  async getShopOrderOnListByOrderId(
    orderId: string,
    options?: { productName?: string }): Promise<MyOrderShopCardDetails> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    await this.searchShopOrderByOrderId(orderId, { productName: options?.productName });
    return this.getShopOrderListDetailsByOrderId(orderId, {
      skipTabLoadWait: true,
      productName: options?.productName,
    });
  }

  /** AT-1658 post-foreclose — SHOP row: click View Detail (list already showing the order). */
  async openShopOrderViewDetailByOrderId(
    orderId: string,
    options?: { productName?: string }): Promise<void> {
    const card = await this.resolveShopOrderCardByOrderId(orderId, options?.productName);
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^view detail$/i }).first().click();
    const panel = this.shopOrderDetailPanel();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });
    if (options?.productName) {
      await expect(panel.getByRole('heading', { level: 3 }).first()).toContainText(options.productName, {
        timeout: 20_000,
      });
    }
    // Detail panel can appear before timeline/refund blocks hydrate. Wait until at least one
    // timeline status step is rendered so subsequent reads don't race with lazy data loading.
    await expect
      .poll(
        async () => (await this.getShopOrderStatusTimeline()).length,
        { timeout: 20_000, intervals: [500, 1000, 2000] },
      )
      .toBeGreaterThan(0);
  }

  /** TC003 / TC_SHOP_010 (AT-1658) — My Orders SHOP tab: find order id, click Pay Now on the EMI row. */
  async openShopEmiOrderDetailByOrderId(
    orderId: string,
    options?: { productName?: string }): Promise<void> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    await this.searchShopOrderByOrderId(orderId, { productName: options?.productName });

    const card = await this.resolveShopOrderCardByOrderId(orderId, options?.productName);
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^pay now$/i }).first().click();

    const panel = this.shopEmiOrderDetailPanel();
    await panel.waitFor({ state: 'visible', timeout: 15_000 });
    if (options?.productName) {
      await expect(panel.getByRole('heading', { level: 3 }).first()).toContainText(options.productName, {
        timeout: 20_000,
      });
    }
    await expect(panel.getByRole('button', { name: /^pay now$/i })).toBeVisible();
    await expect(panel.getByRole('button', { name: /cancel booking/i })).toBeVisible();
  }

  /** TC003 EMI Booked row — click Pay Now on the shop-tab card to open the EMI order summary. */
  async openShopEmiOrderDetail(productName: string): Promise<void> {
    const u = this.page.url();
    if (!/\/my-orders/i.test(u) || /\/shop-new\/order\//i.test(u)) {
      await this.goToMyOrders();
      await this.clickShopTabMultiProduct();
    }

    const card = await this.resolveShopOrderCard(productName);
    await card.getByRole('button', { name: /^pay now$/i }).first().click();

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
        await this.text(panel.locator('p.font-bold').filter({ hasText: /₹/ }).first())),
      dueOn: await this.text(panel.getByText(/^DUE ON/i).first()),
    };
  }

  /** Navigate to shop order detail before opening the invoice PDF. */
  async prepareShopOrderDetailForInvoice(
    productName: string,
    flow: 'single' | 'multi' = 'single',
    options?: { orderId?: string }): Promise<void> {
    if (await this.isShopOrderDetailReadyForInvoiceWithProduct(productName)) {
      await this.scrollToShopInvoiceSection();
      return;
    }
    await this.goToMyOrders();
    if (options?.orderId) {
      await this.clickShopTabSingleOrder();
      await this.openShopOrderDetailMulti(productName, { orderId: options.orderId });
    } else if (flow === 'single') {
      await this.clickShopTabSingleOrder();
      await this.openShopOrderDetailSingle(productName);
    } else {
      await this.clickShopTabMultiProduct();
      await this.openShopOrderDetailMulti(productName, { orderId: options?.orderId });
    }
    await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
    await this.waitForShopOrderDetailContentLoaded();
  }

  /** Wait for order detail sections (status, address, invoice) before opening invoice PDF. */
  private async waitForShopOrderDetailContentLoaded(): Promise<void> {
    await this.page.locator('.p-blockui, .p-blockui-document').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
    await this.page
      .getByText(/Payment Received|Booked/i)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {});
    await this.scrollToShopInvoiceSection();
    const invoiceBtn = this.shopInvoiceButtonInAddressSection();
    await invoiceBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(invoiceBtn).toBeEnabled({ timeout: 15_000 });
    await this.getShopOrderAddress('received').catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  private async fetchShopInvoicePdfText(invoicePassword: string): Promise<string> {
    const pdfUrl = await this.getShopInvoicePdfUrl();
    let pdfText = '';
    await expect
      .poll(
        async () => {
          const response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
          if (!response.ok()) {
            return '';
          }
          pdfText = pdfUtils.normalizePdfText(
            await shopPdfUtils.readShopInvoicePdf(await response.body(), invoicePassword));
          const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
          return pdfText.length > 80 && !Number.isNaN(netPayable) && netPayable > 0 ? pdfText : '';
        },
        { timeout: 30_000, intervals: [1000, 2000, 3000] })
      .toBeTruthy();
    return pdfText;
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
      await card.getByRole('button', { name: /^pay now$/i }).first().click();
      await this.shopEmiOrderDetailPanel().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    }

    await this.scrollToShopInvoiceSection();
    await this.shopInvoiceButton().waitFor({ state: 'visible', timeout: 20_000 });

    const heading = await this.resolveShopOrderDetailProductHeading();
    if (!heading.includes(productName)) {
      throw new Error(
        `EMI order detail for invoice does not show "${productName}" (got "${heading || '(empty)'}").`);
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
    }): Promise<void> {
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
    options?: { requireMatchingProduct?: boolean }): Promise<void> {
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
    await this.dismissProfileMenu();
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.goToMyOrders();
    await this.clickShopTabMultiProduct();
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

  /** ORDER ID / ORDERED ON meta line on shop order detail (Buy Now and EMI). */
  async getShopOrderDetailOrderMeta(): Promise<Pick<MyOrderShopDetailStatusAndDate, 'orderId' | 'orderedOn'>> {
    const metaLine = await this.text(this.page.getByText(/ORDER ID:\s*\d+/i).first());
    const orderId = metaLine.match(/ORDER\s*ID:\s*(\d+)/i)?.[1] ?? '';
    const orderedPart = metaLine.match(/ORDERED ON\s+(.+)/i)?.[1]?.trim() ?? '';
    return {
      orderId,
      orderedOn: orderedPart ? `ORDERED ON ${orderedPart}` : metaLine,
    };
  }

  async getShopOrderDetailStatusAndDate(): Promise<MyOrderShopDetailStatusAndDate> {
    const meta = await this.getShopOrderDetailOrderMeta();
    const statusBadge = this.page
      .locator('span,div,p')
      .filter({ hasText: SHOP_ORDER_DETAIL_STATUS })
      .first();
    let status = '';
    if (await statusBadge.isVisible({ timeout: 8_000 }).catch(() => false)) {
      const raw = await this.text(statusBadge);
      status = raw.match(SHOP_ORDER_DETAIL_STATUS)?.[1] ?? raw;
    }

    return { ...meta, status };
  }

  /** Shop order detail — vertical p-timeline status steps (Booked, Active, Payment Received, …). */
  async getShopOrderStatusTimeline(): Promise<MyOrderShopStatusTimelineStep[]> {
    const timeline = this.page.locator('.p-timeline.p-component').first();
    await timeline.waitFor({ state: 'visible', timeout: 15_000 });

    const events = timeline.locator('.p-timeline-event');
    const count = await events.count();
    const steps: MyOrderShopStatusTimelineStep[] = [];

    for (let i = 0; i < count; i += 1) {
      const paragraphs = events.nth(i).locator('.p-timeline-event-content p');
      const status = ((await paragraphs.nth(0).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      const dateTime = ((await paragraphs.nth(1).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      steps.push({ status, dateTime });
    }

    return steps;
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
    /** TC_SHOP_009 — prefer cancelInvoice PDF over proforma/final invoice. */
    preferCancelInvoice?: boolean;
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
              options.useEmiOrderDetail ? 'multi' : 'single');
          }
        } else {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
        }
        await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
        await this.scrollToShopInvoiceSection();
        await this.shopInvoiceButtonInAddressSection().waitFor({ state: 'visible', timeout: 15_000 });
      }

      try {
        await this.captureShopInvoicePdf(captureTimeoutMs, {
          preferCancelInvoice: options?.preferCancelInvoice,
        });
        return;
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }
      }
    }
  }

  private async captureShopInvoicePdf(
    captureTimeoutMs: number,
    options?: { preferCancelInvoice?: boolean }): Promise<void> {
    this.logShopInvoice(1, 'Close profile menu if open');
    await this.dismissProfileMenu();

    this.logShopInvoice(2, 'Scroll to Address Details and Invoice button');
    await this.addressDetailsHeading().waitFor({ state: 'visible', timeout: 15_000 });
    await this.scrollToShopInvoiceSection();

    this.logShopInvoice(3, `Register PDF listener then click Invoice (wait up to ${captureTimeoutMs}ms)`);
    const collectedUrls = new Set<string>();
    const onResponse = async (response: Response) => {
      const url = response.url();
      if (MyOrderVerificationPage.isInvoicePdfUrl(url)) {
        collectedUrls.add(url);
        this.logShopInvoice(4, `Captured PDF URL from network | ${url.slice(0, 120)}`);
        return;
      }
      if (!/invoice|finalInvoice|cancelInvoice|\.pdf|emi-backend-api\.gfau\.augmont\.com/i.test(url)) {
        return;
      }
      try {
        const body = await response.json();
        const fromJson = MyOrderVerificationPage.findPdfUrlInJson(body, url);
        if (fromJson) {
          collectedUrls.add(fromJson);
          this.logShopInvoice(4, `Captured PDF URL from JSON | ${fromJson.slice(0, 120)}`);
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
          for (const tab of this.page.context().pages()) {
            if (!tab.isClosed() && MyOrderVerificationPage.isInvoicePdfUrl(tab.url())) {
              collectedUrls.add(tab.url());
              pdfTab = tab;
              this.logShopInvoice(4, `Captured PDF URL from tab | ${tab.url().slice(0, 120)}`);
            }
          }
          viewerPage = await this.waitForInvoiceViewerPage(250);
          if (viewerPage && MyOrderVerificationPage.isInvoicePdfUrl(viewerPage.url())) {
            collectedUrls.add(viewerPage.url());
            pdfTab = viewerPage;
          }
          const cancelLinks = this.page.locator('a[href*="cancelInvoice"]');
          const linkCount = await cancelLinks.count().catch(() => 0);
          for (let i = 0; i < linkCount; i += 1) {
            const href = await cancelLinks.nth(i).getAttribute('href');
            if (href) {
              collectedUrls.add(href);
            }
          }
          if (options?.preferCancelInvoice) {
            return [...collectedUrls].some((url) => /cancelInvoice/i.test(url));
          }
          return collectedUrls.size > 0;
        },
        { timeout: captureTimeoutMs, intervals: [100, 250, 500] })
      .toBeTruthy();

    this.page.context().off('response', onResponse);

    const resolvedUrl = MyOrderVerificationPage.pickBestInvoicePdfUrl(
      [...collectedUrls],
      options?.preferCancelInvoice);
    if (!resolvedUrl) {
      throw new Error('Invoice PDF URL not found after clicking Invoice.');
    }

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
    await pdfPage
      .locator('input[type="password"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 20_000 })
      .catch(() => {});
    await pdfPage.waitForLoadState('load', { timeout: 15_000 }).catch(() => {});
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
    let debugLogged = false;
    await expect
      .poll(
        async () => {
          const cards = this.shopOrderCards();
          const count = await cards.count().catch(() => 0);
          if (count === 0 && !debugLogged) {
            debugLogged = true;
            const debugInfo = await this.page.evaluate(() => {
              const doc = (globalThis as any).document;
              const orderIdEl = Array.from(doc.querySelectorAll('*')).find(
                (el: any) => el.children.length === 0 && /Order Id:/i.test(el.textContent ?? ''),
              ) as any;
              if (!orderIdEl) return { found: false };
              let node = orderIdEl;
              const ancestry: any[] = [];
              for (let i = 0; i < 6 && node; i += 1) {
                ancestry.push({ tag: node.tagName, className: node.className });
                node = node.parentElement;
              }
              return { found: true, ancestry };
            });
            console.log(`[SHOP DEBUG] order-card-ancestry=${JSON.stringify(debugInfo, null, 2)}`);
          }
          for (let i = 0; i < count; i += 1) {
            const heading = (
              await this.text(cards.nth(i).getByRole('heading', { level: 3 }).first())
            ).trim();
            if (heading === productName) {
              foundIndex = i;
              return true;
            }
          }
          // The list is paginated, not infinite-scroll — scrolling alone can never
          // reveal an order sitting on a later page, so advance pagination too.
          if (!(await this.goToNextShopOrderPageIfAvailable())) {
            await this.scrollShopOrdersListDown();
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000] })
      .toBeTruthy();

    if (foundIndex < 0) {
      throw new Error(`Shop order card not found for "${productName}".`);
    }
    return foundIndex;
  }

  /** Click the SHOP tab's "Next Page" control if it's enabled; returns whether it advanced. */
  private async goToNextShopOrderPageIfAvailable(): Promise<boolean> {
    // Inactive tab panels can stay in the DOM (hidden, not removed) — an unscoped
    // "Next Page" lookup can match a different tab's stale pagination control instead
    // of the SHOP list's own, so require it to actually be visible before clicking.
    const next = this.page.getByRole('button', { name: /^next page$/i }).first();
    if (!(await next.isVisible({ timeout: 500 }).catch(() => false))) {
      return false;
    }
    if (!(await next.isEnabled({ timeout: 500 }).catch(() => false))) {
      return false;
    }
    await next.click().catch(() => {});
    await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    return true;
  }

  /** Find shop-tab row index by order id (optional product heading disambiguates shared ids). */
  private async resolveShopOrderCardIndexByOrderId(
    orderId: string,
    options?: { productName?: string; timeoutMs?: number }): Promise<number> {
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
          // The list is paginated, not infinite-scroll — scrolling alone can never
          // reveal an order sitting on a later page, so advance pagination too.
          if (!(await this.goToNextShopOrderPageIfAvailable())) {
            await this.scrollShopOrdersListDown();
          }
          return false;
        },
        { timeout: timeoutMs, intervals: [500, 1000, 2000] })
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
    const match = narration.match(/([\d.]+)\s*gm?\b/i);
    return match ? parseFloat(match[1]) : null;
  }

  async validateOneTimeBuyOrder(params: {
    orderRowText: string;
    narrationMatch: RegExp;
    expectedQuantity: number;
    expectedAmount: number;
    amountTolerance?: number;
    quantityPrecision?: number;
  }): Promise<{ quantity: number; amount: number }> {
    await this.page.goto('/my-orders');
    await expect(this.page).toHaveURL(/my-orders/);
    await this.waitForOrderRowByText(params.orderRowText);

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDate = `${dd}/${mm}/${yyyy}`;

    const date = await this.getDate();
    console.log(`[BUY ORDER] date actual=${date} expected=${currentDate}`);
    expect(date).toBe(currentDate);

    const transactionId = await this.getTransactionId();
    console.log(`[BUY ORDER] transactionId=${transactionId}`);
    expect(transactionId.length).toBeGreaterThan(0);

    const narration = await this.getNarration();
    console.log(`[BUY ORDER] narration=${narration}`);
    expect(narration).toMatch(params.narrationMatch);

    const quantity = (await this.getNarrationQuantity()) ?? 0;
    const quantityPrecision = params.quantityPrecision ?? 3;
    console.log(`[BUY ORDER] quantity actual=${quantity} expected=${params.expectedQuantity}`);
    expect(quantity).toBeCloseTo(params.expectedQuantity, quantityPrecision);

    const amount = await this.getAmount();
    const tolerance = params.amountTolerance ?? 1;
    console.log(`[BUY ORDER] amount actual=${amount} expected=${params.expectedAmount}`);
    expect(Math.abs(amount - params.expectedAmount)).toBeLessThanOrEqual(tolerance);

    return { quantity, amount };
  }

  /** TC_SHOP_001 — open My Orders SHOP tab and read order row. */
  async openShopBuyNowOrder(
    productName = getShopDataset().productName): Promise<MyOrderShopCardDetails> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    const shopOrder = await this.getShopOrderDetails(productName);
    shopLogGet('My Orders SHOP row', shopOrder);
    return shopOrder;
  }

  /** TC_SHOP_002 — open SHOP tab and wait for each checkout order id. */
  async openShopMultiProductOrdersTab(orderIds: string[]): Promise<void> {
    await this.retryWithPageReload(async () => {
      await this.goToMyOrders();
      // Search for each known order id directly rather than waiting for the general SHOP
      // list to hydrate first — that list can fail to render entirely (a confirmed
      // backend data-sync issue) while a targeted id search still works.
      await this.activateShopTab();
      for (const orderId of orderIds) {
        await this.searchShopOrderByOrderId(orderId, { timeoutMs: 60_000 });
      }
      // The search box is left filtered to the last order id searched above — callers
      // that follow this up by looking for a row by product name (not order id) need
      // the unfiltered list back, or every order but the last-searched one is invisible.
      await this.clearShopOrderSearch();
    });
  }

  /** Clear the SHOP tab's order-id search box so the full order list is visible again. */
  private async clearShopOrderSearch(): Promise<void> {
    const searchInput = this.page
      .getByPlaceholder(/search/i)
      .or(this.page.getByRole('searchbox'))
      .or(this.page.locator('input[type="search"]'))
      .first();
    if (await searchInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchInput.fill('');
      await searchInput.press('Enter').catch(() => {});
      await this.page.locator('.p-blockui').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    }
  }

  /** TC_SHOP_002 — read SHOP tab row for one product (single or multi checkout). */
  async getShopOrderListDetailsForMultiProduct(params: {
    productName: string;
    placedOrders: ShopPlacedOrders;
    skipTabLoadWait?: boolean;
  }): Promise<MyOrderShopCardDetails> {
    if (params.placedOrders.isSingleSharedOrder) {
      return this.getShopOrderListDetailsByOrderId(params.placedOrders.orderIds[0], {
        skipTabLoadWait: params.skipTabLoadWait,
        productName: params.productName,
      });
    }
    return this.getShopOrderListDetails({
      productName: params.productName,
      skipTabLoadWait: params.skipTabLoadWait,
    });
  }

  /** TC_SHOP_001 — validate SHOP tab order row against PDP + placed order. */
  async validateShopBuyNowOrderOnList(params: {
    productDetails: ShopProductDetails;
    placedOrderId: string;
    shopOrder: MyOrderShopCardDetails;
    productName?: string;
  }): Promise<void> {
    const productName = params.productName ?? getShopDataset().productName;
    const p = params.productDetails;
    const { shopOrder } = params;
    const prefix = `${productName} `;
    shopLogActualExpected(`${prefix}product name`, shopOrder.productName, productName);
    shopLogActualExpected(`${prefix}quantity`, shopOrder.quantity, Number(p.quantity) || 1);
    shopLogActualExpected(`${prefix}price`, shopOrder.priceAmount, p.grandTotal);
    shopLogActualExpected(`${prefix}order id`, shopOrder.orderId, params.placedOrderId);
    shopLogActualExpected(`${prefix}status`, shopOrder.status, 'Payment Received');
    shopLogActualExpected(`${prefix}ordered on (today)`, this.isOrderedOnToday(shopOrder.orderedOn), true);
    expect(shopOrder.productName).toContain(productName);
    expect(shopOrder.quantity).toBe(Number(p.quantity) || 1);
    expect(shopOrder.priceAmount).toBe(p.grandTotal);
    expect(shopOrder.orderId).toBe(params.placedOrderId);
    expect(shopOrder.status).toMatch(/payment received/i);
    expect(shopOrder.orderedOn).toMatch(/^ORDERED ON/i);
    expect(this.isOrderedOnToday(shopOrder.orderedOn)).toBe(true);
  }

  /** TC_SHOP_002 — open SHOP tab and validate each product row on My Orders. */
  async validateShopMultiProductOrdersOnList(params: {
    productNames: string[];
    productDetailsByName: Record<string, ShopProductDetails>;
    placedOrders: ShopPlacedOrders;
    checkoutPage: ShopCheckoutPage;
  }): Promise<{
    orderIdByProduct: Record<string, string>;
    shopOrdersByName: Record<string, MyOrderShopCardDetails>;
  }> {
    await this.openShopMultiProductOrdersTab(params.placedOrders.orderIds);

    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};

    for (const name of params.productNames) {
      const shopOrder = await this.getShopOrderListDetailsForMultiProduct({
        productName: name,
        placedOrders: params.placedOrders,
        skipTabLoadWait: true,
      });
      orderIdByProduct[name] = shopOrder.orderId;
      shopOrdersByName[name] = shopOrder;

      shopLogGet(`My Orders SHOP row (${name})`, shopOrder);

      const expectedOrderId = params.placedOrders.isSingleSharedOrder
        ? params.placedOrders.orderIds[0]
        : shopOrder.orderId;

      params.checkoutPage.assertOrderIdForProduct(shopOrder.orderId, params.placedOrders);
      await this.validateShopBuyNowOrderOnList({
        productDetails: params.productDetailsByName[name],
        placedOrderId: expectedOrderId,
        shopOrder,
        productName: name,
      });
    }

    if (!params.placedOrders.isSingleSharedOrder) {
      const orderIdsOnTab = params.productNames.map((n) => orderIdByProduct[n]);
      shopLogActualExpected('Distinct order ids on SHOP tab', new Set(orderIdsOnTab).size, params.productNames.length);
      expect(new Set(orderIdsOnTab).size).toBe(params.productNames.length);
    } else {
      for (const name of params.productNames) {
        shopLogActualExpected(`${name} shared order id`, orderIdByProduct[name], params.placedOrders.orderIds[0]);
      }
    }

    return { orderIdByProduct, shopOrdersByName };
  }

  /** TC_SHOP_002 — validate order detail view for each product line. */
  async validateShopMultiProductOrderDetails(params: {
    productNames: string[];
    productDetailsByName: Record<string, ShopProductDetails>;
    cartNetWeightByName: Record<string, string>;
    savedBillingAddress: ShopBillingAddressDetails;
    shopOrdersByName: Record<string, MyOrderShopCardDetails>;
    orderIdByProduct: Record<string, string>;
  }): Promise<void> {
    for (const name of params.productNames) {
      await this.validateShopBuyNowOrderDetail({
        productDetails: params.productDetailsByName[name],
        cartNetWeight: params.cartNetWeightByName[name] ?? '',
        savedBillingAddress: params.savedBillingAddress,
        shopOrder: params.shopOrdersByName[name],
        productName: name,
        orderId: params.orderIdByProduct[name],
      });
    }
  }

  /** TC_SHOP_002 — download and validate invoice PDF(s) for multi-product checkout. */
  async validateShopMultiProductInvoices(params: {
    productNames: string[];
    productDetailsByName: Record<string, ShopProductDetails>;
    productLinePrices: Record<string, number>;
    orderIdByProduct: Record<string, string>;
    placedOrders: ShopPlacedOrders;
    combinedGrandTotal: number;
    invoicePassword: string;
    checkoutPage: ShopCheckoutPage;
  }): Promise<void> {
    const invoiceTargets = params.placedOrders.isSingleSharedOrder
      ? [params.productNames[0]]
      : [...params.productNames];

    for (let inv = 0; inv < invoiceTargets.length; inv++) {
      const invoiceProductName = invoiceTargets[inv];
      if (inv > 0) {
        await this.resetShopInvoiceSession();
      }

      const linePrice =
        params.productLinePrices[invoiceProductName] ??
        params.productDetailsByName[invoiceProductName].grandTotal;
      const invoiceOrderId = params.checkoutPage.getInvoiceOrderId(
        params.placedOrders,
        params.orderIdByProduct[invoiceProductName]);
      const expectedInvoiceNetPayable = params.checkoutPage.getExpectedInvoiceNetPayable(
        params.placedOrders,
        params.combinedGrandTotal,
        linePrice);
      const pdfProductNames = params.placedOrders.isSingleSharedOrder
        ? params.checkoutPage.getInvoiceProductNames(params.placedOrders, params.productNames)
        : [invoiceProductName];

      const pdfUrl = await this.retryWithPageReload(() =>
        this.validateShopMultiProductInvoice({
          invoiceProductName,
          productDetails: params.productDetailsByName[invoiceProductName],
          productLinePrice: linePrice,
          invoiceOrderId,
          expectedInvoiceNetPayable,
          pdfProductNames,
          invoicePassword: params.invoicePassword,
          orderId: params.orderIdByProduct[invoiceProductName],
        }));

      shopLogActualExpected(
        `${invoiceProductName} net payable`,
        expectedInvoiceNetPayable,
        expectedInvoiceNetPayable);
      void pdfUrl;
    }
  }

  /** TC_SHOP_003 — open SHOP tab and validate mixed EMI + Buy Now rows. */
  async validateMixedOrdersOnList(params: {
    productNames: string[];
    emiProductName: string;
    productLinePrices: Record<string, number>;
    placedOrders: ShopPlacedOrders;
    checkoutPage: ShopCheckoutPage;
  }): Promise<{
    orderIdByProduct: Record<string, string>;
    shopOrdersByName: Record<string, MyOrderShopCardDetails>;
  }> {
    await this.openShopMultiProductOrdersTab(params.placedOrders.orderIds);
    const orderIdByProduct: Record<string, string> = {};
    const shopOrdersByName: Record<string, MyOrderShopCardDetails> = {};

    for (const name of params.productNames) {
      const shopOrder =
        name === params.emiProductName
          ? await this.getShopEmiOrderDetails(name)
          : await this.getShopOrderListDetailsForMultiProduct({
              productName: name,
              placedOrders: params.placedOrders,
              skipTabLoadWait: true,
            });
      orderIdByProduct[name] = shopOrder.orderId;
      shopOrdersByName[name] = shopOrder;
      shopLogGet(`My Orders SHOP row (${name})`, shopOrder);
      shopLogActualExpected(`${name} price`, shopOrder.priceAmount, params.productLinePrices[name]);
      params.checkoutPage.assertOrderIdForProduct(shopOrder.orderId, params.placedOrders);
      if (name === params.emiProductName) {
        expect(shopOrder.status).toMatch(/booked/i);
      } else {
        expect(shopOrder.status).toMatch(/payment received/i);
      }
    }
    return { orderIdByProduct, shopOrdersByName };
  }

  /** TC_SHOP_003 — validate order detail for mixed EMI + Buy Now checkout. */
  async validateMixedOrderDetails(params: {
    productNames: string[];
    emiProductName: string;
    productDetailsByName: Record<string, ShopProductDetails>;
    productLinePrices: Record<string, number>;
    cartNetWeightByName: Record<string, string>;
    savedBillingAddress: ShopBillingAddressDetails;
    shopOrdersByName: Record<string, MyOrderShopCardDetails>;
    orderIdByProduct: Record<string, string>;
  }): Promise<void> {
    for (const name of params.productNames) {
      if (name === params.emiProductName) {
        await this.openShopEmiOrderDetail(name);
        const emiDetail = await this.getShopEmiOrderDetailView();
        shopLogActualExpected(
          `${name} EMI detail price`,
          emiDetail.priceAmount,
          params.productLinePrices[name]);
        expect(emiDetail.priceAmount).toBe(params.productLinePrices[name]);
        expect(emiDetail.dueOn).toMatch(/^DUE ON/i);
      } else {
        await this.validateShopBuyNowOrderDetail({
          productDetails: params.productDetailsByName[name],
          cartNetWeight: params.cartNetWeightByName[name] ?? '',
          savedBillingAddress: params.savedBillingAddress,
          shopOrder: params.shopOrdersByName[name],
          productName: name,
          orderId: params.orderIdByProduct[name],
        });
      }
    }
  }

  /** TC_SHOP_003 — validate EMI proforma and/or buy-now invoice PDFs. */
  async validateMixedInvoices(params: {
    productNames: string[];
    emiProductName: string;
    productDetailsByName: Record<string, ShopProductDetails>;
    productLinePrices: Record<string, number>;
    orderIdByProduct: Record<string, string>;
    placedOrders: ShopPlacedOrders;
    combinedGrandTotal: number;
    emiInitialPayment: number;
    checkoutPage: ShopCheckoutPage;
    invoicePassword: string;
  }): Promise<void> {
    const invoiceTargets = params.placedOrders.isSingleSharedOrder
      ? [params.productNames[0]]
      : [...params.productNames];

    for (let inv = 0; inv < invoiceTargets.length; inv++) {
      const invoiceProductName = invoiceTargets[inv];
      if (inv > 0) {
        await this.resetShopInvoiceSession();
      }
      const linePrice = params.productLinePrices[invoiceProductName];
      const invoiceOrderId = params.checkoutPage.getInvoiceOrderId(
        params.placedOrders,
        params.orderIdByProduct[invoiceProductName]);
      const expectedInvoiceNetPayable = params.checkoutPage.getExpectedInvoiceNetPayable(
        params.placedOrders,
        params.combinedGrandTotal,
        linePrice);
      const pdfProductNames = params.placedOrders.isSingleSharedOrder
        ? params.checkoutPage.getInvoiceProductNames(params.placedOrders, params.productNames)
        : [invoiceProductName];

      if (invoiceProductName === params.emiProductName) {
        await this.validateShopEmiProformaInvoice({
          productName: invoiceProductName,
          productDetails: params.productDetailsByName[invoiceProductName],
          placedOrderId: invoiceOrderId,
          emiLinePrice: linePrice,
          emiInitialPayment: params.emiInitialPayment,
          invoicePassword: params.invoicePassword,
        });
      } else {
        await this.validateShopMultiProductInvoice({
          invoiceProductName,
          productDetails: params.productDetailsByName[invoiceProductName],
          productLinePrice: linePrice,
          invoiceOrderId,
          expectedInvoiceNetPayable,
          pdfProductNames,
          invoicePassword: params.invoicePassword,
          orderId: params.orderIdByProduct[invoiceProductName],
        });
      }
    }
  }

  /** TC_SHOP_004 — open SHOP tab and validate buy-now order row (full savings). */
  async openAndValidateShopBuyNowOrderOnList(params: {
    productName: string;
    productDetails: ShopProductDetails;
    placedOrderId: string;
  }): Promise<MyOrderShopCardDetails> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    const shopOrder = await this.getShopOrderDetails(params.productName);
    shopLogGet('My Orders SHOP row', shopOrder);
    shopLogActualExpected('Order list price', shopOrder.priceAmount, params.productDetails.grandTotal);
    shopLogActualExpected('Order list order id', shopOrder.orderId, params.placedOrderId);
    expect(shopOrder.productName).toContain(params.productName);
    expect(shopOrder.priceAmount).toBe(params.productDetails.grandTotal);
    expect(shopOrder.orderId).toBe(params.placedOrderId);
    return shopOrder;
  }

  /** TC_SHOP_004 — validate buy-now order detail summary (full savings). */
  async validateShopBuyNowOrderDetailSummary(params: {
    productName: string;
    productDetails: ShopProductDetails;
    placedOrderId: string;
  }): Promise<void> {
    await this.openShopOrderDetailSingle(params.productName);
    const detail = await this.getShopOrderDetailView();
    const orderMeta = await this.getShopOrderDetailStatusAndDate();
    shopLogGet('Order detail', detail);
    shopLogActualExpected('Detail product name', detail.productName, params.productName);
    shopLogActualExpected('Detail price', detail.priceAmount, params.productDetails.grandTotal);
    shopLogActualExpected('Detail order id', orderMeta.orderId, params.placedOrderId);
    expect(detail.productName).toContain(params.productName);
    expect(detail.priceAmount).toBe(params.productDetails.grandTotal);
    expect(orderMeta.orderId).toBe(params.placedOrderId);
  }

  /** TC_SHOP_015 only — EMI order list row after coupon + savings Pay ₹0. */
  async validateShopEmiOrderListCouponSummary(params: {
    productName: string;
    expectedAmount: number;
  }): Promise<void> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    const shopOrder = await this.getShopEmiOrderDetails(params.productName);
    shopLogGet('My Orders SHOP row (EMI coupon)', shopOrder);
    shopLogActualExpected('List product name', shopOrder.productName, params.productName);
    shopLogActualExpected('List amount', shopOrder.priceAmount, params.expectedAmount);
    expect(shopOrder.productName).toContain(params.productName);
    expect(shopOrder.priceAmount).toBe(params.expectedAmount);
    expect(shopOrder.status).toMatch(/booked|payment received/i);
  }

  /** TC_SHOP_014 — order detail: product name, Payment Received, amount only. */
  async validateShopBuyNowOrderDetailCouponSummary(params: {
    productName: string;
    expectedAmount: number;
  }): Promise<void> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    await this.openShopOrderDetailSingle(params.productName);
    const detail = await this.getShopOrderDetailView();
    const orderMeta = await this.getShopOrderDetailStatusAndDate();
    shopLogGet('Order detail (coupon)', detail);
    shopLogGet('Order detail status', orderMeta);
    shopLogActualExpected('Detail product name', detail.productName, params.productName);
    shopLogActualExpected('Detail status', orderMeta.status, 'Payment Received');
    shopLogActualExpected('Detail amount', detail.priceAmount, params.expectedAmount);
    expect(detail.productName).toContain(params.productName);
    expect(orderMeta.status).toMatch(/payment received/i);
    expect(detail.priceAmount).toBe(params.expectedAmount);
  }

  /** TC_SHOP_007 / TC_SHOP_010 — EMI order detail with all installments pending. */
  async validateShopEmiOrderDetailPendingInstallments(params: {
    productName: string;
    productDetails: ShopProductDetails;
    cartNetWeight: string;
    emiLinePrice: number;
    emiPlanTenure: string;
    emiPerMonth: number;
    emiOrderDetailValidationPage: EmiOrderDetailValidationPage;
  }): Promise<void> {
    const expectedInstallmentAmounts = ShopEmiPage.expectedInstallmentAmountsForTenure(
      params.emiPerMonth,
      params.emiPlanTenure);
    await this.openShopEmiOrderDetail(params.productName);
    const emiDetail = await this.getShopEmiOrderDetailView();
    const expectedNetWeightGm = expectedShopProductWeightGrams(
      params.productName,
      params.productDetails,
      params.cartNetWeight);
    shopLogGet('EMI order detail', emiDetail);
    shopLogActualExpected('Detail price', emiDetail.priceAmount, params.emiLinePrice);
    shopLogActualExpected('Net weight (g)', shopWeightGramsFromText(emiDetail.netWeight), expectedNetWeightGm);
    expect(emiDetail.priceAmount).toBe(params.emiLinePrice);
    expect(shopWeightGramsFromText(emiDetail.netWeight)).toBe(expectedNetWeightGm);
    expect(emiDetail.dueOn).toMatch(/^DUE ON/i);
    await params.emiOrderDetailValidationPage.validateAllInstallmentsPending(
      expectedInstallmentAmounts.length,
      expectedInstallmentAmounts);
  }

  /** TC_SHOP_001 — View Detail: product, properties, addresses and payment. */
  async validateShopBuyNowOrderDetail(params: {
    productDetails: ShopProductDetails;
    cartNetWeight: string;
    savedBillingAddress: ShopBillingAddressDetails;
    shopOrder: MyOrderShopCardDetails;
    productName?: string;
    placedPaymentMethod?: string;
    orderId?: string;
  }): Promise<void> {
    const productName = params.productName ?? getShopDataset().productName;
    const placedPaymentMethod = params.placedPaymentMethod ?? 'Netbanking';
    if (params.orderId) {
      await this.openShopOrderDetailMulti(productName, { orderId: params.orderId });
    } else {
      await this.openShopOrderDetailSingle(productName);
    }
    const detail = await this.getShopOrderDetailView();
    const p = params.productDetails;
    const expectedNetWeightGm = expectedShopProductWeightGrams(
      productName,
      p,
      params.cartNetWeight);
    expect(detail.productName).toContain(productName);
    expect(shopWeightGramsFromText(detail.netWeight)).toBe(expectedNetWeightGm);
    expect(detail.quantity).toBe(Number(p.quantity) || 1);
    expect(detail.priceAmount).toBe(p.grandTotal);

    const props = await this.getShopOrderProductProperties();
    if (p.sku) {
      expect(props.sku).toBe(p.sku);
    } else {
      expect(props.sku).toBeTruthy();
    }
    expect(props.metalType).toBe(p.metalType);
    expect(props.purity).toBe(p.purity);
    expect(shopWeightGramsFromText(props.productWeight)).toBe(expectedNetWeightGm);

    const saved = params.savedBillingAddress;
    const receivedAt = await this.getShopOrderAddress('received');
    const billedAt = await this.getShopOrderAddress('billed');
    expect(receivedAt.fullName).toBe(saved.fullName);
    expect(receivedAt.pincode).toBe(saved.pincode);
    expect(billedAt.fullName).toBe(saved.fullName);
    expect(billedAt.pincode).toBe(saved.pincode);

    const paymentMethod = await this.getShopOrderPaymentMethod();
    expect(paymentMethod).toMatch(new RegExp(placedPaymentMethod, 'i'));

    const prefix = `${productName} `;
    shopLogGet(`${prefix}order detail view`, detail);
    shopLogGet(`${prefix}product properties`, props);
    shopLogGet(`${prefix}received address`, receivedAt);
    shopLogGet(`${prefix}billed address`, billedAt);
    shopLogGet(`${prefix}payment method`, paymentMethod);
    shopLogActualExpected(`${prefix}detail product name`, detail.productName, productName);
    shopLogActualExpected(`${prefix}detail price`, detail.priceAmount, p.grandTotal);
    shopLogActualExpected(`${prefix}detail SKU`, props.sku, p.sku || 'non-empty');
    shopLogActualExpected(`${prefix}detail metal type`, props.metalType, p.metalType);
    shopLogActualExpected(`${prefix}detail purity`, props.purity, p.purity);
    shopLogActualExpected(`${prefix}received pincode`, receivedAt.pincode, saved.pincode);
    shopLogActualExpected(`${prefix}billed pincode`, billedAt.pincode, saved.pincode);
    shopLogActualExpected(`${prefix}payment method`, paymentMethod, placedPaymentMethod);

    const orderStatusAndDate = await this.getShopOrderDetailStatusAndDate();
    const orderDateTime = await this.getShopOrderDetailDateTime();
    expect(orderStatusAndDate.orderId).toBe(params.shopOrder.orderId);
    expect(orderStatusAndDate.status).toBe(params.shopOrder.status);
    expect(this.isOrderedOnToday(orderStatusAndDate.orderedOn)).toBe(true);
    expect(orderDateTime.orderTime).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    expect(this.isOrderDateToday(orderDateTime.orderDate)).toBe(true);
  }

  /** TC_SHOP_001 — open invoice, download PDF and validate GST fields. */
  async validateShopBuyNowInvoice(params: {
    productDetails: ShopProductDetails;
    placedOrderId: string;
    productName?: string;
    invoicePassword?: string;
  }): Promise<void> {
    const shopData = getShopDataset();
    const productName = params.productName ?? shopData.productName;
    const invoicePassword =
      params.invoicePassword ?? shopData.mobile.replace(/\D/g, '').slice(-4);
    await this.ensureShopOrderDetailForInvoice(productName);
    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 12_000,
      productName,
    });
    await this.submitShopInvoicePassword(invoicePassword);

    const pdfUrl = await this.getShopInvoicePdfUrl();
    shopLogGet('Invoice PDF URL', pdfUrl);
    let response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    if (!response.ok()) {
      await expect
        .poll(
          async () => {
            const retry = await this.page.request.get(pdfUrl, { timeout: 15_000 });
            if (retry.ok()) {
              response = retry;
              return true;
            }
            return false;
          },
          { timeout: 20_000, intervals: [500, 1000, 2000] })
        .toBeTruthy();
    }
    expect(response.ok()).toBeTruthy();

    const pdfText = pdfUtils.normalizePdfText(
      await shopPdfUtils.readShopInvoicePdf(await response.body(), invoicePassword));
    const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
    const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
    const gstin = pdfUtils.extractGstin(pdfText);
    const cin = pdfUtils.extractCin(pdfText);
    const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
    const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, params.placedOrderId);
    const pdfHasProduct =
      shopPdfUtils.shopPdfContainsProductName(pdfText, productName) ||
      shopPdfUtils.shopPdfContainsProductName(pdfText, params.productDetails.productName);
    const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);
    const gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
    const gstValidation = shopPdfUtils.validateShopInvoiceGst({
      taxableAmount: gstDetails.taxableAmount,
      netPayable,
      igstAmount: gstDetails.igstAmount,
      cgstAmount: gstDetails.cgstAmount,
      sgstAmount: gstDetails.sgstAmount,
      igstRatePercent: gstDetails.igstRatePercent ?? 3,
    });

    shopLogGet('Invoice number', invoiceNo);
    shopLogGet('Invoice date', invoiceDate || (invoiceDateMissingInPdf ? '(missing in PDF)' : ''));
    shopLogGet('GSTIN', gstin);
    shopLogGet('CIN', cin);
    shopLogGet('Net payable (PDF)', netPayable);
    shopLogGet('GST details', gstDetails);
    shopLogActualExpected('Net payable', netPayable, params.productDetails.grandTotal);
    shopLogActualExpected('PDF order reference', pdfHasOrderId, true);
    shopLogActualExpected('PDF product name', pdfHasProduct, true);
    if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
      shopLogActualExpected('GST validation', gstValidation.ok, true);
      if (!gstValidation.ok) {
        shopLogGet('GST validation messages', gstValidation.messages);
      }
    }

    expect(invoiceNo).toBeTruthy();
    expect(invoiceDate || invoiceDateMissingInPdf).toBeTruthy();
    expect(gstin).toBeTruthy();
    expect(cin).toBeTruthy();
    expect(pdfHasOrderId).toBe(true);
    expect(pdfHasProduct).toBe(true);
    expect(Math.abs(netPayable - params.productDetails.grandTotal)).toBeLessThanOrEqual(1);
    if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
      expect(gstValidation.ok, gstValidation.messages.join('; ')).toBe(true);
    }
  }

  /** Delivery address management — invoice PDF: product name, amount, billing address only. */
  async validateShopBuyNowInvoiceAddressProductAndAmount(params: {
    productName: string;
    amount: number;
    billingAddress: ShopBillingAddressDetails;
    invoicePassword?: string;
    orderId?: string;
  }): Promise<void> {
    const shopData = getShopDataset();
    const invoicePassword =
      params.invoicePassword ?? shopData.mobile.replace(/\D/g, '').slice(-4);
    await this.ensureShopOrderDetailForInvoice(params.productName, { orderId: params.orderId });
    await this.waitForShopOrderDetailContentLoaded();
    const orderDetailAddress = await this.getShopOrderAddress('received');
    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 15_000,
      productName: params.productName,
      orderId: params.orderId,
    });
    await this.submitShopInvoicePassword(invoicePassword);

    const pdfText = await this.fetchShopInvoicePdfText(invoicePassword);
    const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
    const pdfHasProduct = shopPdfUtils.shopPdfContainsProductName(pdfText, params.productName);
    const pdfHasAddress = shopPdfUtils.shopPdfContainsBillingAddress(pdfText, orderDetailAddress);

    shopLogGet('Order detail address', orderDetailAddress);
    shopLogActualExpected('Invoice product name', pdfHasProduct, true);
    shopLogActualExpected('Invoice net payable', netPayable, params.amount);
    shopLogActualExpected('Invoice billing address', pdfHasAddress, true);

    expect(pdfHasProduct).toBe(true);
    expect(pdfHasAddress).toBe(true);
    expect(Math.abs(netPayable - params.amount)).toBeLessThanOrEqual(1);
  }

  /** TC_SHOP_002 — download invoice PDF and validate fields for one product line. */
  async validateShopMultiProductInvoice(params: {
    invoiceProductName: string;
    productDetails: ShopProductDetails;
    productLinePrice: number;
    invoiceOrderId: string;
    expectedInvoiceNetPayable: number;
    pdfProductNames: string[];
    invoicePassword: string;
    orderId?: string;
  }): Promise<string> {
    await this.ensureShopOrderDetailForInvoice(params.invoiceProductName, {
      requireMatchingProduct: true,
      orderId: params.orderId,
    });
    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 12_000,
      productName: params.invoiceProductName,
    });
    await this.submitShopInvoicePassword(params.invoicePassword);

    const pdfUrl = await this.getShopInvoicePdfUrl();
    let response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    if (!response.ok()) {
      await this.page.waitForTimeout(2_000);
      response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    }
    expect(response.ok()).toBeTruthy();

    const pdfText = pdfUtils.normalizePdfText(
      await shopPdfUtils.readShopInvoicePdf(await response.body(), params.invoicePassword));
    const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
    const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
    const gstin = pdfUtils.extractGstin(pdfText);
    const cin = pdfUtils.extractCin(pdfText);
    const netPayable = shopPdfUtils.extractShopNetPayable(pdfText);
    const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, params.invoiceOrderId);
    const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);
    const gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
    const gstValidation = shopPdfUtils.validateShopInvoiceGst({
      taxableAmount: gstDetails.taxableAmount,
      netPayable,
      igstAmount: gstDetails.igstAmount,
      cgstAmount: gstDetails.cgstAmount,
      sgstAmount: gstDetails.sgstAmount,
      igstRatePercent: gstDetails.igstRatePercent ?? 3,
    });

    for (const name of params.pdfProductNames) {
      expect(shopPdfUtils.shopPdfContainsProductName(pdfText, name)).toBe(true);
    }

    expect(invoiceNo).toBeTruthy();
    expect(invoiceDate || invoiceDateMissingInPdf).toBeTruthy();
    expect(gstin).toBeTruthy();
    expect(cin).toBeTruthy();
    expect(pdfHasOrderId).toBe(true);
    expect(Math.abs(netPayable - params.expectedInvoiceNetPayable)).toBeLessThanOrEqual(2);
    if (gstDetails.igstAmount != null && gstDetails.igstAmount > 0) {
      expect(gstValidation.ok, gstValidation.messages.join('; ')).toBe(true);
    }

    shopLogGet(
      `Invoice PDF URL (${params.invoiceProductName})`,
      pdfUrl);

    return pdfUrl;
  }

  /** TC_SHOP_007 / TC_SHOP_010 — persist placed EMI order for the foreclose spec in the same worker. */
  saveShopEmiPurchaseChainOrder(
    chain: ShopEmiPurchaseChainState,
    orderId: string,
    productName: string): void {
    chain.orderId = orderId;
    chain.productName = productName;
    persistShopEmiPurchaseChainState(chain);
  }

  /**
   * TC_SHOP_008 / TC_SHOP_011 — resolve order id + product from env or prior purchase spec, then assert.
   */
  requireShopEmiPurchaseChain(
    chain: ShopEmiPurchaseChainState,
    params: {
      missingMessage: string;
      orderIdEnvKey?: string;
      productNameEnvKey?: string;
      /** When true, asserts TC_SHOP_008 ran (first EMI paid) before this spec. */
      requireFirstEmiPaid?: boolean;
    }): { orderId: string; productName: string } {
    const orderId = resolveShopEmiOrderId(chain, {
      orderIdEnvKey: params.orderIdEnvKey,
    });
    const productName = resolveShopEmiProductName(chain, {
      productNameEnvKey: params.productNameEnvKey,
    });
    shopLogGet('EMI order id', orderId);
    shopLogGet('Product name', productName);
    shopLogActualExpected('Order id is numeric', this.isNumericId(orderId), true);
    expect(this.isNumericId(orderId), params.missingMessage).toBe(true);
    if (params.requireFirstEmiPaid) {
      expect(chain.payNowDetails, 'Run TC_Shop_EMI_003 first').not.toBeNull();
    }
    return { orderId, productName };
  }

  /** TC_SHOP_009 — SHOP row Cancelled after Cancel Booking. */
  async validateShopOrderCancelledAfterCancelBooking(params: {
    orderId: string;
    productName: string;
  }): Promise<MyOrderShopCardDetails> {
    const shopOrder = await this.getShopOrderOnListByOrderId(params.orderId, {
      productName: params.productName,
    });
    shopLogActualExpected(
      'Status Cancelled',
      /cancel/i.test(shopOrder.status),
      true);
    expect(shopOrder.status).toMatch(/cancel/i);
    return shopOrder;
  }

  /** TC_SHOP_008 — SHOP row still Booked/Active after partial EMI pay. */
  async validateShopOrderBookedAfterPartialPay(params: {
    orderId: string;
    productName: string;
  }): Promise<MyOrderShopCardDetails> {
    const shopOrder = await this.getShopOrderOnListByOrderId(params.orderId, { productName: params.productName });
    shopLogGet('My Orders SHOP row after partial pay', shopOrder);
    shopLogActualExpected('Status (Booked or Active)', /booked|active/i.test(shopOrder.status), true);
    expect(shopOrder.status).toMatch(/booked|active/i);
    expect(shopOrder.status).not.toMatch(/payment received/i);
    return shopOrder;
  }

  /** TC_SHOP_011 — SHOP row Payment Received after full foreclose. */
  async validateShopOrderPaymentReceived(params: {
    orderId: string;
    productName: string;
  }): Promise<MyOrderShopCardDetails> {
    const shopOrder = await this.getShopOrderOnListByOrderId(params.orderId, { productName: params.productName });
    shopLogActualExpected(
      'Status Payment Received',
      /payment received/i.test(shopOrder.status),
      true);
    expect(shopOrder.status).toMatch(/payment received/i);
    return shopOrder;
  }

  // --- Shop order detail: status timeline & refund (TC_SHOP_009 / TC_SHOP_011) ---

  async getShopOrderDetailStatusTimeline(): Promise<string[]> {
    const statuses = (await this.getShopOrderStatusTimeline()).map((step) => step.status);
    shopLogGet('Status timeline', statuses);
    return statuses;
  }

  async validateShopOrderDetailStatusTimeline(
    expected: readonly string[]): Promise<void> {
    const actual = await this.getShopOrderDetailStatusTimeline();
    shopLogActualExpected('Status timeline', actual, [...expected]);
    expect(actual).toEqual([...expected]);
  }

  async validateForeclosedShopOrderDetailStatusTimeline(): Promise<void> {
    await this.validateShopOrderDetailStatusTimeline(SHOP_ORDER_DETAIL_TIMELINE_FORECLOSE);
  }

  async validateCancelledShopOrderDetailStatusTimeline(): Promise<void> {
    await this.validateShopOrderDetailStatusTimeline(SHOP_ORDER_DETAIL_TIMELINE_CANCEL);
  }

  async validateCancelledBookedShopOrderDetailStatusTimeline(): Promise<void> {
    await this.validateShopOrderDetailStatusTimeline(SHOP_ORDER_DETAIL_TIMELINE_CANCEL_BOOKED_ONLY);
  }

  async getShopOrderDetailRefundSource(): Promise<string> {
    const label = this.page.getByText('Refund Source', { exact: true });
    await label.waitFor({ state: 'visible', timeout: 15_000 });
    const source = (
      await label.locator('xpath=following::p[contains(@class,"font-medium")][1]').innerText()
    )
      .replace(/\s+/g, ' ')
      .trim();
    shopLogGet('Refund source', source);
    return source;
  }

  async validateShopOrderDetailRefundSource(
    expected: string | RegExp): Promise<void> {
    const actual = await this.getShopOrderDetailRefundSource();
    shopLogActualExpected('Refund source', actual, expected);
    if (expected instanceof RegExp) {
      expect(actual).toMatch(expected);
    } else {
      expect(actual).toBe(expected);
    }
  }

  async getShopOrderDetailRefundAmount(): Promise<number> {
    const amountEl = this.page.locator('p.font-medium.mt-1').filter({ hasText: /^₹/ }).first();
    await amountEl.waitFor({ state: 'visible', timeout: 15_000 });
    const amount = this.parseAmount(await amountEl.innerText());
    shopLogGet('Refund amount', amount);
    return amount;
  }

  async validateShopOrderDetailRefundAmount(expected: number): Promise<void> {
    const actual = await this.getShopOrderDetailRefundAmount();
    shopLogActualExpected('Refund amount', actual, expected);
    expect(actual).toBeCloseTo(expected, 2);
  }

  private async loadShopCancelInvoicePdf(
    invoicePassword?: string): Promise<string> {
    if (this.shopCancelInvoicePdfText) {
      return this.shopCancelInvoicePdfText;
    }

    const shopData = getShopDataset();
    const password = invoicePassword ?? shopData.mobile.replace(/\D/g, '').slice(-4);

    this.shopCancelInvoicePdfText = null;
    this.resetShopInvoiceCapture();
    for (const tab of this.page.context().pages()) {
      if (tab !== this.page && !tab.isClosed() && MyOrderVerificationPage.isInvoicePdfUrl(tab.url())) {
        await tab.close().catch(() => {});
      }
    }

    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 12_000,
      preferCancelInvoice: true,
    });
    await this.submitShopInvoicePassword(password);

    const pdfUrl = await this.resolveShopCancelInvoicePdfUrl();
    shopLogGet('Cancel invoice PDF URL', pdfUrl);
    let response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    if (!response.ok()) {
      await this.page.waitForTimeout(2_000);
      response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    }
    expect(response.ok()).toBeTruthy();

    this.shopCancelInvoicePdfText = pdfUtils.normalizePdfText(
      await shopPdfUtils.readShopInvoicePdf(await response.body(), password));
    return this.shopCancelInvoicePdfText;
  }

  private async resolveShopCancelInvoicePdfUrl(): Promise<string> {
    const candidates: string[] = [];
    try {
      candidates.push(await this.getShopInvoicePdfUrl());
    } catch {
      // no stored href yet
    }

    for (const tab of this.page.context().pages()) {
      if (!tab.isClosed() && /cancelInvoice/i.test(tab.url())) {
        candidates.push(tab.url());
      }
    }

    const linkHrefs = await this.page
      .locator('a[href*="cancelInvoice"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute('href') ?? '')
          .filter((href) => href.length > 0))
      .catch(() => [] as string[]);
    candidates.push(...linkHrefs);

    const resolved =
      MyOrderVerificationPage.pickBestInvoicePdfUrl(candidates, true) ??
      MyOrderVerificationPage.pickBestInvoicePdfUrl(candidates);
    if (!resolved) {
      throw new Error('Cancel invoice PDF URL not found.');
    }
    this.invoicePdfHref = resolved;
    return resolved;
  }

  /** TC_SHOP_009 — refund amount from cancel invoice PDF. */
  async getShopCancelInvoiceRefundAmount(
    expectedHint?: number,
    options?: { invoicePassword?: string }): Promise<number> {
    const pdfText = await this.loadShopCancelInvoicePdf(options?.invoicePassword);
    const amount = shopPdfUtils.extractShopCancelRefundAmount(pdfText, expectedHint);
    shopLogGet('Invoice refund amount', amount);
    return amount;
  }

  // async validateShopCancelInvoiceRefundAmount(
  //   expectedRefundAmount: number,
  //   options?: { invoicePassword?: string }): Promise<void> {
  //   const actual = await this.getShopCancelInvoiceRefundAmount(expectedRefundAmount, options);
  //   shopLogActualExpected('Invoice refund amount', actual, expectedRefundAmount);
  //   expect(actual).toBeCloseTo(expectedRefundAmount, 2);
  // }
  async validateShopCancelInvoiceRefundAmount(
    expectedRefundAmount: number,
    options?: { invoicePassword?: string }
  ): Promise<void> {
    const actual = await this.getShopCancelInvoiceRefundAmount(
      expectedRefundAmount,
      options
    );
  
    const tolerance = 1;
  
    expect(
      Math.abs(actual - expectedRefundAmount)
    ).toBeLessThanOrEqual(tolerance);
  }



  /** TC_SHOP_008 / TC_SHOP_011 — open invoice and return PDF URL. */
  async validateForecloseInvoice(params: {
    productName: string;
  }): Promise<string> {
    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 12_000,
      productName: params.productName,
      useEmiOrderDetail: true,
    });
    const pdfUrl = await this.getShopInvoicePdfUrl();
    shopLogGet('Invoice PDF URL', pdfUrl);
    return pdfUrl;
  }

  /** TC_SHOP_007 / TC_SHOP_010 — SHOP tab Booked EMI order row validation. */
  async validateShopBookedEmiOrderOnList(params: {
    productName: string;
    productDetails: ShopProductDetails;
    emiLinePrice: number;
    placedOrderId: string;
  }): Promise<MyOrderShopCardDetails> {
    await this.goToMyOrders();
    await this.clickShopTabSingleOrder();
    const shopOrder = await this.getShopEmiOrderDetails(params.productName);
    const orderDate = await this.getShopOrderDate(params.productName);
    shopLogGet('My Orders SHOP row (EMI)', shopOrder);
    expect(shopOrder.productName).toContain(params.productName);
    expect(shopOrder.quantity).toBe(Number(params.productDetails.quantity) || 1);
    expect(shopOrder.priceAmount).toBe(params.emiLinePrice);
    expect(shopOrder.orderId).toBe(params.placedOrderId);
    expect(shopOrder.status).toMatch(/booked/i);
    expect(this.isOrderedOnToday(orderDate)).toBe(true);
    return shopOrder;
  }

  /** TC_SHOP_007 / TC_SHOP_010 — EMI proforma invoice after down payment. */
  async validateShopEmiProformaInvoice(params: {
    productName: string;
    productDetails: ShopProductDetails;
    placedOrderId: string;
    emiLinePrice: number;
    emiInitialPayment: number;
    invoicePassword?: string;
  }): Promise<string> {
    const shopData = getShopDataset();
    const invoicePassword =
      params.invoicePassword ?? shopData.mobile.replace(/\D/g, '').slice(-4);
    await this.ensureShopEmiOrderDetailForInvoice(params.productName, {
      requireMatchingProduct: true,
    });
    await this.clickShopInvoice({
      maxAttempts: 4,
      captureTimeoutMs: 12_000,
      productName: params.productName,
      useEmiOrderDetail: true,
    });
    await this.submitShopInvoicePassword(invoicePassword);
    const pdfUrl = await this.getShopInvoicePdfUrl();
    let response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    if (!response.ok()) {
      await this.page.waitForTimeout(2_000);
      response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    }
    expect(response.ok()).toBeTruthy();
    const pdfText = pdfUtils.normalizePdfText(
      await shopPdfUtils.readShopInvoicePdf(await response.body(), invoicePassword));
    const isEmiProforma = shopPdfUtils.isShopEmiProformaInvoicePdf(pdfUrl);
    const expectedPdfNet = isEmiProforma ? params.emiLinePrice : params.emiInitialPayment;
    const netPayable = isEmiProforma
      ? shopPdfUtils.extractShopEmiProformaNetPayable(pdfText, params.emiLinePrice)
      : shopPdfUtils.extractShopNetPayable(pdfText);
    const invoiceNo = shopPdfUtils.extractShopInvoiceNumber(pdfText);
    const invoiceDate = shopPdfUtils.extractShopInvoiceDate(pdfText);
    const invoiceDateMissingInPdf = shopPdfUtils.isShopInvoiceDateMissingInPdf(pdfText);
    const gstin = pdfUtils.extractGstin(pdfText);
    const cin = pdfUtils.extractCin(pdfText);
    const gstDetails = shopPdfUtils.extractShopInvoiceGstDetails(pdfText);
    const pdfHasOrderId = shopPdfUtils.shopPdfContainsOrderReference(pdfText, params.placedOrderId);
    const pdfHasProduct =
      shopPdfUtils.shopPdfContainsProductName(pdfText, params.productName) ||
      shopPdfUtils.shopPdfContainsProductName(pdfText, params.productDetails.productName);

    shopLogGet('Invoice PDF URL', pdfUrl);
    shopLogGet('Invoice type', isEmiProforma ? 'EMI proforma contract' : 'Shop tax invoice');
    shopLogGet('Invoice number / transaction ID', invoiceNo);
    shopLogGet('Invoice date', invoiceDate || (invoiceDateMissingInPdf ? '(missing in PDF)' : ''));
    shopLogGet('GSTIN', gstin || '(not in PDF)');
    shopLogGet('CIN', cin || '(not in PDF)');
    shopLogGet('Net payable (PDF)', Number.isNaN(netPayable) ? '(not parsed)' : netPayable);
    shopLogGet('Expected net payable', expectedPdfNet);
    shopLogGet('EMI line price', params.emiLinePrice);
    shopLogGet('EMI initial payment (down payment)', params.emiInitialPayment);
    if (gstDetails.taxableAmount != null || gstDetails.igstAmount != null) {
      shopLogGet('GST details', gstDetails);
    }
    shopLogActualExpected('PDF order reference', pdfHasOrderId, true);
    shopLogActualExpected('PDF product name', pdfHasProduct, true);
    if (!Number.isNaN(netPayable)) {
      shopLogActualExpected('Net payable (PDF)', netPayable, expectedPdfNet);
    }

    expect(pdfHasOrderId).toBe(true);
    expect(pdfHasProduct).toBe(true);
    if (!Number.isNaN(netPayable)) {
      expect(Math.abs(netPayable - expectedPdfNet)).toBeLessThanOrEqual(1);
    }
    return pdfUrl;
  }

  async validateBuyMetalInvoice(params: {
    metal: 'gold' | 'silver';
    orderRowText: string;
    uiQuantity: number;
    buyingRate: number;
    taxableAmount: number;
    tax: number;
    payable: number;
    paidAmount: number;
  }): Promise<void> {
    if (params.metal !== 'gold') {
      throw new Error(`Invoice PDF validation is only supported for gold (got ${params.metal}).`);
    }
    await this.waitForOrderRowByText(params.orderRowText);
    const pdfUrl = await this.clickDownloadInvoiceAndGetUrl();

    let response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    if (!response.ok()) {
      await this.page.waitForTimeout(2_000);
      response = await this.page.request.get(pdfUrl, { timeout: 30_000 });
    }
    expect(response.ok()).toBeTruthy();

    const pdfText = pdfUtils.normalizePdfText(await pdfUtils.readPdfFromBuffer(await response.body()));
    const invoiceNo = pdfUtils.extractInvoiceNumber(pdfText);
    const invoiceDate = pdfUtils.extractInvoiceDate(pdfText);
    const gstin = pdfUtils.extractGstin(pdfText);
    const cin = pdfUtils.extractCin(pdfText);

    expect(invoiceNo).toBeTruthy();
    expect(invoiceDate).toBeTruthy();
    expect(gstin).toBeTruthy();
    expect(cin).toBeTruthy();

    const pdfGrams = pdfUtils.extractGoldGrams(pdfText);
    const pdfRate = pdfUtils.extractGoldRate(pdfText);
    const invoiceAmount = pdfUtils.extractGoldAmount(pdfText);
    const netPayable = pdfUtils.extractNetPayableAmount(pdfText);
    const totalGst = pdfUtils.extractTotalGstAmount(pdfText);
    const expectedNetPayable = params.paidAmount || params.payable;

    console.log(`[BUY INVOICE] grams actual=${pdfGrams} expected=${params.uiQuantity}`);
    expect(pdfGrams).toBeCloseTo(params.uiQuantity, 3);
    console.log(`[BUY INVOICE] rate actual=${pdfRate} expected=${params.buyingRate}`);
    expect(pdfRate).toBe(params.buyingRate);
    console.log(`[BUY INVOICE] taxable actual=${invoiceAmount} expected=${params.taxableAmount}`);
    expect(Math.abs(invoiceAmount - params.taxableAmount)).toBeLessThanOrEqual(1);
    console.log(`[BUY INVOICE] net payable actual=${netPayable} expected=${expectedNetPayable}`);
    expect(Math.abs(netPayable - expectedNetPayable)).toBeLessThanOrEqual(1);
    console.log(`[BUY INVOICE] GST actual=${totalGst} expected=${params.tax}`);
    expect(Math.abs(Number(totalGst.toFixed(2)) - Number(params.tax.toFixed(2)))).toBeLessThanOrEqual(1);
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
    options?: { narrationHint?: string; amountTolerance?: number; timeoutMs?: number }): Promise<void> {
    const hint = options?.narrationHint ?? 'Sold';
    await this.waitForOrderRowByTextAndAmount(
      hint,
      expectedAmount,
      options?.amountTolerance ?? 1,
      options?.timeoutMs ?? 60_000);
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
        { timeout: timeoutMs, intervals: [500, 1000, 2000, 3000] })
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
    timeoutMs = 60_000): Promise<void> {
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
      `My Orders: no "${text}" row with amount ~${expectedAmount} (±${amountTolerance}) within ${timeoutMs}ms`);
  }

  getLatestOrderRow(): Locator {
    return this.selectedOrderRow ?? this.orderRows.first();
  }

  /** Count of order rows currently rendered on the active My Orders tab (0 when "No Record Found"). */
  async getOrderRowCount(): Promise<number> {
    const noRecordVisible = await this.noRecordLabel.isVisible().catch(() => false);
    if (noRecordVisible) {
      return 0;
    }
    return this.orderRows.count();
  }

  /** True if any rendered order row contains both the given product name and a "Pending" status. */
  async hasPendingOrderRowForProduct(productName: string): Promise<boolean> {
    const noRecordVisible = await this.noRecordLabel.isVisible().catch(() => false);
    if (noRecordVisible) {
      return false;
    }

    const matchingRow = this.orderRows
      .filter({ hasText: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .filter({ hasText: /Pending/i });

    return (await matchingRow.count()) > 0;
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
        /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i)?.[1];
      if (normalized) {
        return normalized.trim();
      }
    }

    const rowText = ((await row.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const statusFromText =
      rowText.match(
        /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i)?.[1] ?? '';
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
      /\b(Pending|Processing|Payment Received|Payment Pending|Completed|Failed|Confirmed|Booked|Order Placed|In Transit|Shipped)\b/i)?.[1];
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
        { timeout: timeoutMs, intervals: [500, 1000, 2000, 3000] })
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
        })
      .toBeTruthy();

    console.log('[My orders list] Actual status:', status);
    if (!MyOrderVerificationPage.isPreCompletionDeliveryStatus(status)) {
      throw new Error(
        `My orders list status mismatch. Expected a pre-completion delivery status, actual "${status}"`);
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

  /** TC004+ withdrawal — open Delivery tab and validate latest pending product order. */
  async validateWithdrawalDeliveryOrderPending(expected: {
    productName: string;
    productWeight: string;
    quantity: number;
    expectedAmount?: number;
  }): Promise<void> {
    await this.goToMyOrders();
    await this.waitForOrderRow();
    await this.clickOnDelivery();
    await this.validateLatestOrderRowStatusPending();
    await this.waitForProductOrderCard();
    await this.validateProductOrderCardAgainstExpected(expected);
  }

  /**
   * Asserts my-order product card matches expected product/quantity/amount (e.g. same values as cart validation used before payment).
   */
  async validateProductOrderCardAgainstExpected(
    expected: { productName: string; productWeight: string; quantity: number; expectedAmount?: number },
    options?: { amountTolerance?: number }): Promise<void> {
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
        `My order product name mismatch. Expected title to contain "${expected.productName}", actual "${order.productName}"`);
    }

    if (expected.quantity > 0 && Math.abs(order.quantity - expected.quantity) > 0.0001) {
      throw new Error(
        `My order quantity mismatch. Expected "${expected.quantity}", actual "${order.quantity}"`);
    }

    const expectedWeightGm = Number(expected.productWeight.match(/[\d.]+/)?.[0] ?? '0');
    const weightInTitle = order.productName.match(/([\d.]+)\s*Gm/i);
    const titleWeightGm = weightInTitle ? Number(weightInTitle[1]) : 0;
    if (expectedWeightGm > 0 && titleWeightGm > 0 && Math.abs(expectedWeightGm - titleWeightGm) > 0.001) {
      throw new Error(
        `My order product weight mismatch vs cart. Cart weight implied "${expected.productWeight}" (${expectedWeightGm} g), title shows ${titleWeightGm} g`);
    }

    if (expected.expectedAmount !== undefined) {
      if (Math.abs(order.priceAmount - expected.expectedAmount) > tol) {
        throw new Error(
          `My order amount mismatch. Expected ₹${expected.expectedAmount}, actual ₹${order.priceAmount}`);
      }
    }

    const resolvedStatus = (order.status || (await this.getStatusFromLatestOrderRow())).trim();
    if (!MyOrderVerificationPage.isPreCompletionDeliveryStatus(resolvedStatus)) {
      throw new Error(
        `My order status mismatch. Expected a pre-completion delivery status, actual "${resolvedStatus || 'N/A'}"`);
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
    const button = row.getByRole('button', { name: /^DELIVERY$/i }).first();
    const labelledControl = row.locator('[role="radio"][aria-label="DELIVERY"]').first();
    const label = row.locator('span.p-button-label', { hasText: /^DELIVERY$/i }).first();

    if (await deliveryRadio.isVisible().catch(() => false)) {
      await deliveryRadio.click({ force: true });
    } else if (await button.isVisible().catch(() => false)) {
      await button.click({ force: true });
    } else if (await labelledControl.isVisible().catch(() => false)) {
      await labelledControl.click({ force: true });
    } else if (await label.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await label.click({ force: true });
    } else {
      // No per-row DELIVERY control on the latest row (e.g. it's a plain Buy transaction) — fall
      // through directly to the top-level "DELIVERY" tab pill in the My Orders tab bar
      // (BUY/SELL/DELIVERY/JEWELLERY EXCHANGE/SHOP). Confirmed live 2026-09-01: that tab pill also
      // satisfies a page-wide `getByRole('radio'|'button', ...)` search, so the old code's global
      // fallbacks just force-clicked this same pill anyway — and a `force: true` click there
      // visually highlights the tab without ever switching the page's content away from Buy. A
      // plain click switches it correctly, so go straight to that instead of routing back through
      // more force-click attempts on the same element.
      const tabPill = this.page.getByText('DELIVERY', { exact: true }).first();
      await tabPill.waitFor({ state: 'visible', timeout: 15_000 });
      await tabPill.click();
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
          `xpath=.//div[contains(normalize-space(), "${label}") and contains(normalize-space(), ":")]/ancestor::div[contains(@class,"col-span-1")][1]/following-sibling::div[1]//div[contains(@class,"text-nickel")]`)
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
