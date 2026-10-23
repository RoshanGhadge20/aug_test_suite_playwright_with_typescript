import { test, expect } from '../../../fixtures/base.fixture';
import type { Page } from '@playwright/test';
import { SendShagunPage } from '../../../pages/customer/send-shagun.page';
import { logActualExpected } from '../../../utils/test/test-case-logger';

/**
 * Send Shagun — per-step field validation. Every test stops before payment; nothing is created.
 * Expected messages/limits were captured live on UAT 2026-10-14 (see SendShagunPage.ERRORS).
 */
const ERR = SendShagunPage.ERRORS;

/** Asserts the inline field error, then logs actual vs expected. */
async function expectFieldError(TC: string, sendShagunPage: SendShagunPage, label: string, expected: string): Promise<void> {
  await expect(sendShagunPage.fieldError(), label).toHaveText(expected);
  logActualExpected(TC, `${label} → error`, (await sendShagunPage.fieldError().innerText()).trim(), expected);
}

/** Asserts the URL path ends with `/send/<step>`, then logs it. */
async function expectStep(TC: string, page: Page, step: string, label = 'Current step'): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`/send/${step}$`));
  logActualExpected(TC, label, new URL(page.url()).pathname, `/digi-gold-transfer/send/${step}`);
}

test.describe('TC_SendShagun_WizardValidations @regression @customer @shagun', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ sendShagunPage }) => {
    await sendShagunPage.openSendWizard();
  });

  test('TC_SHAGUN_010 | Occasion: Raksha Bandhan is pre-selected and Continue goes to Theme', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_010';
    const preselected = await sendShagunPage.isOptionSelected(sendShagunPage.rakshaBandhanOption());
    logActualExpected(TC, 'Raksha Bandhan pre-selected', preselected, true);
    expect(preselected).toBe(true);

    await sendShagunPage.continueFromOccasion();
    await expectStep(TC, page, 'theme', 'After Continue');
    const heading = await sendShagunPage.currentStepHeading();
    logActualExpected(TC, 'Theme step heading', heading, 'Which one sounds like them?');
    expect(heading).toBe('Which one sounds like them?');
  });

  test('TC_SHAGUN_011 | Occasion: Custom with empty text is blocked', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_011';
    await sendShagunPage.selectCustomOccasion();
    await expect(sendShagunPage.customOccasionInput()).toBeVisible();
    await sendShagunPage.continueFromOccasion();

    await expectFieldError(TC, sendShagunPage, 'Custom occasion ""', ERR.customOccasion);
    await expectStep(TC, page, 'occasion', 'Stays on');
  });

  test('TC_SHAGUN_012 | Occasion: Custom with text proceeds to Theme', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_012';
    await sendShagunPage.selectCustomOccasion('Birthday');
    logActualExpected(TC, 'Custom occasion value', await sendShagunPage.customOccasionInput().inputValue(), 'Birthday');
    await sendShagunPage.continueFromOccasion();
    await expectStep(TC, page, 'theme', 'After Continue');
  });

  test('TC_SHAGUN_013 | Theme: five cards, first selected by default, selection moves on click', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_013';
    await sendShagunPage.continueFromOccasion();
    await expect(sendShagunPage.themeCards()).toHaveCount(5);
    logActualExpected(TC, 'Theme card count', await sendShagunPage.themeCards().count(), 5);

    const firstSelected = await sendShagunPage.isThemeSelected(0);
    logActualExpected(TC, 'Theme 1 selected by default', firstSelected, true);
    expect(firstSelected).toBe(true);

    await sendShagunPage.selectTheme(2);
    const thirdSelected = await sendShagunPage.isThemeSelected(2);
    const firstStillSelected = await sendShagunPage.isThemeSelected(0);
    logActualExpected(TC, 'Theme 3 selected after click', thirdSelected, true);
    logActualExpected(TC, 'Theme 1 still selected', firstStillSelected, false);
    expect(thirdSelected).toBe(true);
    expect(firstStillSelected).toBe(false);

    await sendShagunPage.continueFromTheme();
    await expectStep(TC, page, 'relationship-name', 'After Continue');
  });

  test('TC_SHAGUN_014 | Receiver name: empty, whitespace-only and < 3 chars are rejected', async ({ page, sendShagunPage }) => {
    const TC = 'TC_SHAGUN_014';
    await sendShagunPage.continueFromOccasion();
    await sendShagunPage.continueFromTheme();
    await expectStep(TC, page, 'relationship-name');

    for (const value of ['', '   ']) {
      await sendShagunPage.enterReceiverName(value);
      await sendShagunPage.clickChooseAmount();
      await expectFieldError(TC, sendShagunPage, `Receiver name "${value}"`, ERR.name);
      await expect(page).toHaveURL(/\/send\/relationship-name$/);
    }
    for (const value of ['A', 'Me']) {
      await sendShagunPage.enterReceiverName(value);
      await sendShagunPage.clickChooseAmount();
      await expectFieldError(TC, sendShagunPage, `Receiver name "${value}"`, ERR.nameMinLength);
      await expect(page).toHaveURL(/\/send\/relationship-name$/);
    }

    await sendShagunPage.enterReceiverName('Bob');
    await sendShagunPage.clickChooseAmount();
    await expectStep(TC, page, 'amount', 'Receiver name "Bob" → next step');
  });

  test('TC_SHAGUN_024 | Typed digits / special characters are filtered from name and custom-occasion fields', async ({ sendShagunPage }) => {
    const TC = 'TC_SHAGUN_024';
    await sendShagunPage.customOccasionOption().click();
    await sendShagunPage.customOccasionInput().pressSequentially('Bday 2026!');
    await expect(sendShagunPage.customOccasionInput()).toHaveValue('Bday ');
    logActualExpected(TC, 'Custom occasion typed "Bday 2026!"', JSON.stringify(await sendShagunPage.customOccasionInput().inputValue()), JSON.stringify('Bday '));

    await sendShagunPage.customOccasionInput().fill('');
    await sendShagunPage.selectRakshaBandhan();
    await sendShagunPage.continueFromOccasion();
    await sendShagunPage.continueFromTheme();

    const cases: Array<[string, string]> = [
      ['AutoBro87080', 'AutoBro'],
      ['Bro@123!', 'Bro'],
      ['Ravi Kumar', 'Ravi Kumar'],
    ];
    for (const [typed, expected] of cases) {
      await sendShagunPage.receiverNameInput().fill('');
      await sendShagunPage.receiverNameInput().pressSequentially(typed);
      await expect(sendShagunPage.receiverNameInput(), `typed "${typed}"`).toHaveValue(expected);
      logActualExpected(TC, `Receiver name typed "${typed}"`, await sendShagunPage.receiverNameInput().inputValue(), expected);
    }
  });

  test.describe('amount step', () => {
    test.beforeEach(async ({ page, sendShagunPage }) => {
      await sendShagunPage.continueFromOccasion();
      await sendShagunPage.continueFromTheme();
      await sendShagunPage.enterReceiverName('Brother');
      await sendShagunPage.clickChooseAmount();
      await expect(page).toHaveURL(/\/send\/amount$/);
    });

    test('TC_SHAGUN_015 | Amount: presets ₹101/₹501/₹1,001 shown, ₹101 pre-selected', async ({ sendShagunPage }) => {
      const TC = 'TC_SHAGUN_015';
      for (const v of [101, 501, 1001]) {
        await expect(sendShagunPage.presetAmount(v)).toBeVisible();
        logActualExpected(TC, 'Preset visible', (await sendShagunPage.presetAmount(v).innerText()).trim(), `₹${v.toLocaleString('en-IN')}`);
      }
      await expect(sendShagunPage.customAmountOption()).toBeVisible();

      const default101 = await sendShagunPage.isOptionSelected(sendShagunPage.presetAmount(101));
      logActualExpected(TC, '₹101 pre-selected', default101, true);
      expect(default101).toBe(true);

      await sendShagunPage.selectPresetAmount(1001);
      const sel1001 = await sendShagunPage.isOptionSelected(sendShagunPage.presetAmount(1001));
      const sel101 = await sendShagunPage.isOptionSelected(sendShagunPage.presetAmount(101));
      logActualExpected(TC, '₹1,001 selected after click', sel1001, true);
      logActualExpected(TC, '₹101 still selected', sel101, false);
      expect(sel1001).toBe(true);
      expect(sel101).toBe(false);
    });

    test('TC_SHAGUN_016 | Amount: custom input exposes min 101 / max 2100', async ({ sendShagunPage }) => {
      const TC = 'TC_SHAGUN_016';
      await sendShagunPage.customAmountOption().click();
      const input = sendShagunPage.customAmountInput();
      await expect(input).toHaveAttribute('aria-valuemin', String(SendShagunPage.MIN_AMOUNT));
      await expect(input).toHaveAttribute('aria-valuemax', String(SendShagunPage.MAX_AMOUNT));
      logActualExpected(TC, 'Custom amount min', await input.getAttribute('aria-valuemin'), String(SendShagunPage.MIN_AMOUNT));
      logActualExpected(TC, 'Custom amount max', await input.getAttribute('aria-valuemax'), String(SendShagunPage.MAX_AMOUNT));
    });

    test('TC_SHAGUN_017 | Amount: out-of-range and decimal custom values clamp to the 101–2100 range', async ({ sendShagunPage }) => {
      const TC = 'TC_SHAGUN_017';
      const cases: Array<[string, string]> = [
        ['50', '101'],
        ['100', '101'],
        ['101', '101'],
        ['2100', '2100'],
        ['2101', '2100'],
        ['5000', '2100'],
        ['100.5', '101'],
      ];
      for (const [typed, expected] of cases) {
        const actual = (await sendShagunPage.enterCustomAmount(typed)).replace(/,/g, '');
        logActualExpected(TC, `Custom amount typed "${typed}" → after blur`, actual, expected);
        expect(actual, `custom amount "${typed}"`).toBe(expected);
      }
    });

    test('TC_SHAGUN_018 | Amount: empty or non-numeric custom value is rejected', async ({ page, sendShagunPage }) => {
      const TC = 'TC_SHAGUN_018';
      for (const value of ['', 'abc']) {
        await sendShagunPage.customAmountOption().click();
        await sendShagunPage.customAmountInput().fill('');
        if (value) await sendShagunPage.customAmountInput().pressSequentially(value);
        await expect(sendShagunPage.customAmountInput()).toHaveValue('');
        logActualExpected(TC, `Custom amount typed "${value}" → field value`, JSON.stringify(await sendShagunPage.customAmountInput().inputValue()), '""');
        await sendShagunPage.clickAddMessage();
        await expectFieldError(TC, sendShagunPage, `Custom amount "${value}"`, ERR.amount);
        await expect(page).toHaveURL(/\/send\/amount$/);
      }
    });
  });

  test.describe('message / sender / mobile steps', () => {
    test.beforeEach(async ({ page, sendShagunPage }) => {
      await sendShagunPage.continueFromOccasion();
      await sendShagunPage.continueFromTheme();
      await sendShagunPage.enterReceiverName('Brother');
      await sendShagunPage.clickChooseAmount();
      await sendShagunPage.clickAddMessage();
      await expect(page).toHaveURL(/\/send\/message$/);
    });

    test('TC_SHAGUN_019 | Message: optional — empty message proceeds to sender step', async ({ page, sendShagunPage }) => {
      const TC = 'TC_SHAGUN_019';
      await expect(sendShagunPage.messageInput()).toHaveValue('');
      logActualExpected(TC, 'Message value', JSON.stringify(await sendShagunPage.messageInput().inputValue()), '""');
      await sendShagunPage.continueFromMessage();
      await expectStep(TC, page, 'sender-name', 'Empty message → next step');
    });

    test('TC_SHAGUN_020 | Message: suggestion chip fills the textarea', async ({ sendShagunPage }) => {
      const TC = 'TC_SHAGUN_020';
      await sendShagunPage.messageSuggestionChip().click();
      await expect(sendShagunPage.messageInput()).toHaveValue('Happy Raksha Bandhan');
      logActualExpected(TC, 'Message after chip click', await sendShagunPage.messageInput().inputValue(), 'Happy Raksha Bandhan');
    });

    test('TC_SHAGUN_021 | Message: capped at 150 characters with a live counter', async ({ sendShagunPage }) => {
      const TC = 'TC_SHAGUN_021';
      await expect(sendShagunPage.messageInput()).toHaveAttribute('maxlength', String(SendShagunPage.MESSAGE_MAX_LENGTH));
      logActualExpected(TC, 'Message maxlength', await sendShagunPage.messageInput().getAttribute('maxlength'), '150');
      await sendShagunPage.messageInput().pressSequentially('x'.repeat(160));
      await expect(sendShagunPage.messageInput()).toHaveValue('x'.repeat(150));
      logActualExpected(TC, 'Typed 160 chars → stored length', (await sendShagunPage.messageInput().inputValue()).length, 150);
      await expect(sendShagunPage.messageCounter()).toHaveText('150/150');
      logActualExpected(TC, 'Counter', await sendShagunPage.messageCounter().innerText(), '150/150');
    });

    test('TC_SHAGUN_022 | Sender name: empty, whitespace-only and < 3 chars are rejected', async ({ page, sendShagunPage }) => {
      const TC = 'TC_SHAGUN_022';
      await sendShagunPage.continueFromMessage();
      await expectStep(TC, page, 'sender-name');
      const heading = await sendShagunPage.currentStepHeading();
      logActualExpected(TC, 'Step heading', heading, 'Who is Shagun from?');
      expect(heading).toBe('Who is Shagun from?');

      for (const value of ['', '   ']) {
        await sendShagunPage.enterSenderName(value);
        await sendShagunPage.continueFromSender();
        await expectFieldError(TC, sendShagunPage, `Sender name "${value}"`, ERR.name);
        await expect(page).toHaveURL(/\/send\/sender-name$/);
      }
      for (const value of ['A', 'Me']) {
        await sendShagunPage.enterSenderName(value);
        await sendShagunPage.continueFromSender();
        await expectFieldError(TC, sendShagunPage, `Sender name "${value}"`, ERR.nameMinLength);
        await expect(page).toHaveURL(/\/send\/sender-name$/);
      }

      await sendShagunPage.enterSenderName('Bob');
      await sendShagunPage.continueFromSender();
      await expectStep(TC, page, 'receiver-mobile', 'Sender name "Bob" → next step');
    });

    test('TC_SHAGUN_023 | Receiver mobile: required, 10 digits, Indian prefix, digits only', async ({ page, sendShagunPage }) => {
      const TC = 'TC_SHAGUN_023';
      await sendShagunPage.continueFromMessage();
      await sendShagunPage.enterSenderName('Sister');
      await sendShagunPage.continueFromSender();
      await expectStep(TC, page, 'receiver-mobile');
      await expect(sendShagunPage.receiverMobileInput()).toHaveAttribute('maxlength', '10');
      logActualExpected(TC, 'Mobile maxlength', await sendShagunPage.receiverMobileInput().getAttribute('maxlength'), '10');
      await expect(page.getByText('This shagun will be linked to this number')).toBeVisible();

      const cases: Array<[string, string]> = [
        ['', ERR.mobileRequired],
        ['abcdefghij', ERR.mobileRequired], // letters are stripped → empty
        ['98765', ERR.mobileInvalid],
        ['012345678', ERR.mobileInvalid],
        ['1234567890', ERR.mobileInvalid],
        ['5555555555', ERR.mobileInvalid],
      ];
      for (const [value, expectedError] of cases) {
        await sendShagunPage.enterReceiverMobile(value);
        await sendShagunPage.clickPreviewShagun();
        await expectFieldError(TC, sendShagunPage, `Mobile "${value}"`, expectedError);
        await expect(page).toHaveURL(/\/send\/receiver-mobile$/);
      }

      // 11th digit is dropped by maxlength; the first 10 are a valid number.
      await sendShagunPage.enterReceiverMobile('98765432101');
      await expect(sendShagunPage.receiverMobileInput()).toHaveValue('9876543210');
      logActualExpected(TC, 'Mobile typed "98765432101" → field value', await sendShagunPage.receiverMobileInput().inputValue(), '9876543210');
      await sendShagunPage.clickPreviewShagun();
      await expectStep(TC, page, 'review', 'Valid mobile → next step');
    });
  });
});
