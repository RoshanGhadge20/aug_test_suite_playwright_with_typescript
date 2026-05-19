import { allure } from 'allure-playwright';

export type ShopTc001OrderSummary = {
  orderId: string;
  productName: string;
  grandTotal: number;
  paymentMethod: string;
  successMessage: string;
};

export type ShopTc001InvoiceSummary = {
  orderId: string;
  invoiceNo: string;
  invoiceDate: string;
  gstin: string;
  cin: string;
  netPayable: number;
  taxableAmount: number;
  igstAmount: number | null;
  igstRatePercent: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  gstValidationOk: boolean;
  gstValidationMessages: string[];
  pdfUrl: string;
};

/** Allure labels and metadata for TC_SHOP_001. */
export async function configureShopTc001Allure(): Promise<void> {
  await allure.epic('Customer');
  await allure.feature('Shop');
  await allure.story('TC_SHOP_001 — Gold coin shop flow');
  await allure.severity('critical');
  await allure.tag('customer-flows');
  await allure.tag('TC_SHOP_001');
  await allure.label('testCaseId', 'TC_SHOP_001');
  await allure.description(
    'End-to-end shop flow: filter, cart, checkout, payment, My Orders, order detail, and invoice PDF validation.',
  );
}

export async function attachShopTc001OrderPlaced(summary: ShopTc001OrderSummary): Promise<void> {
  await allure.step('Order placed', async () => {
    await allure.parameter('orderId', summary.orderId);
    await allure.parameter('productName', summary.productName);
    await allure.parameter('grandTotal', String(summary.grandTotal));
    await allure.parameter('paymentMethod', summary.paymentMethod);
    await allure.attachment('order-placed.json', JSON.stringify(summary, null, 2), 'application/json');
  });
}

export async function attachShopTc001InvoiceValidation(summary: ShopTc001InvoiceSummary): Promise<void> {
  await allure.step('Invoice PDF validation summary', async () => {
    await allure.parameter('invoiceNo', summary.invoiceNo);
    await allure.parameter('netPayable', String(summary.netPayable));
    await allure.parameter('igstAmount', String(summary.igstAmount ?? ''));
    await allure.parameter('gstValidationOk', String(summary.gstValidationOk));
    await allure.attachment('invoice-validation.json', JSON.stringify(summary, null, 2), 'application/json');
  });
}

/** Record actual vs expected for a step in the Allure report. */
export async function recordShopTc001Assertion(
  stepNo: number,
  label: string,
  actual: unknown,
  expected: unknown,
): Promise<void> {
  await allure.step(`TC_SHOP_001_${stepNo} | ${label}`, async () => {
    await allure.parameter('actual', String(actual));
    await allure.parameter('expected', String(expected));
  });
}
