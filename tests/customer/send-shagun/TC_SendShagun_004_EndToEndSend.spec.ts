import { test, expect } from '../../../fixtures/base.fixture';
import { SendShagunPage, type GoldPassbook, type ShagunDetails } from '../../../pages/customer/send-shagun.page';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import { panelCreds } from '../../../config/urls';
import { getTargetEnv } from '../../../config/environments';
import { logActualExpected, logGet } from '../../../utils/test/test-case-logger';

/**
 * Send Shagun — full paid journey on UAT (Razorpay TEST key, HDFC demo-bank Success).
 * CREATES DATA: every run sends one real ₹101 Shagun from the shared customer account to a
 * random, almost certainly unregistered, mobile. It stays PENDING and auto-returns to the sender
 * after 60 days.
 *
 * Flow confirmed live 2026-10-14: Review Continue → POST /api/customer/app/order-transfer →
 * Razorpay → POST /order-transfer/confirm-payment → /digi-gold-transfer/send/success.
 */
const TC = 'TC_SHAGUN_040';
const dataset = getBuyMetalDataset();

const formatLongDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
/** Grams as fixed 4-dp strings so the log's pass/fail colouring compares exactly. */
const g = (n: number) => n.toFixed(4);

/** Logs actual vs expected, then asserts strict equality. */
function check(label: string, actual: unknown, expected: unknown): void {
  logActualExpected(TC, label, actual, expected);
  expect(actual, label).toBe(expected);
}

test.describe('TC_SendShagun_EndToEnd @regression @customer @shagun @payments', () => {
  test('TC_SHAGUN_040 | Send ₹101 Shagun via netbanking → success → appears as PENDING with correct details', async ({
    page,
    context,
    sendShagunPage,
    paymentPage,
  }) => {
    test.setTimeout(300_000);

    // Name fields drop digits/special chars on keypress, so make the unique suffix letters-only.
    const suffix = String(Date.now()).slice(-5);
    const letters = suffix.replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);
    const details: ShagunDetails = {
      receiverName: `AutoBro ${letters}`,
      amount: 101,
      message: `Happy Raksha Bandhan! Automation ${suffix}`,
      senderName: 'Sister',
      receiverMobile: `9${String(Date.now()).slice(-9)}`,
    };
    let shagunId = '';
    let senderBefore: GoldPassbook = { total: 0, sellable: 0 };

    logGet(TC, 'Sender mobile', panelCreds('customer', getTargetEnv()).mobile);
    logGet(TC, 'Input data', details);

    await test.step('Sender: note own gold balances before sending', async () => {
      senderBefore = await sendShagunPage.readGoldPassbook();
      logGet(TC, 'Sender gold BEFORE send (g)', { total: g(senderBefore.total), withdrawable: g(senderBefore.sellable) });
    });

    await test.step('Fill the wizard to Review', async () => {
      await sendShagunPage.fillWizardToReview(details);
      const summary = await sendShagunPage.getSummary();
      logGet(TC, 'Review summary', summary);
      check('Net amount payable', summary['Net amount payable'], '₹101');
    });

    await test.step('Accept T&C and pay via Razorpay netbanking', async () => {
      await sendShagunPage.acceptTerms();
      await sendShagunPage.clickReviewContinue();
      const paid = await paymentPage.completeShagunNetbankingPayment(
        dataset.contactNumber,
        details.amount,
        dataset.netbankingBankName,
      );
      check('Razorpay amount paid (₹)', paid, details.amount);
    });

    await test.step('Success screen confirms amount and receiver', async () => {
      await expect(page).toHaveURL(/\/digi-gold-transfer\/send\/success$/);
      logActualExpected(TC, 'Success URL', new URL(page.url()).pathname, '/digi-gold-transfer/send/success');
      await expect(sendShagunPage.successHeading()).toBeVisible();
      const expectedMsg = `Your Shagun of ₹${details.amount} has been sent to ${details.receiverName}`;
      await expect(sendShagunPage.successMessage()).toHaveText(expectedMsg);
      logActualExpected(TC, 'Success message', (await sendShagunPage.successMessage().innerText()).trim(), expectedMsg);
    });

    await test.step('View Shagun Details shows the new gift', async () => {
      await sendShagunPage.viewShagunDetailsButton().click();
      await expect(page).toHaveURL(/\/digi-gold-transfer\/shagun\/[A-Z0-9]+$/);
      shagunId = page.url().split('/').pop()!;
      logGet(TC, 'Shagun ID created', shagunId);

      await expect(page.getByText('Shagun ID')).toBeVisible({ timeout: 30_000 });
      const fields = await sendShagunPage.getDetailFields();
      logGet(TC, 'Detail page fields', fields);
      check('Detail Shagun ID', fields['Shagun ID'], shagunId);
      check("Detail Receiver's Number", fields["Receiver's Number"], `+91 ${details.receiverMobile}`);
      check('Detail Message', fields['Message to'], details.message);
      check('Detail Status', fields['Status'], 'UNOPENED');

      // Valid till = Created on + 60 days (T&C: "claim within 60 days").
      const created = new Date(fields['Created on']);
      const validTill = new Date(created);
      validTill.setDate(validTill.getDate() + SendShagunPage.CLAIM_VALIDITY_DAYS);
      check(`Detail Valid till (Created on ${fields['Created on']} + 60 days)`, fields['Valid till'], formatLongDate(validTill));
    });

    await test.step('WhatsApp share is offered for a pending gift with the claim text', async () => {
      await expect(sendShagunPage.whatsappShareButton()).toBeVisible();
      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 15_000 }),
        sendShagunPage.whatsappShareButton().click(),
      ]);
      const shareText = new URL(popup.url()).searchParams.get('text') ?? '';
      await popup.close();
      logGet(TC, 'WhatsApp share text', shareText);
      const greeting = `Hi ${details.receiverName}, I've sent you a Digital Shagun on Augmont!`;
      logActualExpected(TC, 'Share text greeting', shareText.includes(greeting) ? greeting : '(missing)', greeting);
      expect(shareText).toContain(greeting);
      const link = shareText.match(/https:\/\/\S+agmt\.app\/dl\/shagunClaimLink/)?.[0] ?? '(missing)';
      logActualExpected(TC, 'Share text claim link', link, /https:\/\/\S+agmt\.app\/dl\/shagunClaimLink/);
      expect(shareText).toMatch(/https:\/\/\S+agmt\.app\/dl\/shagunClaimLink/);
      expect(shareText).toContain('Please claim it before');
    });

    await test.step('Sender: own gold balance is unchanged by the paid send', async () => {
      const senderAfter = await sendShagunPage.readGoldPassbook();
      logGet(TC, 'Sender gold AFTER send (g)', { total: g(senderAfter.total), withdrawable: g(senderAfter.sellable) });
      logActualExpected(TC, 'Sender Total Gold after send (unchanged)', g(senderAfter.total), g(senderBefore.total));
      logActualExpected(TC, 'Sender withdrawable after send (unchanged)', g(senderAfter.sellable), g(senderBefore.sellable));
      expect(senderAfter.total, 'sender Total Gold must not change on send').toBeCloseTo(senderBefore.total, 4);
      expect(senderAfter.sellable, 'sender withdrawable gold must not change on send').toBeCloseTo(senderBefore.sellable, 4);
    });

    await test.step('My Shagun → Gifted lists it first as PENDING ₹101', async () => {
      await sendShagunPage.openMyShagun();
      const card = await sendShagunPage.getShagunCard(0);
      logGet(TC, 'Top gifted card', card);
      check('Gifted card ID', card.id, shagunId);
      check('Gifted card status', card.status, 'PENDING');
      check('Gifted card receiver', card.receiver, details.receiverName);
      check('Gifted card occasion', card.occasion, 'RAKSHABANDHAN');
      check('Gifted card amount (₹)', card.amount, details.amount);
    });
  });
});
