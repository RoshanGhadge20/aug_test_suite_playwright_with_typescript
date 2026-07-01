import { BasePage } from '../shared/base.page';
import { test, expect, Page,Locator} from '@playwright/test';


export class WithdrawPamentPage extends BasePage{

    readonly successPopup: Locator;
    readonly successTitle: Locator;
    readonly successMessage: Locator;
    readonly continueButton: Locator;  

    constructor(page:Page) {
        super(page);
    
        this.successPopup = page.locator('div[role="dialog"]');
        this.successTitle = page.getByText('Success', { exact: true });
        this.successMessage = this.successPopup.locator(
          'div:text-matches("^Successfully Sold")'
        );
        this.continueButton = page.getByRole('button', {
          name: 'Continue',
        });
          
    }


    async validateSuccessPopup(): Promise<void> {
        await expect(this.successPopup).toBeVisible({ timeout: 10000 });
      
        const title = await this.successPopup
          .locator('.p-dialog-title')
          .textContent();
      
        console.log(`Popup Title: ${title}`);
      
        await expect(this.continueButton).toBeVisible();
      }
    
      async clickContinue(): Promise<void> {
        await this.continueButton.click();
      }
      async validateSuccessPopupDetails(
        expectedWeight: number,
        expectedPrice: number,
        metalType: string
      ): Promise<void> {
        const message =
          (await this.successMessage.textContent())?.trim() || '';
      
        expect(message.toLowerCase()).toContain(
          `${expectedWeight} grams of ${metalType}`.toLowerCase()
        );
      
        expect(message).toContain(
          expectedPrice.toFixed(2)
        );
      }
    
    }
