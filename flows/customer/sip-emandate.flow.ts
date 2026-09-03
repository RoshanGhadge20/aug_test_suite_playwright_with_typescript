import type { Page } from '@playwright/test';
import { BuyMetalPage } from '../../pages/customer/buy-metal.page';
import { BuySummaryPage } from '../../pages/customer/buy-summary.page';
import { AddNewBankPage } from '../../pages/customer/add-new-bank.page';
import { PaymentPage } from '../../pages/customer/payment.page';

export interface CreateSipParams {
  metal: 'gold' | 'silver';
  frequency: 'weekly' | 'monthly';
  amount: string;
  investmentDay?: string;
  startAfterDays: number;
  planPrefix?: string;
}

/**
 * Creates a SIP plan, retrying once if the create click bounces to /my-profile (confirmed live:
 * can still happen even right after a completed profile — a stale-read race just after
 * `completeProfileEmailAndGender`'s save commits). Distinct from buy-metal.page.ts's own
 * built-in retry, which only recovers from a /kyc redirect, not /my-profile.
 */
export async function createSipRetryingProfileBounce(
  page: Page,
  buyMetalPage: BuyMetalPage,
  params: CreateSipParams,
): Promise<{ planName: string; startDate: string }> {
  try {
    return await buyMetalPage.createSip(params);
  } catch (error) {
    if (!/\/my-profile/i.test(page.url())) {
      throw error;
    }
    return await buyMetalPage.createSip(params);
  }
}

export interface FreshAccountBankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
}

/**
 * Pays for a just-created SIP by adding a brand-new bank + completing Emandate — same reference
 * pattern as TC_001 in tests/customer/sipflow/sip-flows.spec.ts. Deliberately bypasses
 * paymentPage.completeEmandateWithBankSetup()/selectBankOrAddNew(), which mis-detects the
 * "no bank account" info banner in the Choose Bank Account dialog as an existing bank card
 * (confirmed live) and hangs waiting for a radio button that's never there. Every goalwisesip
 * account is freshly registered and never has a saved bank, so this path is always correct here.
 */
export async function paySipWithNewBankEmandate(
  buySummaryPage: BuySummaryPage,
  addNewBankPage: AddNewBankPage,
  paymentPage: PaymentPage,
  options: {
    contactNumber: string;
    emandateBankName: string;
    bankDetails: FreshAccountBankDetails;
    /** Silver SIPs default to a different payment tab (confirmed live) — same flag/meaning as
     * completeEmandateWithBankSetup's useEmandateTab; click the Emandate tab first when true. */
    useEmandateTab?: boolean;
  },
): Promise<void> {
  await buySummaryPage.clickProceedToPay();
  if (options.useEmandateTab) {
    await paymentPage.clickEmandate();
  }
  await addNewBankPage.addBankDetails(options.bankDetails);
  await paymentPage.completeEmandatePayment(options.contactNumber, options.emandateBankName);
}
