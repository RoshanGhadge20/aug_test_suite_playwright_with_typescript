import { Page } from '@playwright/test';
import { BasePage } from '../shared/base.page';

export class KycPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  private btnKyc = () =>
    this.page.getByText(/kyc/i);

  private ddlDocument = () =>
    this.page.locator('select');

  private uploadInput = () =>
    this.page.locator(
      "input[type='file']"
    );

  private txtPan = () =>
    this.page.locator(
      "input[placeholder*='PAN']"
    );

  private btnSubmit = () =>
    this.page.getByRole('button', {
      name: /submit/i
    });

  async completeKyc(
    pan: string
  ): Promise<void> {

    await this.click(this.btnKyc());

    await this.select(
      this.ddlDocument(),
      'PAN'
    );

    await this.upload(
      this.uploadInput(),
      'test-data/pan-card.jpg'
    );

    await this.fill(this.txtPan(), pan);

    await this.click(this.btnSubmit());

    await this.waitForLoader();
  }
}