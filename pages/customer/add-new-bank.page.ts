import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class AddNewBankPage extends BasePage {
  private readonly addNewBankButton: Locator;
  private readonly bankDropdown: Locator;
  private readonly dropdownList: Locator;
  private readonly beneficiaryNameInput: Locator;
  private readonly accountNumberInput: Locator;
  private readonly accountTypeDropdown: Locator;
  private readonly ifscInput: Locator;
  private readonly addNewBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewBankButton = page.getByRole('button', { name: 'Add New' });
    this.bankDropdown = page.locator('span[role="combobox"][aria-label="--Select--"]');
    this.dropdownList = page.locator('ul[role="listbox"]');
    this.beneficiaryNameInput = page.locator('input#beneficiaryName');
    this.accountNumberInput = page.locator('input#accountNumber');
    this.accountTypeDropdown = page.locator('span[role="combobox"][aria-label="Account Type"]');
    this.ifscInput = page.locator('input#ifscCode');
    this.addNewBtn = page.getByRole('button', { name: 'Add New' });
  }

  async clickAddNewBank(): Promise<void> {
    const addNewVisible = await this.addNewBankButton.isVisible().catch(() => false);
    if (!addNewVisible) {
      // In some flows, the "Choose Bank Account" dialog opens directly with the add-bank form.
      const bankFormVisible = await this.beneficiaryNameInput.isVisible().catch(() => false);
      if (bankFormVisible) {
        return;
      }
    }
    await this.addNewBankButton.waitFor({ state: 'visible', timeout: 20_000 });
    await this.addNewBankButton.click();
  }

  async openBankDropdown(): Promise<void> {
    await this.bankDropdown.waitFor({ state: 'visible' });
    await this.bankDropdown.click();
  }

  async selectBankOption(optionText: string): Promise<void> {
    await this.dropdownList.waitFor({ state: 'visible' });
    const exactOption = this.page.getByRole('option', { name: optionText }).first();
    if (await exactOption.isVisible().catch(() => false)) {
      await exactOption.click();
      return;
    }

    const normalized = optionText
      .replace(/\b(ltd|limited)\b/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const fallbackOption = this.page
      .locator('li[role="option"]')
      .filter({ hasText: new RegExp(normalized, 'i') })
      .first();
    await fallbackOption.waitFor({ state: 'visible', timeout: 20_000 });
    await fallbackOption.click();
  }

  async enterBeneficiaryName(name: string): Promise<void> {
    await this.beneficiaryNameInput.fill(name);
  }

  async enterAccountNumber(accNumber: string): Promise<void> {
    await this.accountNumberInput.fill(accNumber);
  }

  async openAccountTypeDropdown(): Promise<void> {
    await this.accountTypeDropdown.click();
  }

  async selectAccountType(optionText: string): Promise<void> {
    const exactOption = this.page.getByRole('option', { name: optionText }).first();
    if (await exactOption.isVisible().catch(() => false)) {
      await exactOption.click();
      return;
    }

    const normalized = optionText
      .replace(/\bsavings\b/gi, 'saving')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const fallbackOption = this.page
      .locator('li[role="option"]')
      .filter({ hasText: new RegExp(normalized, 'i') })
      .first();
    await fallbackOption.waitFor({ state: 'visible', timeout: 20_000 });
    await fallbackOption.click();
  }

  async enterIFSCCode(ifsc: string): Promise<void> {
    await this.ifscInput.fill(ifsc);
  }

  async clickAddNew(): Promise<void> {
    await this.addNewBtn.waitFor({ state: 'visible' });
   // await expect(this.addNewBtn).toBeEnabled({ timeout: 15_000 });
    await this.addNewBtn.click();
  }
}
