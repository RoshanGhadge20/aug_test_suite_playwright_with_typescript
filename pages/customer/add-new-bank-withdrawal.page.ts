import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class AddNewBankWithdrawalPage extends BasePage {
  private readonly addNewBankButton: Locator;
  private readonly cancelButton: Locator;
  private readonly accountNumberInput: Locator;
  private readonly ifscInput: Locator;
  private readonly saveBankButton: Locator;

  private readonly invalidAccountToast: Locator;
  private readonly toastErrorSummary: Locator;
  private readonly toastErrorDetail: Locator;
  private readonly toastCloseIcon: Locator;

  private readonly ifscFieldErrorMessage: Locator;
  private readonly accountNumberFieldErrorMessage: Locator;
  private readonly firstBankDeleteButton: Locator;
  private readonly removeAccountDialog: Locator;
  private readonly removeAccountMessage: Locator;
  private readonly removeButton: Locator;
  private readonly cancelRemoveButton: Locator;

  private readonly successToast: Locator;
  private readonly successToastTitle: Locator;
  private readonly successToastMessage: Locator;
  private readonly bankCards: Locator;
  private readonly bankAccountOption: Locator;
  private readonly addUpiButton: Locator;
  private readonly upiInput: Locator;
  private readonly upiCards: Locator;


  constructor(page: Page) {
    super(page);
    this.bankCards = page.locator('div.border.cursor-pointer.rounded-lg');
    this.upiCards = page.locator('div.border.rounded-lg.py-4.px-4');
    this.upiInput = page.getByPlaceholder('Enter UPI ID');
    this.successToast = page.locator('div[role="alert"]');
    this.successToastTitle = this.successToast.locator('p.font-gilroybold');
    this.successToastMessage = this.successToast.locator('p.font-gilroy').last();
    this.toastCloseIcon = this.successToast.locator('.pi-times');
    this.bankAccountOption = page.getByRole('button', {
      name: 'Bank Account View, manage and add bank accounts',
    });
    this.addUpiButton = page.getByRole('button', {
      name: '+ Add UPI ID',
    });

    this.firstBankDeleteButton = page
      .locator('div.border.cursor-pointer.rounded-lg')
      .first()
      .locator('.pi-trash');

    this.removeAccountDialog = page.getByRole('dialog', {
      name: 'Remove Account',
    });

    this.removeAccountMessage = this.removeAccountDialog.getByText(
      'Are you sure you want to remove this bank account?'
    );

    this.removeButton = this.removeAccountDialog.getByRole('button', {
      name: 'Remove',
    });

    this.cancelRemoveButton = this.removeAccountDialog.getByRole('button', {
      name: 'Cancel',
    });

  


    this.addNewBankButton = page.getByRole('button', {
      name: '+ Add Bank Account',
    });

    this.cancelButton = page.getByRole('button', {
      name: 'Close',
    });

    this.accountNumberInput = page.locator('input#accountNumber');
    this.ifscInput = page.locator('input#ifscCode');

    this.saveBankButton = page.getByRole('button', {
      name: 'Done',
    });

    this.invalidAccountToast = page
      .locator(
        'section:has(p:text-is("Error")):has(p:text-is("TRANSACTION NOT ALLOWED AS INVALID ACCOUNT"))'
      )
      .first();

    this.toastErrorSummary = page
      .locator(
        '.p-toast-message-error .p-toast-summary, p.font-gilroybold.text-failed'
      )
      .first();

    this.toastErrorDetail = page
      .locator(
        '.p-toast-message-error .p-toast-detail, p.font-gilroy'
      )
      .first();

    this.toastCloseIcon = page
      .locator('div.p-toast i.pi-times')
      .first();

    this.ifscFieldErrorMessage = page
      .locator('input#ifscCode')
      .locator(
        'xpath=ancestor::div[contains(@class,"ng-invalid")]//small[contains(@class,"p-error")]'
      )
      .first();

    this.accountNumberFieldErrorMessage = page
      .locator('input#accountNumber')
      .locator(
        'xpath=ancestor::div[contains(@class,"ng-invalid")]//small[contains(@class,"p-error")]'
      )
      .first();

    this.successToast = page.locator('div[role="alert"]');

    this.successToastTitle = this.successToast.locator('p.font-gilroybold');

    this.successToastMessage = this.successToast.locator('p.font-gilroy').last();

    this.toastCloseIcon = this.successToast.locator('.pi-times');
  }

  async getSuccessToastTitle(): Promise<string> {
    await expect(this.successToastTitle).toBeVisible();
    return (await this.successToastTitle.textContent())?.trim() ?? '';
  }

  async getSuccessToastMessage(): Promise<string> {
    await expect(this.successToastMessage).toBeVisible();
    return (await this.successToastMessage.textContent())?.trim() ?? '';
  }

 
  // async verifyRemoveAccountPopup(): Promise<void> {
  //   await expect(this.removeAccountMessage).toBeVisible();
  //   await expect(this.removeButton).toBeVisible();
  //   await expect(this.cancelRemoveButton).toBeVisible();
  // }

  async verifyRemovePopup(
    title: string,
    message: string
  ): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: title });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(message)).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Remove' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Cancel' })
    ).toBeVisible();
  }
  async clickRemove(title: string): Promise<void> {
    await this.page
      .getByRole('dialog', { name: title })
      .getByRole('button', { name: 'Remove' })
      .click();
  }
  async clickCancelRemove(title: string): Promise<void> {
    await this.page
      .getByRole('dialog', { name: title })
      .getByRole('button', { name: 'Cancel' })
      .click();
  }
  async clickFirstBankDelete(): Promise<void> {
    // Expand Bank Account section if collapsed
    if ((await this.bankAccountOption.getAttribute('aria-expanded')) !== 'true') {
      await this.bankAccountOption.click();
    }

    await expect(this.firstBankDeleteButton).toBeVisible();
    await expect(this.firstBankDeleteButton).toBeEnabled();

    await this.firstBankDeleteButton.click();
  }

  
  async clickAddBankDetails(): Promise<void> {
    await this.addNewBankButton.waitFor({ state: 'visible' });
    await expect(this.addNewBankButton).toBeEnabled();
    await this.addNewBankButton.click();
  }

  async enterAccountNumber(accountNumber: string): Promise<void> {
    await this.accountNumberInput.waitFor({ state: 'visible' });
    await this.accountNumberInput.press('Tab');
    await this.accountNumberInput.click();
    await this.accountNumberInput.fill(accountNumber);
  }

  async enterIFSCCode(ifscCode: string): Promise<void> {
    await this.ifscInput.waitFor({ state: 'visible' });
    await expect(this.ifscInput).toBeEditable();

    await this.ifscInput.fill('');
    await this.ifscInput.type(ifscCode, { delay: 50 });
    await this.ifscInput.press('Tab');
  }

  async fillBankDetails(
    accountNumber: string,
    ifscCode: string,
  ): Promise<void> {
    await this.enterAccountNumber(accountNumber);
    await this.enterIFSCCode(ifscCode);
  }

  async clickSaveBank(): Promise<void> {
    await this.saveBankButton.waitFor({ state: 'visible' });
    await this.saveBankButton.click();
  }

  async addBankDetails(
    accountNumber: string,
    ifscCode: string,
  ): Promise<void> {
    await this.clickAddBankDetails();
    await this.fillBankDetails(accountNumber, ifscCode);
  //  await this.clickSaveBank();
  }

  async isSaveBankEnabled(): Promise<boolean> {
    await this.saveBankButton.waitFor({ state: 'visible' });
    return await this.saveBankButton.isEnabled();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.waitFor({ state: 'visible' });
    await this.cancelButton.click();
  }

  async getErrorSummary(): Promise<string> {
    await this.toastErrorSummary.waitFor({ state: 'visible' });
    return (await this.toastErrorSummary.textContent())?.trim() ?? '';
  }

  async getToastMessage(): Promise<string> {
    await this.toastErrorDetail.waitFor({ state: 'visible' });
    return (await this.toastErrorDetail.textContent())?.trim() ?? '';
  }

  async getIFSCFieldErrorMessage(): Promise<string> {
    await this.ifscFieldErrorMessage.waitFor({ state: 'visible' });
    return (
      (await this.ifscFieldErrorMessage.textContent())?.trim() ?? ''
    );
  }

  async getAccountNumberFieldErrorMessage(): Promise<string> {
    await this.accountNumberFieldErrorMessage.waitFor({
      state: 'visible',
    });

    return (
      (await this.accountNumberFieldErrorMessage.textContent())?.trim() ??
      ''
    );
  }

  async getInvalidAccountToastMessage(
    timeoutMs = 10000,
  ): Promise<string> {
    await this.invalidAccountToast.waitFor({
      state: 'visible',
      timeout: timeoutMs,
    });

    return (
      (await this.invalidAccountToast
        .locator('p.font-gilroy')
        .first()
        .textContent())?.trim() ?? ''
    );
  }

 

  async getAnyValidationErrorMessage(): Promise<string> {
    const locators = [
      this.accountNumberFieldErrorMessage,
      this.ifscFieldErrorMessage,
      this.page.locator('section[role="alert"] p').nth(1),
    ];
  
    for (const locator of locators) {
      if (await locator.isVisible().catch(() => false)) {
        return (await locator.textContent())?.trim() ?? '';
      }
    }
  
    throw new Error('No validation error message found.');
  }

  async closeToast(): Promise<void> {
    if (await this.toastCloseIcon.isVisible().catch(() => false)) {
      await this.toastCloseIcon.click();
    }
  }

  async clickAddUpiButton(): Promise<void> {
    await this.addUpiButton.click();
  }
  async enterUpiId(upiId: string): Promise<void> {
    await expect(this.upiInput).toBeVisible();
    await this.upiInput.clear();
    await this.upiInput.fill(upiId);
  }
   messageLocator(message: string) {
    return this.page.locator(`p:has-text("${message}")`);
  }

  async enterUpiIdAndValidateDoneButton(
    upiId: string,
    isEnabled: boolean
  ) {
    await this.enterUpiId(upiId);

    if (isEnabled) {
      await expect(this.saveBankButton).toBeEnabled();
    } else {
      await expect(this.saveBankButton).toBeDisabled();
    }
  }

  async validateUpiErrorMessage(
    upiId: string,
    expectedMessage: string
  ) {
    await this.enterUpiId(upiId);
    await this.clickSaveBank();

    const errorMessage = (
      await this.messageLocator(expectedMessage).innerText()
    ).trim();

    expect(errorMessage.trim()).toBe(expectedMessage.trim());

    return errorMessage;
  }
  private deleteUpiButton(upiId: string): Locator {
    return this.upiCards
      .filter({
        has: this.page.getByText(upiId, { exact: true }),
      })
      .locator('.pi-trash');
  }
  async clickDeleteUpi(upiId: string): Promise<void> {
    const deleteButton = this.deleteUpiButton(upiId);
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    console.log('click on delete UPI button');
  }
}

