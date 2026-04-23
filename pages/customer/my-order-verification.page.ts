import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class MyOrderVerificationPage extends BasePage {
  private readonly orderBlock: Locator;

  constructor(page: Page) {
    super(page);

    this.orderBlock = page
      .locator('div.p-4.flex.flex-wrap.lg\\:flex-nowrap.justify-center.lg\\:justify-between.items-center.gap-6')
      .first();
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

  async getDate(): Promise<string> {
    return (await this.orderBlock
      .locator('div.text-10:has-text("Date")')
      .locator('xpath=following-sibling::div[1]')
      .textContent())?.trim() ?? '';
  }

  async getTransactionId(): Promise<string> {
    return (await this.orderBlock
      .locator('div.text-10:has-text("Transaction ID")')
      .locator('xpath=following-sibling::div[1]')
      .textContent())?.trim() ?? '';
  }

  async getTimeOfPurchase(): Promise<string> {
    return (await this.orderBlock
      .locator('div.text-10:has-text("Time of Purchase")')
      .locator('xpath=following-sibling::div[1]')
      .textContent())?.trim() ?? '';
  }

  async getAmount(): Promise<number> {
    const text = await this.orderBlock
      .locator('div.text-10:has-text("Amount")')
      .locator('xpath=following-sibling::div[1]')
      .innerText();

    return Number(text.replace(/,/g, '').trim());
  }

  async getNarration(): Promise<string> {
    return (await this.orderBlock
      .locator('div.text-10:has-text("Narration")')
      .locator('xpath=following-sibling::div[1]')
      .innerText())
      .trim();
  }

  async getNarrationQuantity(): Promise<number | null> {
    const narration = await this.getNarration();
    const match = narration.match(/([\d.]+)\s*gm/i);
    return match ? parseFloat(match[1]) : null;
  }

  async waitForOrderRow(): Promise<void> {
    await this.page
      .locator('text=No Record Found')
      .waitFor({ state: 'detached' })
      .catch(() => {});

    await this.orderBlock.waitFor({ state: 'visible' });
  }

  getLatestOrderRow(): Locator {
    return this.orderBlock;
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
