import { test, expect } from '../../../fixtures/base.fixture';
import { SendShagunPage, type ShagunDetails } from '../../../pages/customer/send-shagun.page';
import { panelCreds } from '../../../config/urls';
import { getTargetEnv } from '../../../config/environments';
import { logActualExpected, logGet } from '../../../utils/test/test-case-logger';

/**
 * Send Shagun — Review screen. Stops before the Review "Continue" (which creates the order and
 * opens Razorpay), so nothing is created.
 */
const randomMobile = () => `9${String(Date.now()).slice(-9)}`;

/** Logs actual vs expected, then asserts strict equality. */
function check(TC: string, label: string, actual: unknown, expected: unknown): void {
  logActualExpected(TC, label, actual, expected);
  expect(actual, label).toBe(expected);
}

test.describe('TC_SendShagun_Review @regression @customer @shagun', () => {
  test.describe.configure({ timeout: 180_000 });

  test('TC_SHAGUN_030 | Summary reflects preset amount + Raksha Bandhan inputs', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_030';
    const details: ShagunDetails = {
      receiverName: 'Brother',
      amount: 501,
      message: 'Happy Raksha Bandhan! Review check.',
      senderName: 'Sister',
      receiverMobile: randomMobile(),
    };
    logGet(TC, 'Input data', details);
    await sendShagunPage.fillWizardToReview(details);

    const summary = await sendShagunPage.getSummary();
    logGet(TC, 'Review summary', summary);
    check(TC, 'Summary Receiver', summary['Receiver'], `${details.receiverName} · ${details.receiverMobile}`);
    check(TC, 'Summary Occasion', summary['Occasion'], 'Raksha Bandhan');
    check(TC, 'Summary Message', summary['Message'], details.message);
    check(TC, 'Summary Base amount', summary['Base amount'], '₹501');
    check(TC, 'Summary Processing fee', summary['Processing fee'], 'FREE');
    check(TC, 'Summary Net amount payable', summary['Net amount payable'], '₹501');
  });

  test('TC_SHAGUN_031 | Summary reflects custom occasion + custom amount', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_031';
    const details: ShagunDetails = {
      customOccasion: 'Birthday Auto',
      themeIndex: 3,
      receiverName: 'Cousin',
      amount: 1500,
      message: 'Many happy returns',
      senderName: 'Myself',
      receiverMobile: randomMobile(),
    };
    logGet(TC, 'Input data', details);
    await sendShagunPage.fillWizardToReview(details);

    const summary = await sendShagunPage.getSummary();
    logGet(TC, 'Review summary', summary);
    check(TC, 'Summary Occasion', summary['Occasion'], details.customOccasion);
    // Custom amounts render as "₹1500" (no separator) — compare numerically.
    const rupees = (v: string) => Number(v.replace(/[₹,\s]/g, ''));
    check(TC, 'Summary Base amount (₹)', rupees(summary['Base amount']), details.amount);
    check(TC, 'Summary Net amount payable (₹)', rupees(summary['Net amount payable']), details.amount);
  });

  test('TC_SHAGUN_032 | Continue is disabled until Terms & Conditions are accepted', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_032';
    await sendShagunPage.fillWizardToReview({
      receiverName: 'Brother',
      amount: 101,
      senderName: 'Sister',
      receiverMobile: randomMobile(),
    });

    await expect(sendShagunPage.acceptTermsCheckbox()).not.toBeChecked();
    await expect(sendShagunPage.reviewContinueButton()).toBeDisabled();
    logActualExpected(TC, 'T&C unticked → Continue enabled', await sendShagunPage.reviewContinueButton().isEnabled(), false);

    await sendShagunPage.acceptTerms();
    await expect(sendShagunPage.acceptTermsCheckbox()).toBeChecked();
    await expect(sendShagunPage.reviewContinueButton()).toBeEnabled();
    logActualExpected(TC, 'T&C ticked → Continue enabled', await sendShagunPage.reviewContinueButton().isEnabled(), true);

    await sendShagunPage.acceptTerms();
    await expect(sendShagunPage.reviewContinueButton()).toBeDisabled();
    logActualExpected(TC, 'T&C unticked again → Continue enabled', await sendShagunPage.reviewContinueButton().isEnabled(), false);
  });

  test('TC_SHAGUN_033 | Terms & Conditions state the key business rules', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_033';
    await sendShagunPage.fillWizardToReview({
      receiverName: 'Brother',
      amount: 101,
      senderName: 'Sister',
      receiverMobile: randomMobile(),
    });

    // T&C items render a moment after the Review heading — wait for them before reading.
    await expect(sendShagunPage.termsList().first()).toBeVisible({ timeout: 30_000 });
    const termItems = await sendShagunPage.termsList().allInnerTexts();
    logActualExpected(TC, 'T&C item count', termItems.length, '>= 5');
    const terms = termItems.join('\n');
    for (const rule of [
      'The minimum gift amount is ₹101 and the maximum gift amount is ₹2,100 per Digital Shagun.',
      'The receiver must claim this Digital Shagun within 60 days from the date of purchase.',
      'A Digital Shagun can be claimed only once.',
      'cannot be cancelled, modified, or refunded',
      'aged 18 years and above',
    ]) {
      logActualExpected(TC, 'T&C contains', terms.includes(rule) ? rule : '(missing)', rule);
      expect(terms).toContain(rule);
    }
  });

  test('TC_SHAGUN_034 | Back from Review keeps entered data; reload on Review keeps the summary', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_034';
    const mobile = randomMobile();
    await sendShagunPage.fillWizardToReview({
      receiverName: 'Brother',
      amount: 101,
      message: 'Persist me',
      senderName: 'Sister',
      receiverMobile: mobile,
    });

    await page.goBack();
    await expect(page).toHaveURL(/\/send\/receiver-mobile$/);
    await expect(sendShagunPage.receiverMobileInput()).toHaveValue(mobile);
    logActualExpected(TC, 'After Back → mobile field', await sendShagunPage.receiverMobileInput().inputValue(), mobile);
    await sendShagunPage.clickPreviewShagun();
    await expect(page).toHaveURL(/\/send\/review$/);

    await page.reload();
    await expect(sendShagunPage.reviewHeading()).toBeVisible({ timeout: 60_000 });
    const summary = await sendShagunPage.getSummary();
    logGet(TC, 'Summary after reload', summary);
    check(TC, 'After reload → Receiver', summary['Receiver'], `Brother · ${mobile}`);
    check(TC, 'After reload → Message', summary['Message'], 'Persist me');
  });

  /**
   * Self-gifting is blocked at payment initiation, not on the mobile step: the own number passes
   * Preview and reaches Review, then Review → Continue gets POST /order-transfer 500
   * "You can not send Shagun to self." shown as an error toast, and the user stays on Review.
   */
  test('TC_SHAGUN_035 | Sending a Shagun to your own mobile number is blocked', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_035';
    const ownMobile = panelCreds('customer', getTargetEnv()).mobile;
    logGet(TC, 'Sender (logged-in) mobile used as receiver', ownMobile);
    await sendShagunPage.fillWizardToReview({
      receiverName: 'Myself',
      amount: 101,
      senderName: 'Sister',
      receiverMobile: ownMobile,
    });
    check(TC, 'Summary Receiver', (await sendShagunPage.getSummary())['Receiver'], `Myself · ${ownMobile}`);

    await sendShagunPage.acceptTerms();
    const orderResponse = page.waitForResponse(
      (r) => /\/order-transfer$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST',
    );
    await sendShagunPage.clickReviewContinue();

    const response = await orderResponse;
    const body = await response.json();
    logGet(TC, 'POST /order-transfer status', response.status());
    check(TC, 'POST /order-transfer rejected (non-2xx)', response.ok(), false);
    check(TC, 'POST /order-transfer message', body.message, SendShagunPage.ERRORS.selfGift);

    await expect(sendShagunPage.errorToast()).toContainText(SendShagunPage.ERRORS.selfGift);
    logActualExpected(TC, 'Error toast', (await sendShagunPage.errorToast().innerText()).split('\n').join(' ').trim(), SendShagunPage.ERRORS.selfGift);
    await expect(page).toHaveURL(/\/send\/review$/);
    logActualExpected(TC, 'Stays on', new URL(page.url()).pathname, '/digi-gold-transfer/send/review');
    await expect(sendShagunPage.successHeading()).toHaveCount(0);
  });
});
