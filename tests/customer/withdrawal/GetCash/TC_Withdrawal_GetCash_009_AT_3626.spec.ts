import { test, expect } from '../../../../fixtures/base.fixture';
import { SipDetails } from '@pages/customer/withdraw-sip.page';

const withdrawalQuantityInput = 0.1;
const withdrawalQuantityInputZero = 0;

let selectedSipName = '';
let silverSip: SipDetails;

test.describe('TC_Withdrawal_GetCash_009 @customer-flows', () => {
    test(
        'TC_009-withdrawal from Silver SIP and Validation error message for minimum and maximum withdrawal amount',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawsipPage,
        }) => {
            const TC_009 = (n: number): string => `TC009_${n}`;

            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_009(n)}] ${title}`);
            };

            await test.step(
                'TC009_1 | Navigate to Silver Withdrawal',
                async () => {
                    await page.goto('/dashboard');

                    await dashboardPage.clickWithdrawInvestment();
                    await withdrawalPage.clickGetCashOption();
                    await withdrawDetailPage.clickSilverTab();

                    const silverSummary =
                        await withdrawalPage.getMetalSummary('Silver');

                    expect(silverSummary.value).toBeCloseTo(
                        silverSummary.total * silverSummary.livePrice,
                        1
                    );
                }
            );

            await test.step(
                'TC009_2 | Select Silver SIP',
                async () => {
                    silverSip =
                        await withdrawsipPage.selectSipForWithdrawal('Silver', withdrawalQuantityInput);

                    console.log('Selected SIP:', silverSip);

                    selectedSipName = silverSip.sipName;

                    expect(silverSip.amount).toBeGreaterThan(0);
                    expect(silverSip.quantity).toBeGreaterThanOrEqual(
                        withdrawalQuantityInput
                    );
                }
            );

            await test.step(
                'TC009_3 | Validate Withdraw button disabled for 0 quantity',
                async () => {
                    await withdrawalPage.clickProceed();

                    const withdrawalSummary =
                        await withdrawDetailPage.getWithdrawalSummary('Silver');

                    expect(withdrawalSummary.totalMetal).toBeGreaterThanOrEqual(
                        withdrawalQuantityInput
                    );

                    // Enter valid quantity
                    await withdrawDetailPage.enterWithdrawalQuantity(
                        withdrawalQuantityInput
                    );

                    // Enter zero quantity
                    await withdrawDetailPage.enterWithdrawalQuantity(
                        withdrawalQuantityInputZero
                    );

                    await withdrawDetailPage.validateWithdrawButtonDisabled();
                }
            );

            await test.step(
                'TC009_4 | Validate error message for quantity greater than available',
                async () => {
                    logSub(
                        4,
                        'Validate error message for quantity greater than available'
                    );

                    const quantityMoreThanAvailable =
                        silverSip.quantity + 1;

                    console.log(
                        'Entered Quantity:',
                        quantityMoreThanAvailable
                    );

                    const error =
                        await withdrawDetailPage.enterWithdrawalQuantityGetErrorMessage(
                            quantityMoreThanAvailable
                        );
                    const errorMessage = (await error.textContent())?.trim();

                    console.log('Error message:', errorMessage);

                    await expect(error).toBeVisible();
                    await expect(error).toContainText(
                        'Enter value below or equal to'
                    );
                }
            );
        }
    );
});