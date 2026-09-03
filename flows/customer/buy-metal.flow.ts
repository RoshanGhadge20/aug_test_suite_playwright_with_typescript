import type { Page } from '@playwright/test';
import { BuyMetalPage } from '../../pages/customer/buy-metal.page';
import { BuySummaryPage } from '../../pages/customer/buy-summary.page';
import { PaymentPage } from '../../pages/customer/payment.page';
import { getBuyMetalDataset, type BuyMetalType } from '../../utils/data/customer-excel-data';

export interface OneTimePurchaseResult {
  quantity: number;
  paidAmount: number;
}

/**
 * Places a one-time (spot) purchase for the given metal and pays via netbanking. Assumes the
 * customer is already logged in and KYC-verified, landed anywhere the buy-metal navigation
 * can reach (see BuyMetalPage.placeOneTimeOrder).
 */
export async function buyMetalOneTime(page: Page, metal: BuyMetalType): Promise<OneTimePurchaseResult> {
  const dataset = getBuyMetalDataset();
  const buyMetalPage = new BuyMetalPage(page);
  const buySummaryPage = new BuySummaryPage(page);
  const paymentPage = new PaymentPage(page);

  const amount = metal === 'gold' ? dataset.oneTimeGoldAmount : dataset.oneTimeSilverAmount;

  await buyMetalPage.placeOneTimeOrder(metal, amount);
  const summary = await buySummaryPage.validateOneTimeSummaryAndPayNow(amount);

  const paidAmount = await paymentPage.completeNetbankingBuyNowPayment(
    dataset.contactNumber,
    Number(amount),
    dataset.netbankingBankName,
  );

  return { quantity: summary.quantity, paidAmount };
}
