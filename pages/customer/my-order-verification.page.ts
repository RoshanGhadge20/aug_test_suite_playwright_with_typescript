import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

/** Product line on my-orders delivery / product detail card (see flex row with h3 + Transaction Id). */
export type MyOrderProductCardDetails = {
  productName: string;
  transactionId: string;
  status: string;
  quantity: number;
  priceAmount: number;
  productImageSrc?: string;
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

  constructor(page: Page) {
    super(page);

    this.orderRows = page.locator('div.p-4').filter({
      has: page.locator('div.text-10:has-text("Transaction ID")'),
    });
    this.noRecordLabel = page.locator('text=No Record Found');
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

  /** Milliseconds to wait after clicking Sell so the list can refresh before assertions. */
  private static readonly settleAfterSellClickMs = 1_500;

  /**
   * Clicks the first visible Sell control and waits briefly for the Sell list to settle.
   */
  private async clickVisibleSellControl(locator: Locator, visibilityTimeout?: number): Promise<boolean> {
    const visible =
      visibilityTimeout !== undefined
        ? await locator.isVisible({ timeout: visibilityTimeout }).catch(() => false)
        : await locator.isVisible().catch(() => false);
    if (!visible) return false;
    await locator.click({ force: true });
    await this.page.waitForTimeout(MyOrderVerificationPage.settleAfterSellClickMs);
    return true;
  }

  async clickSellTab(): Promise<void> {
    const row = this.getLatestOrderRow();

    if (await this.clickVisibleSellControl(row.getByRole('radio', { name: /^SELL$/i }).first())) return;
    if (await this.clickVisibleSellControl(row.getByRole('button', { name: /^SELL$/i }).first())) return;
    if (await this.clickVisibleSellControl(row.getByRole('tab', { name: /^SELL$/i }).first())) return;
    if (await this.clickVisibleSellControl(row.getByRole('link', { name: /^SELL$/i }).first())) return;
    if (await this.clickVisibleSellControl(row.locator('span.p-button-label', { hasText: /^SELL$/i }).first(), 2_000))
      return;

    // Global fallbacks
    if (await this.clickVisibleSellControl(this.page.getByRole('radio', { name: /^SELL$/i }).first(), 10_000))
      return;
    if (await this.clickVisibleSellControl(this.page.getByRole('button', { name: /^SELL$/i }).first(), 5_000))
      return;
    if (await this.clickVisibleSellControl(this.page.getByRole('tab', { name: /^SELL$/i }).first(), 5_000)) return;
    if (await this.clickVisibleSellControl(this.page.getByRole('link', { name: /^SELL$/i }).first(), 5_000)) return;
    if (await this.clickVisibleSellControl(this.page.locator('span.p-button-label', { hasText: /^SELL$/i }).first(), 5_000))
      return;

    // If no explicit Sell control exists, continue if rows are already present.
    const rowVisible = await this.orderRows.first().isVisible({ timeout: 3_000 }).catch(() => false);
    if (rowVisible) return;

    throw new Error('SELL tab/control is not visible and no order rows are present.');
  }

  async goToMyOrders(): Promise<void> {
    await this.page.goto('/my-orders');
    await this.page.waitForURL('**/my-orders');
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(1500);
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

  async waitForOrderRowByText(text: string, timeout = 45_000): Promise<void> {
    await this.page
      .locator('text=No Record Found')
      .waitFor({ state: 'detached' })
      .catch(() => {});

    const row = this.orderRows.filter({ hasText: new RegExp(text, 'i') }).first();
    await row.waitFor({ state: 'visible', timeout });
    this.selectedOrderRow = row;
  }

  getLatestOrderRow(): Locator {
    return this.selectedOrderRow ?? this.orderRows.first();
  }

  private async getStatusFromLatestOrderRow(): Promise<string> {
    const row = this.getLatestOrderRow();
    const rowBadge = row.locator('span').filter({ hasText: /^Pending$|^Completed$|^Failed$|^Processing$/i }).first();
    const rowBadgeText = ((await rowBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    if (rowBadgeText) {
      return rowBadgeText;
    }

    const rowText = ((await row.innerText().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    const statusFromText = rowText.match(/\b(Pending|Completed|Failed|Processing)\b/i)?.[1] ?? '';
    if (statusFromText.trim()) {
      return statusFromText.trim();
    }

    // Fallback for layouts where status badge is not nested under selected row wrapper.
    const globalBadge = this.page
      .locator('span')
      .filter({ hasText: /^Pending$|^Completed$|^Failed$|^Processing$/i })
      .first();
    const globalBadgeText = ((await globalBadge.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
    return globalBadgeText;
  }

  async validateLatestOrderRowStatusPending(): Promise<void> {
    const status = await this.getStatusFromLatestOrderRow();
    console.log('[My orders list] Expected status: Pending');
    console.log('[My orders list] Actual status:', status || 'N/A');
    if (!/pending/i.test(status)) {
      throw new Error(`My orders list status mismatch. Expected "Pending", actual "${status || 'N/A'}"`);
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

    const resolvedStatus = order.status || (await this.getStatusFromLatestOrderRow());
    if (!/pending/i.test(resolvedStatus)) {
      throw new Error(`My order status mismatch. Expected "Pending", actual "${resolvedStatus || 'N/A'}"`);
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
      return;
    }

    const button = row.getByRole('button', { name: /^DELIVERY$/i }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ force: true });
      return;
    }

    const labelledControl = row.locator('[role="radio"][aria-label="DELIVERY"]').first();
    if (await labelledControl.isVisible().catch(() => false)) {
      await labelledControl.click({ force: true });
      return;
    }

    const label = row.locator('span.p-button-label', { hasText: /^DELIVERY$/i }).first();
    if (await label.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await label.click({ force: true });
      return;
    }

    // Final fallback: click any visible DELIVERY control on the page.
    const globalRadio = this.page.getByRole('radio', { name: /^DELIVERY$/i }).first();
    if (await globalRadio.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await globalRadio.click({ force: true });
      return;
    }

    const globalButton = this.page.getByRole('button', { name: /^DELIVERY$/i }).first();
    if (await globalButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await globalButton.click({ force: true });
      return;
    }

    const globalLabel = this.page.locator('span.p-button-label', { hasText: /^DELIVERY$/i }).first();
    await globalLabel.waitFor({ state: 'visible', timeout: 15_000 });
    await globalLabel.click({ force: true });
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
