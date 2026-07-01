import { test, expect } from '../../../../fixtures/base.fixture';
import { getWithdrawalTc003Dataset } from '../../../../utils/data/customer-excel-data';

const withdrawalQuantityInput = 0.1;
const tc003Dataset = getWithdrawalTc003Dataset();

test.describe('TC_WITHDRAWAL_004 @customer-flows', () => {
    test(
        'TC_004-Withdraw from Gold Vault with Add Bank validation and error message checks',
        async ({
            page,
            dashboardPage,
            withdrawalPage,
            withdrawDetailPage,
            withdrawAccountDetailPage,
            addNewBankWithdrawalPage
        }) => {
            const TC_004 = (n: number): string => `TC004_${n}`;
            const logSub = (n: number, title: string): void => {
                console.log(`\n[${TC_004(n)}] ${title}`);
            };

            let bankDetails: {
                bankName: string;
                accountHolder: string;
                accountNumber: string;
                ifscCode: string;
            };
            await test.step(
                'TC004_1 | select get Cash Option',
                async () => {
                    logSub(
                        1,
                        'select get Cash Option'
                    );
                    await page.goto('/dashboard');
                    await dashboardPage.clickWithdrawInvestment();
                    await withdrawalPage.clickGetCashOption();
                    await withdrawalPage.verifyGetCashNavigatesToInvestmentList();
                }
            );

            await test.step(
                'TC004_2 | Get Gold Summary from Investment List and validate Gold Value',
                async () => {
                    logSub(2,
                        'Get Gold Summary from Investment List and validate Gold Value'
                    );

                    await withdrawDetailPage.clickGoldTab();

                    const goldSummary =
                        await withdrawalPage.getMetalSummary('Gold');

                    console.log('Gold Summary:', goldSummary);

                    expect(goldSummary.value).toBeCloseTo(
                        goldSummary.total * goldSummary.livePrice,
                        1
                    );
                }
            );

            await test.step(
                'TC004_3 | select Gold Vault for withdrawal and get vault detail',
                async () => {
                    logSub(
                        3,
                        'select Gold Vault for withdrawal and get vault detail'
                    );

                    const goldVault =
                        await withdrawalPage.getVaultDetailsAndClick('Gold');


                    console.log(
                        'Withdrawal Gold:',
                        goldVault.withdrawalMetal
                    );
                    console.log(
                        'Gold Vault Value:',
                        goldVault.vaultValue
                    );

                    expect(
                        goldVault.withdrawalMetal,
                        `Not enough quantity available for withdrawal. Available Gold: ${goldVault.withdrawalMetal} gm`
                    ).toBeGreaterThan(0);
                }
            );

            await test.step(
                'TC004_4 | proceed for withdrawal and get withdrawal detail',
                async () => {
                    logSub(
                        4,
                        'proceed for withdrawal and get withdrawal detail'
                    );

                    await withdrawalPage.clickProceed();

                    const withdrawalSummary =
                        await withdrawDetailPage.getWithdrawalSummary('Gold');

                    console.log(
                        'Total Value:',
                        withdrawalSummary.totalValue
                    );
                    console.log(
                        'Total Gold:',
                        withdrawalSummary.totalMetal
                    );

                    if (
                        withdrawalQuantityInput >
                        withdrawalSummary.totalMetal
                    ) {
                        throw new Error(
                            `Quantity is not enough for withdrawal. Available: ${withdrawalSummary.totalMetal} gm, Requested: ${withdrawalQuantityInput} gm`
                        );
                    }

                    await withdrawDetailPage.enterWithdrawalQuantity(
                        withdrawalQuantityInput
                    );

                    await withdrawDetailPage.clickWithdraw();

                    await expect(page).toHaveURL(
                        /\/withdraw\/account-details$/
                    );
                }
            );

            await test.step(
                'TC004_5 | get and validate Account Detail  Page Summary and select Bank',
                async () => {
                    logSub(
                        5,
                        'get and validate Account Detail  Page Summary and select Bank'
                    );

                    const accountDetails =
                        await withdrawAccountDetailPage.getAccountDetails();
                    expect(accountDetails.withdrawalFrom).toContain(
                        'Gold Vault'
                    );

                    expect(accountDetails.quantity).toBe(
                        withdrawalQuantityInput
                    );
                    console.log('account details', accountDetails);
                    await withdrawAccountDetailPage.clickBankAccount();
                    await withdrawAccountDetailPage.selectFirstBank();
                    bankDetails = await withdrawAccountDetailPage.getSelectedBankDetails();
                    console.log(bankDetails);
                }
            );

            await test.step(
                'TC004_6 | Add New Bank with Invalid IFSC Code',
                async () => {
                    logSub(6, 'Add New Bank with Invalid IFSC Code');
                    await withdrawAccountDetailPage.clickBankAccount();
                    await addNewBankWithdrawalPage.clickAddBankDetails();
                    await addNewBankWithdrawalPage.fillBankDetails(tc003Dataset.invalidIfscAccountNumber,
                        tc003Dataset.invalidIfscCode);
                    const errorMessage = await addNewBankWithdrawalPage.getIFSCFieldErrorMessage();
                    console.log('Error message is:', errorMessage)
                    expect(errorMessage).toBe(tc003Dataset.expectedInvalidIfscMessage);
                    await addNewBankWithdrawalPage.clickCancel();

                }
            );

            await test.step(
                'TC004_7 | Add New Bank with Invalid Account Number',
                async () => {
                    logSub(7, 'Add New Bank with Invalid Account Number');

                    await addNewBankWithdrawalPage.addBankDetails(tc003Dataset.invalidAccountNumber,
                        tc003Dataset.invalidAccountIfscCode);

                    const invalidAccountMessage = await addNewBankWithdrawalPage.getAccountNumberFieldErrorMessage();
                    expect(invalidAccountMessage
                    ).toBe(tc003Dataset.expectedInvalidAccountMessage);
                    console.log('invalid account message is:', invalidAccountMessage)
                    await addNewBankWithdrawalPage.clickCancel();
                }
            );


            await test.step('TC004_8 | add new bank with Valid account number and invalid ifsc code and verify transaction', async () => {
                logSub(8, 'Add new bank with valid account number and invalid IFSC (toast)');
                const accountNumber = tc003Dataset.validAccountNumber;
                const ifscCode = tc003Dataset.validAccountInvalidIfscCode;
                const expectedToastErrorMessage = tc003Dataset.expectedToastErrorMessage;
                console.log(`[${test.info().title}] Input values`, {
                    step: 'Invalid IFSC',
                    accountNumber,
                    ifscCode,
                });


                await addNewBankWithdrawalPage.addBankDetails(
                    tc003Dataset.validAccountNumber,
                    tc003Dataset.validAccountInvalidIfscCode
                );
                await addNewBankWithdrawalPage.clickSaveBank();
                await expect(
                    page.getByText('TRANSACTION NOT ALLOWED AS INVALID ACCOUNT')
                ).toBeVisible({ timeout: 10000 });

                const message = await page
                    .getByText('TRANSACTION NOT ALLOWED AS INVALID ACCOUNT')
                    .textContent();

                expect(message?.trim()).toBe(
                    'TRANSACTION NOT ALLOWED AS INVALID ACCOUNT'
                );
                await addNewBankWithdrawalPage.clickCancel();
            });

            await test.step('TC004_9 | add bank detais with already verified account and verify transaction', async () => {
                logSub(9, 'Add bank details with already verified account and verify transaction');
                const accountNumber = bankDetails.accountNumber;
                const ifscCode = bankDetails.ifscCode;
                console.log(`[${test.info().title}] Input values`, {
                    step: 'Already Verified Account',
                    accountNumber,
                    ifscCode,
                });


                await addNewBankWithdrawalPage.addBankDetails(
                    bankDetails.accountNumber,
                    bankDetails.ifscCode
                );
                await addNewBankWithdrawalPage.clickSaveBank();
                await page.waitForTimeout(1000);
                await addNewBankWithdrawalPage.clickSaveBank();


                await expect(
                    page.getByText('Customer bank already added')
                ).toBeVisible();

                const message = await page.getByText('Customer bank already added').textContent();
                console.log(
                    'Already verified account transaction error message:',
                    message
                );
                expect(message?.trim()).toBe('Customer bank already added');
            });

        });
});