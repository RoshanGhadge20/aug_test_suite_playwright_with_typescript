import { test, expect } from '../../../fixtures/base.fixture';

test.describe('TC_AccountStatement_001 @regression @customer', () => {
  test('Request an account statement (latest financial year, PDF)', async ({ accountStatementPage }) => {
    let email = '';

    await test.step('TC_AccountStatement_001_1 | Open Request Statement page', async () => {
      await accountStatementPage.open();
    });

    await test.step('TC_AccountStatement_001_2 | Select the latest financial year', async () => {
      const financialYear = await accountStatementPage.selectLatestFinancialYear();
      console.log(`[AccountStatement] Selected financial year: ${financialYear}`);
    });

    await test.step('TC_AccountStatement_001_3 | Select PDF as the report format', async () => {
      await accountStatementPage.selectReportFormat('PDF');
    });

    await test.step('TC_AccountStatement_001_4 | Get and print the account email', async () => {
      email = await accountStatementPage.getDisplayedEmail();
      console.log(`[AccountStatement] Account email: ${email}`);
      expect(email).toMatch(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
    });

    await test.step('TC_AccountStatement_001_5 | Click Generate', async () => {
      await accountStatementPage.clickGenerate();
    });

    await test.step('TC_AccountStatement_001_6 | Validate the "Report Request Recieved" dialog', async () => {
      const message = await accountStatementPage.getReportRequestReceivedMessage();
      console.log(`[AccountStatement] Dialog message: ${message}`);
      // Live dialog title is misspelled "Report Request Recieved" (confirmed live) — asserting
      // on "report request" only so this survives if that typo is ever fixed.
      expect(message).toMatch(/report request/i);
      expect(message).toMatch(email);
    });

    await test.step('TC_AccountStatement_001_7 | Close the dialog', async () => {
      await accountStatementPage.closeReportRequestReceivedDialog();
    });
  });
});
