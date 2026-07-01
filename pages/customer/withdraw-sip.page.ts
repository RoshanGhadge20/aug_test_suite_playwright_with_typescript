import { BasePage } from '@pages/shared/base.page';
import { Locator, Page } from '@playwright/test';

export interface SipDetails {
  sipName: string;
  quantity: number;
  amount: number;
}

export class Withdrawsip extends BasePage {
  readonly sipCards: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page);

    this.sipCards = page.locator(
      'div.rounded-xl.px-4.py-3.cursor-pointer.mb-2'
    );

    this.nextPageButton = page.locator(
      'button.p-paginator-next:not(.p-disabled)'
    );
  }

  // async selectSipForWithdrawal(): Promise<SipDetails> {
  //   let pageNumber = 1;

  //   while (true) {
  //     const cardCount = await this.sipCards.count();

  //     // Skip Gold Vault on first page
  //     const startIndex = pageNumber === 1 ? 1 : 0;

  //     for (let i = startIndex; i < cardCount; i++) {
  //       const card = this.sipCards.nth(i);

  //       const sipName =
  //         (
  //           await card
  //             .locator('p.text-16.font-bold')
  //             .first()
  //             .textContent()
  //         )?.trim() ?? '';

  //       const quantityText =
  //         (await card.locator('p.text-xs').textContent()) ?? '';

  //       const amountText =
  //         (
  //           await card
  //             .locator('p.text-16.font-bold')
  //             .last()
  //             .textContent()
  //         )?.trim() ?? '';

  //       const goldQuantity = Number(
  //         quantityText.match(/([\d.]+)\s*gm/i)?.[1] ?? 0
  //       );

  //       const amount = Number(
  //         amountText.replace(/[₹,\s]/g, '')
  //       );

  //       console.log({
  //         sipName,
  //         goldQuantity,
  //         amount,
  //       });

  //       if (goldQuantity > 0 && amount > 0) {
  //         await card.click();

  //         return {
  //           sipName,
  //           goldQuantity,
  //           amount,
  //         };
  //       }
  //     }

  //     if (!(await this.nextPageButton.isVisible())) {
  //       break;
  //     }

  //     await this.nextPageButton.click();
  //     await this.page.waitForTimeout(1000);

  //     pageNumber++;
  //   }

  //   throw new Error(
  //     'No SIP found with withdrawable balance greater than 0.'
  //   );
  // }


  // async selectSipForWithdrawal(
  //   metal: 'Gold' | 'Silver'
  // ): Promise<SipDetails> {
  //   while (true) {
  //     const cardCount = await this.sipCards.count();

  //     for (let i = 0; i < cardCount; i++) {
  //       const card = this.sipCards.nth(i);

  //       const sipName =
  //         (
  //           await card
  //             .locator('p.text-16.font-bold')
  //             .first()
  //             .textContent()
  //         )?.trim() ?? '';

  //       // Ignore Vault
  //       if (sipName.toLowerCase().includes('vault')) {
  //         console.log(`Skipping Vault: ${sipName}`);
  //         continue;
  //       }

  //       const quantityText =
  //         (await card.locator('p.text-xs').textContent()) ?? '';

  //       const amountText =
  //         (
  //           await card
  //             .locator('p.text-16.font-bold')
  //             .last()
  //             .textContent()
  //         )?.trim() ?? '';

  //       const quantity = Number(
  //         quantityText.match(/([\d.]+)\s*gm/i)?.[1] ?? 0
  //       );

  //       const amount = Number(
  //         amountText.replace(/[₹,\s]/g, '')
  //       );

  //       console.log({
  //         sipName,
  //         quantity,
  //         amount,
  //       });

  //       // Select only if both quantity and amount are greater than 0
  //       if (quantity > 0 && amount > 0) {
  //         await card.click();

  //         return {
  //           sipName,
  //           quantity,
  //           amount,
  //         };
  //       }
  //     }

  //     // No valid SIP found on current page, go to next page
  //     if (await this.nextPageButton.isVisible()) {
  //       console.log('No valid SIP found on current page. Moving to next page...');

  //       await this.nextPageButton.click();
  //       await this.page.waitForLoadState('networkidle');
  //       await this.page.waitForTimeout(1000);
  //       continue;
  //     }

  //     // No next page available
  //     break;
  //   }

  //   throw new Error(
  //     `No ${metal} SIP found with quantity > 0 and amount > 0.`
  //   );
  // }

  async selectSipForWithdrawal(
    metal: 'Gold' | 'Silver',
    withdrawalQuantityInput: number
  ): Promise<SipDetails> {
    while (true) {
      const cardCount = await this.sipCards.count();

      for (let i = 0; i < cardCount; i++) {
        const card = this.sipCards.nth(i);

        const sipName =
          (
            await card
              .locator('p.text-16.font-bold')
              .first()
              .textContent()
          )?.trim() ?? '';

        // Ignore Vault
        if (sipName.toLowerCase().includes('vault')) {
          console.log(`Skipping Vault: ${sipName}`);
          continue;
        }

        const quantityText =
          (await card.locator('p.text-xs').textContent()) ?? '';

        const amountText =
          (
            await card
              .locator('p.text-16.font-bold')
              .last()
              .textContent()
          )?.trim() ?? '';

        const quantity = Number(
          quantityText.match(/([\d.]+)\s*gm/i)?.[1] ?? 0
        );

        const amount = Number(
          amountText.replace(/[₹,\s]/g, '')
        );

        console.log({
          sipName,
          quantity,
          amount,
        });

        // Select only if quantity is >= requested withdrawal quantity
        // and amount is greater than 0
        if (quantity >= withdrawalQuantityInput && amount > 0) {
          await card.click();

          return {
            sipName,
            quantity,
            amount,
          };
        }
      }

      // No valid SIP found on current page, go to next page
      if (await this.nextPageButton.isVisible()) {
        console.log(
          'No valid SIP found on current page. Moving to next page...'
        );

        await this.nextPageButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
        continue;
      }

      break;
    }

    throw new Error(
      `No ${metal} SIP found with quantity >= ${withdrawalQuantityInput} gm and amount > 0.`
    );
  }
}