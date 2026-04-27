import { PDFParse } from 'pdf-parse';

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLabelToken(value: string): boolean {
  return /^(invoice|inv|number|no|tax)$/i.test(value.trim());
}

export async function readPdfFromBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const parsed = await parser.getText();
    return parsed.text ?? '';
  } finally {
    await parser.destroy().catch(() => {});
  }
}

export function normalizePdfText(rawText: string): string {
  return rawText
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function extractInvoiceNumber(pdfText: string): string {
  const patterns = [
    /Invoice\s*(?:No|Number|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{4,})/i,
    /Tax\s*Invoice[^\n]{0,80}?(?:No|Number|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{4,})/i,
    /(?:Inv|INV)\s*(?:No|Number|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{4,})/i,
    /Invoice\s*[:#-]?\s*([A-Z]{1,4}\d{5,}[A-Z0-9/-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = pdfText.match(pattern);
    if (match?.[1] && !isLabelToken(match[1])) {
      return match[1].trim();
    }
  }

  // Fallback for broken line-wrapping in parsed PDF text:
  // detect "Invoice" label, then read next non-empty line token.
  const lines = pdfText.split('\n').map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    if (/invoice/i.test(lines[index]) && /no|number|#/i.test(lines[index])) {
      const candidate = lines[index + 1] ?? '';
      const tokenMatch = candidate.match(/\b([A-Z0-9][A-Z0-9/-]{4,})\b/i);
      if (tokenMatch?.[1] && !isLabelToken(tokenMatch[1])) {
        return tokenMatch[1].trim();
      }
    }
  }

  // Last resort: scan for invoice-like id tokens and ignore label words.
  const genericToken = pdfText.match(/\b([A-Z]{1,5}\d{5,}[A-Z0-9/-]*)\b/);
  if (genericToken?.[1] && !isLabelToken(genericToken[1])) {
    return genericToken[1].trim();
  }

  return '';
}

export function extractInvoiceDate(pdfText: string): string {
  const match = pdfText.match(/Invoice\s*Date\s*[:#-]?\s*([0-3]?\d[\/-][0-1]?\d[\/-]\d{2,4})/i);
  return match?.[1]?.trim() ?? '';
}

export function extractGstin(pdfText: string): string {
  const match = pdfText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b/i);
  return match?.[0]?.trim() ?? '';
}

export function extractCin(pdfText: string): string {
  const compactText = pdfText.replace(/\s+/g, ' ');
  const strict = compactText.match(/\b[LU]\d{5}[A-Z]{2}\d{4}(?:PTC|PLC|NPL|SGC|OPC|GOI|FTC|ULL|PTC)\d{6}\b/i);
  if (strict?.[0]) {
    return strict[0].trim();
  }

  const labelMatch = compactText.match(/CIN\s*[:#-]?\s*([A-Z0-9]{15,30})/i);
  if (labelMatch?.[1]) {
    return labelMatch[1].trim();
  }

  const looseToken = compactText.match(/\b[LU]\d{5}[A-Z]{2}\d{4}[A-Z0-9]{3,9}\d{4,8}\b/i);
  return looseToken?.[0]?.trim() ?? '';
}

export function extractGoldGrams(pdfText: string): number {
  const decimalPattern = '(?:\\d*\\.\\d{3,6}|\\d+\\.\\d{1,6})';

  // Strongest signal: invoice item numeric row:
  // "711419 0.3085 15734.47 1 GM 4854.37"
  const hsnRowMatch = pdfText.match(
    new RegExp(`\\b\\d{6}\\s+(${decimalPattern})\\s+\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?\\s+1\\s*GM\\b`, 'i'),
  );
  if (hsnRowMatch?.[1]) {
    const value = Number(hsnRowMatch[1]);
    if (!Number.isNaN(value) && value > 0.01 && value < 1) {
      return value;
    }
  }

  // Prefer table-style extraction from invoice rows:
  // "... Description ... HSN ... Grams 0.3085 Rate 15734.47 ..."
  const tableRowMatch = pdfText.match(
    new RegExp(`\\b(?:GOLD|Gold)[\\s\\S]{0,260}?\\b(${decimalPattern})\\b\\s+(?:${decimalPattern}|\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\b`, 'i'),
  );
  if (tableRowMatch?.[1]) {
    const value = Number(tableRowMatch[1]);
    if (!Number.isNaN(value) && value > 0.01 && value < 1) {
      return value;
    }
  }

  // Header-anchored fallback: "Grams ... Rate"
  const gramsRateMatch = pdfText.match(
    new RegExp(`\\bGrams\\b[^\\n\\d]{0,30}(${decimalPattern})[^\\n\\d]{0,30}(?:Rate|Per|Amount)\\b`, 'i'),
  );
  if (gramsRateMatch?.[1]) {
    const value = Number(gramsRateMatch[1]);
    if (!Number.isNaN(value) && value > 0.01 && value < 1) {
      return value;
    }
  }

  const labelAnchored = pdfText.match(
    new RegExp(`(?:Gold\\s*Bought|Gold|Qty|Quantity)[\\s\\S]{0,40}?(${decimalPattern})\\s*(?:gm|grams|g)\\b`, 'i'),
  );
  if (labelAnchored?.[1]) {
    const value = Number(labelAnchored[1]);
    if (!Number.isNaN(value) && value > 0.01 && value < 1) {
      return value;
    }
  }

  const candidates: number[] = [];
  const gramTokenRegex = new RegExp(`(${decimalPattern})\\s*(gm|grams|g)\\b`, 'gi');
  for (const match of pdfText.matchAll(gramTokenRegex)) {
    const rawValue = match[1];
    const index = match.index ?? -1;
    const charBefore = index > 0 ? pdfText[index - 1] : '';
    // Ignore rate snippets like "15688.60/gm".
    if (charBefore === '/') {
      continue;
    }
    const value = Number(rawValue);
    if (!Number.isNaN(value) && value > 0) {
      candidates.push(value);
    }
  }

  if (candidates.length === 0) {
    return Number.NaN;
  }

  // Filter out tiny noise values (e.g. 0.00054) that often come from OCR/text artifacts.
  const plausibleUnderOne = candidates.filter((v) => v > 0.01 && v < 1);
  if (plausibleUnderOne.length > 0) {
    return Math.max(...plausibleUnderOne);
  }

  // Avoid returning disclaimer/examples like 0.00054 grams.
  return Number.NaN;
}

export function extractGoldRate(pdfText: string): number {
  // Strongest signal from item row:
  // "711419 0.3086 15726.67 1 GM 4854.37"
  const rowMatch = pdfText.match(
    /\b\d{6}\s+\d*\.?\d+\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s+1\s*GM\b/i,
  );
  if (rowMatch?.[1]) {
    return parseAmount(rowMatch[1]);
  }

  // Header/table fallback: capture rate that appears before "1 GM".
  const headerMatch = pdfText.match(
    /\bGrams\b[\s\S]{0,220}?\b(\d+(?:,\d{3})*(?:\.\d+)?)\s+1\s*GM\b/i,
  );
  if (headerMatch?.[1]) {
    return parseAmount(headerMatch[1]);
  }

  const match = pdfText.match(/(?:Rate|Buy\s*Rate)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i);
  if (!match) {
    return Number.NaN;
  }

  const value = parseAmount(match[1]);
  return value >= 100 ? value : Number.NaN;
}

export function extractGoldAmount(pdfText: string): number {
  // Strongest signal from item row:
  // "711419 0.3083 15740.92 1 GM 4854.37"
  const rowMatch = pdfText.match(
    /\b\d{6}\s+\d*\.?\d+\s+\d+(?:,\d{3})*(?:\.\d+)?\s+1\s*GM\s+(\d+(?:,\d{3})*(?:\.\d+)?)\b/i,
  );
  if (rowMatch?.[1]) {
    return parseAmount(rowMatch[1]);
  }

  // Fallback from taxable line:
  // "TAXABLE VALUE 0.3083 4854.37"
  const taxableLineMatch = pdfText.match(
    /\bTAXABLE\s*VALUE\b[^\d]*(?:\d*\.?\d+)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\b/i,
  );
  if (taxableLineMatch?.[1]) {
    return parseAmount(taxableLineMatch[1]);
  }

  const match = pdfText.match(/(?:Amount|Taxable\s*Amount)[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i);
  if (!match) {
    return Number.NaN;
  }

  const value = parseAmount(match[1]);
  return value >= 100 ? value : Number.NaN;
}

export function extractNetPayableAmount(pdfText: string): number {
  const strict = pdfText.match(/(?:TOTAL\s*NET\s*PAYABLE|Net\s*Payable|Total\s*Payable|Amount\s*Payable)[^\d]*(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (strict?.[1]) {
    return parseAmount(strict[1]);
  }

  return Number.NaN;
}

export function extractTotalGstAmount(pdfText: string): number {
  // Prefer CGST+SGST block amount; avoids GSTIN false matches.
  const cgstBlock = pdfText.match(/CGST\s*\+\s*SGST([\s\S]{0,60})/i)?.[1] ?? '';
  if (cgstBlock) {
    const numericTokens = [...cgstBlock.matchAll(/\d+(?:,\d{3})*(?:\.\d+)?/g)]
      .map((m) => parseAmount(m[0]))
      .filter((v) => !Number.isNaN(v));
    if (numericTokens.length > 0) {
      return Math.max(...numericTokens);
    }
  }

  const totalGstMatch = pdfText.match(/(?:TOTAL\s*GST|Total\s*GST)[^\d]*(\d+(?:,\d{3})*(?:\.\d+)?)/i);
  if (totalGstMatch?.[1]) {
    return parseAmount(totalGstMatch[1]);
  }

  const allGstMentions = [...pdfText.matchAll(/\b(?:CGST|SGST)\b[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi)];
  if (allGstMentions.length >= 2) {
    const total = allGstMentions
      .map((m) => parseAmount(m[1]))
      .reduce((sum, current) => sum + current, 0);
    return Number(total.toFixed(2));
  }

  return Number.NaN;
}

export function extractAmountNearLabel(pdfText: string, label: string): number {
  const safeLabel = escapeRegex(label);
  const match = pdfText.match(new RegExp(`${safeLabel}[^\\d]*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)`, 'i'));
  return match ? parseAmount(match[1]) : Number.NaN;
}
