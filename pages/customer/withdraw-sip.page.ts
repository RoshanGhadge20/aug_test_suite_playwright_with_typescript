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

  /**
   * Same card scan as `selectSipForWithdrawal`, but matches a specific SIP by name instead of
   * picking the first one with enough balance — for goal-linked withdrawals, where the card
   * renders as "SIP Plan: {goal name}" and it must be THIS goal's SIP, not just any SIP with
   * sufficient quantity (confirmed live 2026-09-17 via the goal card's own "Withdraw" button,
   * which lands on this same investment-list screen).
   */
  async selectSipForWithdrawalByName(
    goalName: string,
    withdrawalQuantityInput: number
  ): Promise<SipDetails> {
    const escaped = goalName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePattern = new RegExp(escaped, 'i');

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

        if (!namePattern.test(sipName)) {
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

        console.log({ sipName, quantity, amount });

        if (quantity <= 0 || amount <= 0) {
          throw new Error(
            `SIP "${sipName}" (matching goal "${goalName}") has no withdrawable balance — quantity=${quantity}gm, amount=₹${amount}.`,
          );
        }
        if (quantity < withdrawalQuantityInput) {
          throw new Error(
            `SIP "${sipName}" (matching goal "${goalName}") only has ${quantity}gm available, requested ${withdrawalQuantityInput}gm.`,
          );
        }

        await card.click();

        return { sipName, quantity, amount };
      }

      if (await this.nextPageButton.isVisible()) {
        console.log(
          `No SIP matching goal "${goalName}" found on current page. Moving to next page...`
        );

        await this.nextPageButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
        continue;
      }

      break;
    }

    throw new Error(
      `No SIP Plan card found matching goal name "${goalName}" in the withdrawal investment list.`
    );
  }
}