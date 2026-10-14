import { BasePage } from '../shared/base.page';
import { test, expect, Page,Locator} from '@playwright/test';


export class WithdrawDetailPage extends BasePage {
  private readonly withdrawalQuantityInput: Locator;
  private readonly withdrawButton: Locator;
  private readonly silverTab : Locator;
  private readonly goldTab : Locator;
  private readonly withdrawFullBalanceCheckboxLabel: Locator;

private readonly withdrawalAmount: Locator;

  constructor(page:Page) {
    super(page);
        this.withdrawalQuantityInput = this.page.locator(
      'input.p-inputnumber-input',
    );
this.withdrawButton = page.getByRole('button', {
  name: 'Withdraw',
});
this.withdrawFullBalanceCheckboxLabel = page.locator('label[for="full"]');
this. silverTab = this.page.getByRole('button', { name: 'SILVER' });
  this.withdrawalAmount = page.locator(
    'div[data-pc-name="inputgroupaddon"]'
  );

  this. goldTab = this.page.getByRole('button', { name: 'Gold' });
  this.withdrawalAmount = page.locator(
    'div[data-pc-name="inputgroupaddon"]'
  );


  }
async clickSilverTab(): Promise<void> {
  await this.silverTab.click();
}
async clickGoldTab(): Promise<void> {
  await this.goldTab.click();
}


async getWithdrawalAmount(): Promise<number> {
  await expect(this.withdrawalAmount).toBeVisible();

  await expect(this.withdrawalAmount).not.toHaveText(/^₹?0(\.00)?$/);

  const text = await this.withdrawalAmount.textContent();

  return Number(
    text?.replace(/[₹,]/g, '').trim() ?? '0',
  );
}   
 async enterWithdrawalQuantity(quantity: number | string): Promise<void> {
    await this.withdrawalQuantityInput.click();
    await this.withdrawalQuantityInput.press('Control+A');
    await this.withdrawalQuantityInput.press('Backspace');
    await this.withdrawalQuantityInput.fill(String(quantity));
    await expect(this.withdrawalQuantityInput).toHaveValue(
      String(quantity),
    );
      await this.withdrawalQuantityInput.press('Enter');

  }

  async getWithdrawalSummary(metal: 'Gold' | 'Silver'): Promise<{
  totalValue: number;
  totalMetal: number;
}> {
  const totalValueText = await this.page
    .locator('p:has-text("Total Value")')
    .locator('xpath=following-sibling::p[1]')
    .textContent();

  const totalMetalText = await this.page
    .locator(`p:has-text("Total ${metal}")`)
    .locator('xpath=following-sibling::p[1]')
    .textContent();

  return {
    totalValue: Number(
      totalValueText
        ?.replace('₹', '')
        .replace(/,/g, '')
        .trim(),
    ),
    totalMetal: Number(
      totalMetalText
        ?.replace(/\s*gm?\b/i, '')
        .replace(/,/g, '')
        .trim(),
    ),
  };
}
async clickWithdraw(): Promise<void> {
  await this.withdrawButton.click();
}

  /** Ticks "Withdraw Full Balance from <Metal> Vault" — auto-fills quantity with the full available balance. */
  async tickWithdrawFullBalanceCheckbox(): Promise<void> {
    await this.withdrawFullBalanceCheckboxLabel.waitFor({ state: 'visible' });
    await this.withdrawFullBalanceCheckboxLabel.click();
    await expect(this.withdrawalQuantityInput).toBeDisabled();
  }
  async validateWithdrawButtonDisabled(): Promise<void> {
    await expect(this.withdrawButton).toBeDisabled();
    console.log('Withdraw button is disabled');
  }

  async enterWithdrawalQuantityGetErrorMessage(
    quantity: number | string
  ) {
    const error = this.page.locator('small.p-error');

    await this.withdrawalQuantityInput.click();
    await this.withdrawalQuantityInput.press('Control+A');
    await this.withdrawalQuantityInput.press('Backspace');

    await Promise.all([
      this.withdrawalQuantityInput.pressSequentially(String(quantity), {
        delay: 300,
      }),
      error.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { }),
    ]);

    return error;
  }
}