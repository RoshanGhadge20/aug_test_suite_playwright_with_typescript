
import { Locator, Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class CustomerMenuPage extends BasePage {

    private readonly userMenuButton: Locator;
    private readonly profileOption: Locator;
    private readonly myOrdersOption: Locator;
    private readonly logoutOption: Locator;
    private readonly kycOption: Locator;

    constructor(page: Page) {
        super(page);

        this.userMenuButton = page.locator('button.user-dropdown');
        this.profileOption = page.getByText('Profile', { exact: true });
        this.myOrdersOption = page.getByText('My Orders', { exact: true });
        this.logoutOption = page.getByText('Logout', { exact: true });
        this.kycOption = page.getByText('Kyc', { exact: true });
    }

    async openUserMenu(): Promise<void> {
        await this.userMenuButton.click();
    }

    async openProfile(): Promise<void> {
        await this.openUserMenu();
        await this.profileOption.click();
    }

    async openMyOrders(): Promise<void> {
        await this.openUserMenu();
        await this.myOrdersOption.click();
    }

    async logout(): Promise<void> {
        await this.openUserMenu();
        await this.logoutOption.click();
    }

    async openKyc(): Promise<void> {
        await this.openUserMenu();
        await this.kycOption.click();
    }

    /** Header pill showing the account name — "guest user" until profile data is completed. */
    userMenuButtonLocator(): Locator {
        return this.userMenuButton;
    }

}