import type { Response } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { SendShagunPage, type GoldPassbook, type ShagunDetails } from '../../../pages/customer/send-shagun.page';
import { CustomerLoginPage } from '../../../pages/customer/login.page';
import { panelCreds } from '../../../config/urls';
import { getTargetEnv } from '../../../config/environments';
import { getBuyMetalDataset } from '../../../utils/data/customer-excel-data';
import { resolveAltCustomerMobile, resolveAltCustomerOtp } from '../helpers/customer-alt-user.helpers';
import { logActualExpected, logGet } from '../../../utils/test/test-case-logger';

/**
 * Send Shagun → receiver logs in → claims it. Two real accounts, two browser contexts:
 *   sender   = default `customer` account (fixture `page`, storage state from auth-setup)
 *   receiver = alt customer (ALT_CUSTOMER_MOBILE, default 8141133333) — fresh login in its own
 *              context, so the sender's session is untouched (one-session-per-account rule).
 *
 * Balance rule (confirmed with the team 2026-10-14): the gifted gold is added to the receiver's
 * Total Gold as soon as the sender's payment succeeds — BEFORE any claim — but the receiver
 * cannot withdraw/sell it until they claim. The sender's own gold balance does NOT change: the
 * sender pays money, the gold goes to the receiver. Read from the dashboard's
 * GET /digital-gold/customer/passbook-details: `goldGrms` = Total Gold shown on the dashboard,
 * `sellableGoldBalance` = withdrawable.
 *
 * CREATES DATA: sends and claims one real ₹101 test-mode Shagun per run.
 */
const TC = 'TC_SHAGUN_060';
const dataset = getBuyMetalDataset();
const isClaimPost = (r: Response) =>
  r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/order-transfer/claim');

const grams = (n: number) => Number(n.toFixed(4));
/** Grams as fixed 4-dp strings so the log's pass/fail colouring compares exactly. */
const g = (n: number) => n.toFixed(4);
const passbookLog = (p: GoldPassbook) => ({ total: g(p.total), withdrawable: g(p.sellable) });

/** Logs actual vs expected, then asserts strict equality. */
function check(label: string, actual: unknown, expected: unknown): void {
  logActualExpected(TC, label, actual, expected);
  expect(actual, label).toBe(expected);
}

test.describe('TC_SendShagun_ReceiverClaim @regression @customer @shagun @payments', () => {
  test('TC_SHAGUN_060 | On send only the receiver gets gold (not withdrawable until claim); sender balance unchanged; claim + re-claim', async ({
    page,
    browser,
    baseURL,
    sendShagunPage,
    paymentPage,
  }) => {
    test.setTimeout(480_000);

    const senderMobile = panelCreds('customer', getTargetEnv()).mobile;
    const receiverMobile = resolveAltCustomerMobile();
    const suffix = String(Date.now()).slice(-5).replace(/\d/g, (d) => 'abcdefghij'[Number(d)]);
    const details: ShagunDetails = {
      receiverName: `Claim Bro ${suffix}`,
      amount: 101,
      message: `Claim test ${suffix}`,
      senderName: 'Sister',
      receiverMobile,
    };
    logGet(TC, 'Accounts', { sender: senderMobile, receiver: receiverMobile });
    logGet(TC, 'Input data', details);

    const receiverContext = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const receiverPage = await receiverContext.newPage();
    const receiver = new SendShagunPage(receiverPage);

    let shagunId = '';
    let giftGrams = 0;
    let beforeSend: GoldPassbook = { total: 0, sellable: 0 };
    let afterSend: GoldPassbook = { total: 0, sellable: 0 };
    let senderBefore: GoldPassbook = { total: 0, sellable: 0 };

    try {
      await test.step('Receiver: log in and note gold balances before the gift', async () => {
        await new CustomerLoginPage(receiverPage).login(receiverMobile, resolveAltCustomerOtp());
        beforeSend = await receiver.readGoldPassbook();
        logGet(TC, `Receiver ${receiverMobile} gold BEFORE send (g)`, passbookLog(beforeSend));
      });

      await test.step('Sender: note own gold balances before sending', async () => {
        senderBefore = await sendShagunPage.readGoldPassbook();
        logGet(TC, `Sender ${senderMobile} gold BEFORE send (g)`, passbookLog(senderBefore));
      });

      await test.step('Sender: send ₹101 Shagun to the receiver mobile', async () => {
        await sendShagunPage.fillWizardToReview(details);
        logGet(TC, 'Review summary', await sendShagunPage.getSummary());
        await sendShagunPage.acceptTerms();
        await sendShagunPage.clickReviewContinue();
        const paid = await paymentPage.completeShagunNetbankingPayment(dataset.contactNumber, details.amount, dataset.netbankingBankName);
        check('Razorpay amount paid (₹)', paid, details.amount);
        await expect(sendShagunPage.successHeading()).toBeVisible();
        logActualExpected(TC, 'Success message', (await sendShagunPage.successMessage().innerText()).trim(), `Your Shagun of ₹${details.amount} has been sent to ${details.receiverName}`);
        await sendShagunPage.viewShagunDetailsButton().click();
        await expect(page).toHaveURL(/\/digi-gold-transfer\/shagun\/[A-Z0-9]+$/);
        shagunId = page.url().split('/').pop()!;
        logGet(TC, 'Shagun ID created', shagunId);
      });

      await test.step('Sender: own gold balance is unchanged by sending (gold goes to the receiver)', async () => {
        const senderAfter = await sendShagunPage.readGoldPassbook();
        logGet(TC, `Sender ${senderMobile} gold AFTER send (g)`, passbookLog(senderAfter));
        logActualExpected(TC, 'Sender Total Gold after send (unchanged)', g(senderAfter.total), g(senderBefore.total));
        logActualExpected(TC, 'Sender withdrawable after send (unchanged)', g(senderAfter.sellable), g(senderBefore.sellable));
        expect(senderAfter.total, 'sender Total Gold must not change on send').toBeCloseTo(senderBefore.total, 4);
        expect(senderAfter.sellable, 'sender withdrawable gold must not change on send').toBeCloseTo(senderBefore.sellable, 4);
      });

      await test.step('Receiver: gift is UNOPENED in Received tab with a Claim link', async () => {
        await receiver.openMyShagun();
        await receiver.receivedTab().click();
        await expect.poll(() => receiver.findShagunCardIndex(shagunId), { timeout: 30_000 }).toBeGreaterThanOrEqual(0);

        const card = await receiver.getShagunCard(await receiver.findShagunCardIndex(shagunId));
        logGet(TC, 'Receiver card (before claim)', card);
        check('Received card status', card.status, 'UNOPENED');
        check('Received card from', card.receiver, `From ${details.senderName}`); // received cards read "From <sender>"
        check('Received card amount (₹)', card.amount, details.amount);
        await expect(receiver.claimLinkFor(shagunId)).toBeVisible();
        logActualExpected(TC, 'Claim Shagun link visible', await receiver.claimLinkFor(shagunId).isVisible(), true);

        const [detail] = await Promise.all([
          receiverPage.waitForResponse(
            (r) => r.request().method() === 'GET' && new URL(r.url()).pathname.endsWith(`/order-transfer/${shagunId}`),
          ),
          receiver.openShagunDetail(shagunId),
        ]);
        const record = (await detail.json()).data;
        logGet(TC, 'Gift record (server)', {
          transferId: record.transferId,
          status: record.status,
          amount: record.amount,
          receiverMobile: record.receiverMobile,
          lockedRate: record.lockedRate,
          lockedQuantityGrams: record.lockedQuantityGrams,
        });
        logGet(TC, 'Gift record status', record.status);
        check('Gift record not yet claimed', record.status !== 'CLAIMED', true);
        check('Gift record receiver mobile', record.receiverMobile, receiverMobile);
        check('Gift record amount (₹)', record.amount, details.amount);
        giftGrams = Number(record.lockedQuantityGrams);
        const expectedGrams = SendShagunPage.expectedGiftGrams(details.amount, Number(record.lockedRate));
        check(`Gift gold g (₹${details.amount} ÷ 1.03 GST ÷ ₹${record.lockedRate}/g, truncated)`, g(giftGrams), g(expectedGrams));
      });

      await test.step('Receiver: Total Gold already includes the gift before claim, but it is not withdrawable', async () => {
        await expect
          .poll(async () => grams((afterSend = await receiver.readGoldPassbook()).total), {
            timeout: 60_000,
            intervals: [3_000, 5_000, 10_000],
            message: 'receiver Total Gold should rise by the gift quantity right after the send',
          })
          .toBeCloseTo(grams(beforeSend.total + giftGrams), 4);
        logGet(TC, `Receiver ${receiverMobile} gold AFTER send, unclaimed (g)`, passbookLog(afterSend));
        logActualExpected(TC, `Receiver Total Gold after send (+${g(giftGrams)})`, g(afterSend.total), g(beforeSend.total + giftGrams));
        logActualExpected(TC, 'Receiver withdrawable after send (unchanged)', g(afterSend.sellable), g(beforeSend.sellable));
        expect(afterSend.sellable, 'unclaimed Shagun gold must not be withdrawable').toBeCloseTo(beforeSend.sellable, 4);
      });

      await test.step('Receiver: claim the Shagun', async () => {
        await receiver.openMyShagun();
        await receiver.receivedTab().click();
        await receiver.claimLinkFor(shagunId).click();
        await expect(receiverPage).toHaveURL(new RegExp(`/order-transfer/claim\\?code=${shagunId}$`));
        await expect(receiver.claimReceivedHeading()).toBeVisible({ timeout: 30_000 });

        const [claimResponse] = await Promise.all([
          receiverPage.waitForResponse(isClaimPost),
          receiver.claimButton().click(),
        ]);
        const body = (await claimResponse.json()).data;
        logGet(TC, 'Claim response', { isSuccess: body.isSuccess, quantity: body.quantity, metalType: body.metalType, senderName: body.senderName });
        check('POST /order-transfer/claim status', claimResponse.status(), 200);
        check('Claim isSuccess', body.isSuccess, true);
        check('Claim metal', body.metalType, 'gold');
        check('Claim sender name', body.senderName, details.senderName);
        logActualExpected(TC, 'Claimed quantity (g)', g(Number(body.quantity)), g(giftGrams));
        expect(Number(body.quantity)).toBeCloseTo(giftGrams, 4);

        await expect(receiver.claimSuccessHeading()).toBeVisible();
        logActualExpected(TC, 'Claim screen heading', (await receiver.claimSuccessHeading().innerText()).trim(), 'Gold Claimed Successfully!');
        await expect(receiverPage.getByText('Your gold gift has been added to your Augmont account')).toBeVisible();
        await expect(receiver.sayThanksButton(details.senderName)).toBeVisible();
        await expect(receiver.backToDashboardLink()).toBeVisible();
      });

      await test.step('Receiver: after claim the gift becomes withdrawable; Total Gold is not added twice', async () => {
        let afterClaim: GoldPassbook = afterSend;
        await expect
          .poll(async () => grams((afterClaim = await receiver.readGoldPassbook()).sellable), {
            timeout: 90_000,
            intervals: [3_000, 5_000, 10_000],
            message: 'withdrawable gold should rise by the gift quantity after claim',
          })
          .toBeCloseTo(grams(afterSend.sellable + giftGrams), 4);
        logGet(TC, `Receiver ${receiverMobile} gold AFTER claim (g)`, passbookLog(afterClaim));
        logActualExpected(TC, `Receiver withdrawable after claim (+${g(giftGrams)})`, g(afterClaim.sellable), g(afterSend.sellable + giftGrams));
        logActualExpected(TC, 'Receiver Total Gold after claim (unchanged)', g(afterClaim.total), g(afterSend.total));
        expect(afterClaim.total, 'claim must not credit Total Gold a second time').toBeCloseTo(afterSend.total, 4);
        test.info().annotations.push({
          type: 'receiver-gold',
          description: `before send ${JSON.stringify(passbookLog(beforeSend))} → after send ${JSON.stringify(passbookLog(afterSend))} → after claim ${JSON.stringify(passbookLog(afterClaim))} (gift ${g(giftGrams)} g)`,
        });
      });

      await test.step('Receiver: gift is now CLAIMED and the Claim link is gone', async () => {
        await receiver.openMyShagun();
        await receiver.receivedTab().click();
        await expect.poll(() => receiver.findShagunCardIndex(shagunId), { timeout: 30_000 }).toBeGreaterThanOrEqual(0);
        const card = await receiver.getShagunCard(await receiver.findShagunCardIndex(shagunId));
        logGet(TC, 'Receiver card (after claim)', card);
        check('Received card status after claim', card.status, 'CLAIMED');
        await expect(receiver.claimLinkFor(shagunId)).toHaveCount(0);
        logActualExpected(TC, 'Claim link count after claim', await receiver.claimLinkFor(shagunId).count(), 0);

        await receiver.openShagunDetail(shagunId);
        await expect(receiverPage.getByText('Shagun ID')).toBeVisible({ timeout: 30_000 });
        const fields = await receiver.getDetailFields();
        logGet(TC, 'Receiver detail page fields', fields);
        check('Receiver detail Status', fields['Status'], 'Claimed');
        check("Receiver detail Sender's Number", fields["Sender's Number"], `+91 ${senderMobile}`);
        check('Receiver detail Message', fields['Message to'], details.message);
      });

      await test.step('Receiver: claiming the same Shagun again is rejected', async () => {
        await receiverPage.goto(`/order-transfer/claim?code=${shagunId}`);
        await expect(receiver.claimButton()).toBeVisible({ timeout: 30_000 });
        const [again] = await Promise.all([receiverPage.waitForResponse(isClaimPost), receiver.claimButton().click()]);
        check('Re-claim status', again.status(), 400);
        check('Re-claim message', (await again.json()).message, 'Shagun has already been claimed.');
        await expect(receiver.errorToast()).toContainText('Shagun has already been claimed.');
        await expect(receiver.alreadyClaimedHeading()).toBeVisible();
        logActualExpected(TC, 'Re-claim heading', (await receiver.alreadyClaimedHeading().innerText()).trim(), 'Shagun Already Claimed');
      });

      await test.step('Sender: gifted card for this Shagun shows SENT after the claim', async () => {
        await sendShagunPage.openMyShagun();
        const idx = await sendShagunPage.findShagunCardIndex(shagunId);
        expect(idx).toBeGreaterThanOrEqual(0);
        const card = await sendShagunPage.getShagunCard(idx);
        logGet(TC, 'Sender card (after claim)', card);
        check('Sender gifted card status after claim', card.status, 'SENT');
      });
    } finally {
      await receiverContext.close();
    }
  });
});
