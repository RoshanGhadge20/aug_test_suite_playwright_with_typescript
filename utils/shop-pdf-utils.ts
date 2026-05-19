import { PDFParse } from 'pdf-parse';
import * as pdfUtils from './pdf-utils';

/** Shop invoice PDFs are password-protected; keep this separate from shared pdf-utils. */
export async function readShopInvoicePdf(buffer: Buffer, password: string): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    password,
  });
  try {
    const parsed = await parser.getText();
    return parsed.text ?? '';
  } finally {
    await parser.destroy().catch(() => {});
  }
}

function compactText(pdfText: string): string {
  return pdfText.replace(/\s+/g, ' ').trim();
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

/** Shop tax invoice often has empty Invoice No — use Transaction ID instead. */
export function extractShopInvoiceNumber(pdfText: string): string {
  const transactionId = pdfText.match(/Transaction\s*ID:\s*([A-Za-z0-9_]+)/i)?.[1]?.trim();
  if (transactionId) {
    return transactionId;
  }
  return pdfUtils.extractInvoiceNumber(pdfText);
}

/** UAT shop PDF may show "Invoice Date: -" with no date. */
export function extractShopInvoiceDate(pdfText: string): string {
  return pdfUtils.extractInvoiceDate(pdfText);
}

export function isShopInvoiceDateMissingInPdf(pdfText: string): boolean {
  return /Invoice\s*Date\s*:\s*-+/i.test(pdfText);
}

/** Shop invoice uses "Subtotal Amount 1602" instead of "Net Payable". */
export function extractShopNetPayable(pdfText: string): number {
  const compact = compactText(pdfText);
  const patterns = [
    /Subtotal\s*Amount\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*E\.?\s*&\s*O\.?\s*E\.?/i,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      const value = parseAmount(match[1]);
      if (!Number.isNaN(value) && value > 0) {
        return value;
      }
    }
  }

  const fallback = pdfUtils.extractNetPayableAmount(pdfText);
  return Number.isNaN(fallback) ? Number.NaN : fallback;
}

/** Product name can wrap across lines in parsed PDF text. */
export function shopPdfContainsProductName(pdfText: string, productName: string): boolean {
  const haystack = compactText(pdfText).toLowerCase();
  const full = productName.trim().toLowerCase();
  const core = full.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return haystack.includes(full) || (core.length > 8 && haystack.includes(core));
}

/** Shop UI order id may differ from PDF; PDF has Razorpay Transaction ID. */
export function shopPdfContainsOrderReference(pdfText: string, orderId: string): boolean {
  const compact = compactText(pdfText);
  if (orderId && compact.includes(orderId)) {
    return true;
  }
  return /Transaction\s*ID:\s*[A-Za-z0-9_]+/i.test(compact);
}

export type ShopInvoiceGstDetails = {
  taxableAmount: number;
  igstRatePercent: number | null;
  igstAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Taxable value before GST — "Net Total" on shop tax invoice. */
export function extractShopTaxableAmount(pdfText: string): number {
  const compact = compactText(pdfText);
  const netTotal = compact.match(/Net\s*Total\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (netTotal?.[1]) {
    return parseAmount(netTotal[1]);
  }
  return Number.NaN;
}

function extractShopTaxLine(
  pdfText: string,
  label: 'IGST' | 'CGST' | 'SGST',
): { ratePercent: number | null; amount: number | null } {
  const compact = compactText(pdfText);
  const withRate = compact.match(
    new RegExp(`${label}\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*(\\d+(?:,\\d{3})*(?:\\.\\d+)?)`, 'i'),
  );
  if (withRate?.[1] && withRate?.[2]) {
    return { ratePercent: parseAmount(withRate[1]), amount: parseAmount(withRate[2]) };
  }

  const amountOnly = compact.match(new RegExp(`${label}\\s+(\\d+(?:,\\d{3})*(?:\\.\\d+)?)`, 'i'));
  if (amountOnly?.[1]) {
    return { ratePercent: null, amount: parseAmount(amountOnly[1]) };
  }

  return { ratePercent: null, amount: null };
}

export function extractShopInvoiceGstDetails(pdfText: string): ShopInvoiceGstDetails {
  const igst = extractShopTaxLine(pdfText, 'IGST');
  const cgst = extractShopTaxLine(pdfText, 'CGST');
  const sgst = extractShopTaxLine(pdfText, 'SGST');

  let taxableAmount = extractShopTaxableAmount(pdfText);
  if (Number.isNaN(taxableAmount)) {
    const netPayable = extractShopNetPayable(pdfText);
    const taxSum = (igst.amount ?? 0) + (cgst.amount ?? 0) + (sgst.amount ?? 0);
    if (!Number.isNaN(netPayable) && taxSum > 0) {
      taxableAmount = round2(netPayable - taxSum);
    }
  }

  return {
    taxableAmount,
    igstRatePercent: igst.ratePercent,
    igstAmount: igst.amount,
    cgstAmount: cgst.amount,
    sgstAmount: sgst.amount,
  };
}

/** Validate IGST (default 3%) on taxable amount; CGST/SGST when present (split GST). */
export function validateShopInvoiceGst(params: {
  taxableAmount: number;
  netPayable: number;
  igstAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  igstRatePercent?: number;
  tolerance?: number;
}): { ok: boolean; messages: string[] } {
  const tolerance = params.tolerance ?? 1;
  const gstRate = params.igstRatePercent ?? 3;
  const messages: string[] = [];

  if (Number.isNaN(params.taxableAmount) || params.taxableAmount <= 0) {
    return { ok: false, messages: ['Taxable amount (Net Total) not found in shop invoice PDF'] };
  }

  if (params.igstAmount != null && params.igstAmount > 0) {
    const expectedIgst = round2(params.taxableAmount * (gstRate / 100));
    if (Math.abs(params.igstAmount - expectedIgst) > tolerance) {
      messages.push(
        `IGST ${params.igstAmount} != ${gstRate}% of taxable ${params.taxableAmount} (expected ${expectedIgst})`,
      );
    }
  }

  if (params.cgstAmount != null && params.cgstAmount > 0) {
    const halfRate = gstRate / 2;
    const expectedCgst = round2(params.taxableAmount * (halfRate / 100));
    if (Math.abs(params.cgstAmount - expectedCgst) > tolerance) {
      messages.push(
        `CGST ${params.cgstAmount} != ${halfRate}% of taxable ${params.taxableAmount} (expected ${expectedCgst})`,
      );
    }
  }

  if (params.sgstAmount != null && params.sgstAmount > 0) {
    const halfRate = gstRate / 2;
    const expectedSgst = round2(params.taxableAmount * (halfRate / 100));
    if (Math.abs(params.sgstAmount - expectedSgst) > tolerance) {
      messages.push(
        `SGST ${params.sgstAmount} != ${halfRate}% of taxable ${params.taxableAmount} (expected ${expectedSgst})`,
      );
    }
  }

  if (
    params.cgstAmount != null &&
    params.sgstAmount != null &&
    params.cgstAmount > 0 &&
    params.sgstAmount > 0 &&
    Math.abs(params.cgstAmount - params.sgstAmount) > 0.02
  ) {
    messages.push(`CGST ${params.cgstAmount} != SGST ${params.sgstAmount}`);
  }

  const totalTax = (params.igstAmount ?? 0) + (params.cgstAmount ?? 0) + (params.sgstAmount ?? 0);
  if (totalTax > 0 && !Number.isNaN(params.netPayable)) {
    const expectedPayable = round2(params.taxableAmount + totalTax);
    if (Math.abs(params.netPayable - expectedPayable) > tolerance) {
      messages.push(
        `Net payable ${params.netPayable} != taxable + tax (${params.taxableAmount} + ${totalTax} = ${expectedPayable})`,
      );
    }
  }

  return { ok: messages.length === 0, messages };
}
