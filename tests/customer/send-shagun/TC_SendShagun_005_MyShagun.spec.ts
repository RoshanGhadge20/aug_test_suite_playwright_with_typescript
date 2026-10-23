import { test, expect } from '../../../fixtures/base.fixture';
import { logActualExpected, logGet } from '../../../utils/test/test-case-logger';

/**
 * My Shagun dashboard + detail page — read-only checks against whatever gifts already exist on
 * the shared customer account. TC_SHAGUN_040 guarantees at least one gifted Shagun exists after
 * its first run.
 */
const KNOWN_LIST_STATUSES = ['PENDING', 'SENT', 'RETURNED'];

test.describe('TC_SendShagun_MyShagun @regression @customer @shagun', () => {
  test('TC_SHAGUN_050 | Gifted tab is default and every card has status, receiver, occasion and amount', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_050';
    await sendShagunPage.openMyShagun();
    const giftedDefault = await sendShagunPage.isOptionSelected(sendShagunPage.giftedTab());
    logActualExpected(TC, 'Gifted tab selected by default', giftedDefault, true);
    expect(giftedDefault).toBe(true);

    const count = await sendShagunPage.waitForShagunCards();
    logGet(TC, 'Gifted card count', count);
    test.skip(count === 0, 'No gifted Shagun on this account — run TC_SHAGUN_040 first');

    for (let i = 0; i < Math.min(count, 10); i++) {
      const card = await sendShagunPage.getShagunCard(i);
      logGet(TC, `Card ${i + 1}`, card);
      logActualExpected(TC, `Card ${i + 1} status in [${KNOWN_LIST_STATUSES.join(', ')}]`, KNOWN_LIST_STATUSES.includes(card.status), true);
      logActualExpected(TC, `Card ${i + 1} amount within ₹101–₹2,100`, card.amount >= 101 && card.amount <= 2100, true);
      expect(card.id, `card ${i} id`).toMatch(/^[A-Z0-9]{10}$/);
      expect(KNOWN_LIST_STATUSES, `card ${i} status`).toContain(card.status);
      expect(card.receiver, `card ${i} receiver`).not.toBe('');
      expect(card.amount, `card ${i} amount`).toBeGreaterThanOrEqual(101);
      expect(card.amount, `card ${i} amount`).toBeLessThanOrEqual(2100);
    }
  });

  test('TC_SHAGUN_051 | Received tab can be selected', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_051';
    await sendShagunPage.openMyShagun();
    await sendShagunPage.receivedTab().click();
    await expect.poll(() => sendShagunPage.isOptionSelected(sendShagunPage.receivedTab())).toBe(true);
    logActualExpected(TC, 'Received tab selected', await sendShagunPage.isOptionSelected(sendShagunPage.receivedTab()), true);
    const giftedStill = await sendShagunPage.isOptionSelected(sendShagunPage.giftedTab());
    logActualExpected(TC, 'Gifted tab still selected', giftedStill, false);
    expect(giftedStill).toBe(false);
  });

  test('TC_SHAGUN_052 | Opening a gifted card shows the detail page for that Shagun ID', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_052';
    await sendShagunPage.openMyShagun();
    test.skip((await sendShagunPage.waitForShagunCards()) === 0, 'No gifted Shagun on this account');

    const card = await sendShagunPage.getShagunCard(0);
    logGet(TC, 'Opening card', card);
    await sendShagunPage.shagunCards().first().click();
    await expect(page).toHaveURL(new RegExp(`/digi-gold-transfer/shagun/${card.id}$`));
    logActualExpected(TC, 'Detail URL', new URL(page.url()).pathname, `/digi-gold-transfer/shagun/${card.id}`);
    await expect(page.getByText('Shagun ID')).toBeVisible({ timeout: 30_000 });

    const fields = await sendShagunPage.getDetailFields();
    logGet(TC, 'Detail page fields', fields);
    logActualExpected(TC, 'Detail Shagun ID', fields['Shagun ID'], card.id);
    expect(fields['Shagun ID']).toBe(card.id);
    logActualExpected(TC, "Detail Receiver's Number format", fields["Receiver's Number"], /^\+91 [6-9]\d{9}$/);
    expect(fields["Receiver's Number"]).toMatch(/^\+91 [6-9]\d{9}$/);
    for (const btn of [sendShagunPage.transactionDetailsButton(), sendShagunPage.contactSupportButton(), sendShagunPage.termsButton()]) {
      await expect(btn).toBeVisible();
    }
    logActualExpected(TC, 'Action buttons visible', 'Transaction Details, Contact Support, Terms and Conditions', 'Transaction Details, Contact Support, Terms and Conditions');
    // WhatsApp share is only offered while the gift is still unclaimed.
    const shareCount = await sendShagunPage.whatsappShareButton().count();
    logActualExpected(TC, `WhatsApp share shown (status ${card.status})`, shareCount > 0, card.status === 'PENDING');
    if (card.status === 'PENDING') await expect(sendShagunPage.whatsappShareButton()).toBeVisible();
    else await expect(sendShagunPage.whatsappShareButton()).toHaveCount(0);
  });

  test('TC_SHAGUN_053 | Terms and Conditions opens a dialog on the detail page', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_053';
    await sendShagunPage.openMyShagun();
    test.skip((await sendShagunPage.waitForShagunCards()) === 0, 'No gifted Shagun on this account');
    await sendShagunPage.shagunCards().first().click();
    await sendShagunPage.termsButton().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    logActualExpected(TC, 'T&C dialog visible', await page.getByRole('dialog').isVisible(), true);
  });

  test('TC_SHAGUN_054 | Transaction Details navigates to My Orders', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_054';
    await sendShagunPage.openMyShagun();
    test.skip((await sendShagunPage.waitForShagunCards()) === 0, 'No gifted Shagun on this account');
    await sendShagunPage.shagunCards().first().click();
    await sendShagunPage.transactionDetailsButton().click();
    await expect(page).toHaveURL(/\/my-orders/, { timeout: 30_000 });
    logActualExpected(TC, 'URL after Transaction Details', new URL(page.url()).pathname, '/my-orders');
  });

  test('TC_SHAGUN_055 | Unknown Shagun ID shows "Shagun not found."', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_055';
    await page.goto('/digi-gold-transfer/shagun/XXXXXXXXXX');
    await expect(sendShagunPage.errorText()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Shagun not found.')).toBeVisible();
    logActualExpected(TC, 'Error message for ID XXXXXXXXXX', (await page.getByText('Shagun not found.').innerText()).trim(), 'Shagun not found.');
  });
});
