import { test } from '@playwright/test';

test.describe('Customer Management', () => {

  test('Add customer successfully', async ({ page }) => {

    const customerPage = new CustomerManagementPage(page);

    await page.goto('YOUR_URL');

    // Login here

    await customerPage.navigateToCustomerManagement(
      'Pune Branch'
    );

    await customerPage.selectLead('Facebook');

    await customerPage.fillCustomerDetails({
      firstName: 'Priyanka',
      lastName: 'Thorat',
      stateName: 'Maharashtra',
      cityName: 'Pune',
    });
  });
});
