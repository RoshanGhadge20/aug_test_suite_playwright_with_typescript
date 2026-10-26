import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

/**
 * Send Shagun / Digital Shagun — gift Digital Gold to a mobile number.
 *
 * Wizard (one route per step, all confirmed live on UAT 2026-10-14):
 *   /digi-gold-transfer/send/occasion         "What is the special day?"   Raksha Bandhan (default) | Custom (#customText)
 *   /digi-gold-transfer/send/theme            "Which one sounds like them?" 5 emoji cards (first selected by default)
 *   /digi-gold-transfer/send/relationship-name "Who are you gifting?"       #receiverName (min 3 chars) → "Choose amount"
 *   /digi-gold-transfer/send/amount           ₹101 (default) | ₹501 | ₹1,001 | Custom (#integeronly, p-inputNumber 101–2100) → "Add message"
 *   /digi-gold-transfer/send/message          optional textarea (maxlength 150) + suggestion chip
 *   /digi-gold-transfer/send/sender-name      "Who is Shagun from?"        #senderName (min 3 chars)
 *   /digi-gold-transfer/send/receiver-mobile  #receiverMobile (maxlength 10) → "Preview Shagun"
 *   /digi-gold-transfer/send/review           T&C + Summary; Continue disabled until #acceptTerms → Razorpay
 *   /digi-gold-transfer/send/success          "Shagun Sent Successfully!" → "View Shagun Details"
 *
 * Wizard state lives in the SPA: deep-linking to a mid-step in a fresh tab redirects back to
 * /occasion, but browser Back and a reload on /review both keep it.
 *
 * Post-send: /digi-gold-transfer/my-shagun (Gifted / Received tabs) and
 * /digi-gold-transfer/shagun/<ID> (detail). List rows show PENDING / SENT / RETURNED; the detail
 * page labels the same pending gift UNOPENED.
 *
 * Receiver side (logged in as the receiver mobile): Received tab cards are UNOPENED / CLAIMED /
 * EXPIRED; UNOPENED ones carry a "Claim Shagun" link to /order-transfer/claim?code=<ID>, whose
 * "Claim Shagun" button POSTs /order-transfer/claim → "Gold Claimed Successfully!". A second
 * claim gets 400 "Shagun has already been claimed." → "Shagun Already Claimed".
 */
export class SendShagunPage extends BasePage {
  static readonly MIN_AMOUNT = 101;
  static readonly MAX_AMOUNT = 2100;
  static readonly MESSAGE_MAX_LENGTH = 150;
  static readonly CLAIM_VALIDITY_DAYS = 60;
  /** Gift amount is GST-inclusive: grams = amount / (1 + GST) / lockedRate (fits every gift observed live). */
  static readonly GOLD_GST_RATE = 0.03;

  /**
   * Expected gold for a gift of `amount` ₹ at `lockedRate` ₹/g — TRUNCATED to 4 dp, not rounded
   * (live: ₹101 @ 15186.18 = 0.006457 g → server stores 0.0064).
   */
  static expectedGiftGrams(amount: number, lockedRate: number): number {
    const raw = amount / (1 + SendShagunPage.GOLD_GST_RATE) / lockedRate;
    return Math.floor(raw * 10_000 + 1e-9) / 10_000;
  }

  static readonly ERRORS = {
    customOccasion: 'Please enter custom occasion',
    name: 'Enter a name',
    nameMinLength: 'Enter at least 3 characters',
    amount: 'Enter an amount',
    // Live copy uses a typographic apostrophe (U+2019), not ASCII '.
    mobileRequired: 'Enter the receiver’s mobile number',
    mobileInvalid: 'Enter a valid 10-digit mobile number',
    shagunNotFound: 'Shagun not found.',
    selfGift: 'You can not send Shagun to self.',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  // ---- shared ----
  /** The teal primary CTA — its label changes per step (Continue / Choose amount / Add message / Preview Shagun). */
  private readonly primaryButton = (name: string | RegExp) => this.page.getByRole('button', { name, exact: typeof name === 'string' });
  private readonly stepHeading = () => this.page.locator('h2.text-24').last();
  readonly fieldError = () => this.page.locator('small.p-error');

  // ---- entry points ----
  private readonly productsNav = () => this.page.getByText('PRODUCTS', { exact: true }).first();
  private readonly productsSendShagun = () => this.page.getByText('Send Shagun', { exact: true }).first();
  private readonly profileMenuButton = () => this.page.locator('button.flex-shrink-0.inline-flex').first();
  private readonly profileDigitalShagun = () => this.page.locator('.p-menu-item-label', { hasText: 'Digital Shagun' });

  // ---- occasion ----
  readonly rakshaBandhanOption = () => this.page.getByRole('button', { name: 'Raksha Bandhan', exact: true });
  readonly customOccasionOption = () => this.page.getByRole('button', { name: 'Custom', exact: true });
  readonly customOccasionInput = () => this.page.locator('#customText');

  // ---- theme ----
  readonly themeCards = () => this.page.locator('button.shrink-0');

  // ---- who / from / contact ----
  readonly receiverNameInput = () => this.page.locator('#receiverName');
  readonly senderNameInput = () => this.page.locator('#senderName');
  readonly receiverMobileInput = () => this.page.locator('#receiverMobile');

  // ---- amount ----
  readonly presetAmount = (rupees: number) =>
    this.page.getByRole('button', { name: `₹${rupees.toLocaleString('en-IN')}`, exact: true });
  readonly customAmountOption = () => this.page.getByRole('button', { name: 'Custom', exact: true });
  readonly customAmountInput = () => this.page.locator('#integeronly');

  // ---- message ----
  readonly messageInput = () => this.page.locator('textarea[formcontrolname=message]');
  readonly messageSuggestionChip = (text = 'Happy Raksha Bandhan') => this.page.getByRole('button', { name: text, exact: true });
  readonly messageCounter = () => this.page.getByText(/^\d+\/150$/);

  // ---- review ----
  readonly reviewHeading = () => this.page.getByRole('heading', { name: 'Review Your Shagun' });
  // Live copy uses a typographic apostrophe ("I’ve") — match either.
  readonly acceptTermsLabel = () => this.page.locator('label', { hasText: /I['’]ve read and accepted the Terms & Conditions\./ });
  readonly acceptTermsCheckbox = () => this.page.locator('#acceptTerms');
  /** PrimeNG error toast, e.g. "You can not send Shagun to self." after Review → Continue. */
  readonly errorToast = () => this.page.locator('.p-toast-message-error');
  readonly reviewContinueButton = () => this.page.getByRole('button', { name: /^(Continue|Processing\.\.\.)$/ });
  private readonly summaryCard = () => this.page.locator('h2', { hasText: 'Summary' }).locator('xpath=following-sibling::div[1]');
  readonly termsList = () => this.page.locator('p.text-gray-600.text-14');

  // ---- success ----
  readonly successHeading = () => this.page.getByRole('heading', { name: 'Shagun Sent Successfully!' });
  readonly successMessage = () => this.page.getByText(/Your Shagun of ₹[\d,]+ has been sent to/);
  readonly viewShagunDetailsButton = () => this.page.getByRole('button', { name: 'View Shagun Details' });

  // ---- my shagun ----
  readonly giftedTab = () => this.page.getByRole('button', { name: /gifted shagun/i });
  readonly receivedTab = () => this.page.getByRole('button', { name: /received shagun/i });
  readonly shagunCards = () => this.page.locator('a[href*="/digi-gold-transfer/shagun/"]');

  // ---- receiver: claim (/order-transfer/claim?code=<ID>) ----
  readonly claimLinkFor = (shagunId: string) => this.page.locator(`a[href*="/order-transfer/claim?code=${shagunId}"]`);
  readonly claimButton = () => this.page.getByRole('button', { name: 'Claim Shagun', exact: true });
  readonly claimReceivedHeading = () => this.page.getByRole('heading', { name: /^You['’]ve Received a Shagun!$/ });
  readonly claimSuccessHeading = () => this.page.getByRole('heading', { name: 'Gold Claimed Successfully!' });
  readonly alreadyClaimedHeading = () => this.page.getByRole('heading', { name: 'Shagun Already Claimed' });
  readonly sayThanksButton = (senderName: string) => this.page.getByRole('button', { name: `Say Thanks to ${senderName}` });
  readonly backToDashboardLink = () => this.page.getByRole('link', { name: 'Back to dashboard' });

  // ---- detail ----
  readonly whatsappShareButton = () => this.page.getByRole('button', { name: 'Share on WhatsApp' });
  readonly transactionDetailsButton = () => this.page.getByRole('button', { name: 'Transaction Details' });
  readonly contactSupportButton = () => this.page.getByRole('button', { name: 'Contact Support' });
  readonly termsButton = () => this.page.getByRole('button', { name: 'Terms and Conditions' });
  readonly errorText = () => this.page.locator('p.text-failed', { hasText: 'Error' });

  // ===================== navigation =====================

  async openViaProductsMenu(): Promise<void> {
    await this.productsNav().click();
    await this.productsSendShagun().click();
    await this.waitForUrl(/\/digi-gold-transfer\/send\/occasion/);
    await this.waitForOccasionStep();
  }

  async openMyShagunViaProfileMenu(): Promise<void> {
    await this.profileMenuButton().click();
    await this.profileDigitalShagun().click();
    await this.waitForUrl(/\/digi-gold-transfer\/my-shagun/);
    await this.giftedTab().waitFor({ state: 'visible', timeout: 30_000 });
  }

  async openSendWizard(): Promise<void> {
    await this.goto('/digi-gold-transfer/send/occasion');
    await this.waitForOccasionStep();
  }

  /**
   * Occasion options come from GET /api/customer/app/order-transfer/config. When that call fails
   * (seen live: 401 while the header still shows the user as logged in) the step renders its
   * heading + Continue with NO options and no error. Reload once before giving up.
   */
  async waitForOccasionStep(): Promise<void> {
    const loaded = await this.rakshaBandhanOption()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true, () => false);
    if (loaded) return;
    console.log('[SendShagun] occasion options missing — reloading once');
    await this.page.reload();
    await this.rakshaBandhanOption().waitFor({ state: 'visible', timeout: 45_000 });
  }

  async openMyShagun(): Promise<void> {
    await this.goto('/digi-gold-transfer/my-shagun');
    await this.giftedTab().waitFor({ state: 'visible', timeout: 60_000 });
  }

  async openShagunDetail(shagunId: string): Promise<void> {
    await this.goto(`/digi-gold-transfer/shagun/${shagunId}`);
    await this.page.locator('p-breadcrumb, nav').getByText('Shagun Details').first().waitFor({ timeout: 60_000 });
  }

  // ===================== wizard steps =====================

  async currentStepHeading(): Promise<string> {
    return (await this.stepHeading().innerText()).trim();
  }

  async selectRakshaBandhan(): Promise<void> {
    await this.rakshaBandhanOption().click();
  }

  async selectCustomOccasion(text?: string): Promise<void> {
    await this.customOccasionOption().click();
    if (text !== undefined) await this.customOccasionInput().fill(text);
  }

  async continueFromOccasion(): Promise<void> {
    await this.primaryButton('Continue').click();
  }

  async selectTheme(index = 0): Promise<void> {
    await this.themeCards().nth(index).click();
  }

  /** Selected theme card's image wrapper carries `border-sheengold`. */
  async isThemeSelected(index: number): Promise<boolean> {
    const cls = (await this.themeCards().nth(index).locator('div').first().getAttribute('class')) ?? '';
    return cls.includes('border-sheengold');
  }

  /** Selected occasion/amount/tab buttons carry `bg-sheengold-cosmiclatte`. */
  async isOptionSelected(option: Locator): Promise<boolean> {
    return ((await option.getAttribute('class')) ?? '').includes('bg-sheengold-cosmiclatte');
  }

  async continueFromTheme(): Promise<void> {
    await this.primaryButton('Continue').click();
  }

  async enterReceiverName(name: string): Promise<void> {
    await this.receiverNameInput().fill(name);
  }

  async clickChooseAmount(): Promise<void> {
    await this.primaryButton('Choose amount').click();
  }

  async selectPresetAmount(rupees: number): Promise<void> {
    await this.presetAmount(rupees).click();
  }

  /**
   * Types into the PrimeNG p-inputNumber then blurs — the component clamps to [101, 2100]
   * and rounds decimals on blur, so read the value back afterwards.
   */
  async enterCustomAmount(value: string): Promise<string> {
    if (!(await this.customAmountInput().isVisible().catch(() => false))) {
      await this.customAmountOption().click();
    }
    await this.customAmountInput().fill('');
    if (value) await this.customAmountInput().pressSequentially(value);
    await this.stepHeading().click();
    return this.customAmountInput().inputValue();
  }

  async clickAddMessage(): Promise<void> {
    await this.primaryButton('Add message').click();
  }

  async enterMessage(message: string): Promise<void> {
    await this.messageInput().fill(message);
  }

  async continueFromMessage(): Promise<void> {
    await this.primaryButton('Continue').click();
  }

  async enterSenderName(name: string): Promise<void> {
    await this.senderNameInput().fill(name);
  }

  async continueFromSender(): Promise<void> {
    await this.primaryButton('Continue').click();
  }

  async enterReceiverMobile(mobile: string): Promise<void> {
    await this.receiverMobileInput().fill('');
    if (mobile) await this.receiverMobileInput().pressSequentially(mobile);
  }

  async clickPreviewShagun(): Promise<void> {
    await this.primaryButton('Preview Shagun').click();
  }

  async acceptTerms(): Promise<void> {
    await this.acceptTermsLabel().click();
  }

  async clickReviewContinue(): Promise<void> {
    await this.reviewContinueButton().click();
  }

  /** Summary rows as label → value, e.g. { Receiver: 'Brother · 9876543210', 'Net amount payable': '₹101' }. */
  async getSummary(): Promise<Record<string, string>> {
    const lines = (await this.summaryCard().innerText())
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < lines.length; i += 2) out[lines[i]] = lines[i + 1];
    return out;
  }

  /**
   * Drives occasion → … → review with the given details. `occasion` undefined keeps the
   * pre-selected Raksha Bandhan; `amount` is a preset (101/501/1001) or any custom value.
   */
  async fillWizardToReview(details: ShagunDetails): Promise<void> {
    await this.openSendWizard();
    if (details.customOccasion) await this.selectCustomOccasion(details.customOccasion);
    await this.continueFromOccasion();
    await this.waitForUrl(/\/send\/theme/);

    await this.selectTheme(details.themeIndex ?? 0);
    await this.continueFromTheme();
    await this.waitForUrl(/\/send\/relationship-name/);

    await this.enterReceiverName(details.receiverName);
    await this.clickChooseAmount();
    await this.waitForUrl(/\/send\/amount/);

    if ([101, 501, 1001].includes(details.amount)) await this.selectPresetAmount(details.amount);
    else await this.enterCustomAmount(String(details.amount));
    await this.clickAddMessage();
    await this.waitForUrl(/\/send\/message/);

    if (details.message) await this.enterMessage(details.message);
    await this.continueFromMessage();
    await this.waitForUrl(/\/send\/sender-name/);

    await this.enterSenderName(details.senderName);
    await this.continueFromSender();
    await this.waitForUrl(/\/send\/receiver-mobile/);

    await this.enterReceiverMobile(details.receiverMobile);
    await this.clickPreviewShagun();
    await this.waitForUrl(/\/send\/review/);
    await this.reviewHeading().waitFor({ state: 'visible' });
  }

  /**
   * Reloads the dashboard and returns the gold figures from GET /digital-gold/customer/passbook-details:
   * `total` = goldGrms (dashboard Total Gold), `sellable` = sellableGoldBalance (withdrawable).
   */
  async readGoldPassbook(): Promise<GoldPassbook> {
    // Settle any in-flight navigation first (e.g. login's own redirect to /dashboard): otherwise the
    // listener can catch THAT page's passbook response, whose body is discarded by our goto —
    // "No resource with given identifier found". Retry once more if it still races.
    await this.page.waitForLoadState('load').catch(() => {});
    for (let attempt = 1; ; attempt++) {
      const [res] = await Promise.all([
        this.page.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/digital-gold/customer/passbook-details'), {
          timeout: 60_000,
        }),
        this.page.goto('/dashboard'),
      ]);
      try {
        const data = (await res.json()).result.data;
        return { total: Number(data.goldGrms), sellable: Number(data.sellableGoldBalance) };
      } catch (err) {
        if (attempt >= 3) throw err;
        console.log(`[SendShagun] passbook response unreadable (attempt ${attempt}/3) — re-reading`);
      }
    }
  }

  // ===================== my shagun / detail =====================

  /** e.g. { href: '/digi-gold-transfer/shagun/1TSKRGZ2VD', id: '1TSKRGZ2VD', status: 'PENDING', receiver: 'AutoBro', occasion: 'RAKSHABANDHAN', amount: 101 } */
  async getShagunCard(index = 0): Promise<ShagunCard> {
    const link = this.shagunCards().nth(index);
    await link.waitFor({ state: 'visible', timeout: 30_000 });
    const href = (await link.getAttribute('href')) ?? '';
    const [status = '', to = '', occ = ''] = (await link.innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    // Nearest ancestor that shows the amount — on UNOPENED received cards (which also carry a
    // "Claim Shagun" link) the ₹ value is not inside the link's direct parent.
    const rowText = await link.locator('xpath=ancestor::*[contains(., "₹")][1]').innerText();
    const amountMatch = rowText.match(/₹\s*([\d,]+(?:\.\d+)?)/);
    return {
      href,
      id: href.split('/').pop() ?? '',
      status: status.toUpperCase(),
      receiver: to.replace(/^To\s+/i, ''),
      occasion: occ.replace(/^Shagun for\s+/i, ''),
      amount: amountMatch ? this.parseAmount(amountMatch[1]) : 0,
    };
  }

  /** Waits (up to `timeoutMs`) for the current tab's cards to render, then returns how many there are. */
  async waitForShagunCards(timeoutMs = 30_000): Promise<number> {
    await this.shagunCards().first().waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => {});
    return this.shagunCards().count();
  }

  /** Index of the card linking to this Shagun ID in the currently shown tab, or -1. */
  async findShagunCardIndex(shagunId: string): Promise<number> {
    const hrefs = await this.shagunCards().evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    return hrefs.findIndex((h) => h.endsWith(`/${shagunId}`));
  }

  /** Detail-page label → value pairs (Valid till, Receiver's Number, Message to <name>, Status, Shagun ID, Created on). */
  async getDetailFields(): Promise<Record<string, string>> {
    const labels = ['Valid till', "Receiver's Number", "Sender's Number", 'Message to', 'Status', 'Shagun ID', 'Created on'];
    const out: Record<string, string> = {};
    for (const label of labels) {
      // Live copy may use a typographic apostrophe ("Receiver’s") — match either, report under the ASCII key.
      const labelText = new RegExp(label.replace("'", "['’]"));
      const box = this.page.locator('div.rounded-xl, div.rounded-2xl, div.border').filter({ hasText: labelText }).last();
      if (!(await box.isVisible().catch(() => false))) continue;
      const parts = (await box.innerText()).split('\n').map((s) => s.trim().replace(/’/g, "'")).filter(Boolean);
      const labelIdx = parts.findIndex((p) => p.startsWith(label));
      if (labelIdx >= 0 && parts[labelIdx + 1]) out[label] = parts[labelIdx + 1];
    }
    return out;
  }
}

export interface ShagunDetails {
  customOccasion?: string;
  themeIndex?: number;
  receiverName: string;
  amount: number;
  message?: string;
  senderName: string;
  receiverMobile: string;
}

export interface GoldPassbook {
  total: number;
  sellable: number;
}

export interface ShagunCard {
  href: string;
  id: string;
  status: string;
  receiver: string;
  occasion: string;
  amount: number;
}
