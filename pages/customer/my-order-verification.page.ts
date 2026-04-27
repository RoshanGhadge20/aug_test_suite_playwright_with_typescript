import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

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

  async goToMyOrders(): Promise<void> {
    await this.page.goto('/my-orders');
    await this.page.waitForURL('**/my-orders');
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
}
