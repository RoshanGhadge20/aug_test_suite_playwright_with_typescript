import path from 'path';
import * as XLSX from 'xlsx';

const CUSTOMER_DATA_WORKBOOK = path.resolve(
  process.cwd(),
  'testdata',
  'customer',
  'customer-data.xlsx',
);

const workbookCache = new Map<string, XLSX.WorkBook>();

function getWorkbook(filePath: string): XLSX.WorkBook {
  if (!workbookCache.has(filePath)) {
    workbookCache.set(filePath, XLSX.readFile(filePath));
  }
  return workbookCache.get(filePath)!;
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function readSheetRows<T extends Record<string, unknown>>(
  sheetName: string,
  filePath = CUSTOMER_DATA_WORKBOOK,
): T[] {
  const workbook = getWorkbook(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }
  return XLSX.utils.sheet_to_json<T>(sheet, {
    defval: '',
    raw: false,
  });
}

export interface BuyMetalDataset {
  oneTimeGoldAmount: string;
  oneTimeSilverAmount: string;
  contactNumber: string;
  cardHolderName: string;
  metalGold: string;
  metalSilver: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardOtp: string;
}

export function getBuyMetalDataset(): BuyMetalDataset {
  const [firstRow] = readSheetRows<Record<string, unknown>>('buyMetal');
  if (!firstRow) {
    throw new Error(`No rows found in sheet "buyMetal" inside ${CUSTOMER_DATA_WORKBOOK}`);
  }

  return {
    oneTimeGoldAmount: normalizeCell(firstRow.oneTimeGoldAmount),
    oneTimeSilverAmount: normalizeCell(firstRow.oneTimeSilverAmount),
    contactNumber: normalizeCell(firstRow.contactNumber),
    cardHolderName: normalizeCell(firstRow.cardHolderName),
    metalGold: normalizeCell(firstRow.metalGold),
    metalSilver: normalizeCell(firstRow.metalSilver),
    cardNumber: normalizeCell(firstRow.cardNumber),
    cardExpiry: normalizeCell(firstRow.cardExpiry),
    cardCvv: normalizeCell(firstRow.cardCvv),
    cardOtp: normalizeCell(firstRow.cardOtp),
  };
}

export interface SipFlowsDataset {
  SIPEmandateAmount: string;
  SIPInvestmentDay: string;
  SIPRecreateInvestmentDay: string;
  SIPStartAfterDays: string;
  SIPDurationWeekly: string;
  SIPStatus: string;
  GoldLabel: string;
  SilverLabel: string;
  metal: string;
  ContactNumber: string;
  BankName: string;
  EmandateBankName: string;
  AccountHolderName: string;
  AccountNumber: string;
  IFSCCode: string;
  AccountType: string;
  SIPWeeklyAmount: string;
  SIPWeeklyInvestmentDay: string;
  SIPWeeklyFrequency: string;
  SIPWeeklySilverMetal: string;
  SIPMonthlyAmount: string;
  SIPMonthlyFrequency: string;
  SIPMonthlyGoldMetal: string;
  SIPMonthlyPlanPrefix: string;
  SIPMonthlySilverMetal: string;
}

export function getSipFlowsDataset(): SipFlowsDataset {
  const [firstRow] = readSheetRows<Record<string, unknown>>('sipFlows');
  if (!firstRow) {
    throw new Error(`No rows found in sheet "sipFlows" inside ${CUSTOMER_DATA_WORKBOOK}`);
  }

  return {
    SIPEmandateAmount: normalizeCell(firstRow.SIPEmandateAmount),
    SIPInvestmentDay: normalizeCell(firstRow.SIPInvestmentDay),
    SIPRecreateInvestmentDay: normalizeCell(firstRow.SIPRecreateInvestmentDay ?? firstRow.SIPInvestmentDay),
    SIPStartAfterDays: normalizeCell(firstRow.SIPStartAfterDays ?? 5),
    SIPDurationWeekly: normalizeCell(firstRow.SIPDurationWeekly),
    SIPStatus: normalizeCell(firstRow.SIPStatus ?? 'Pending'),
    GoldLabel: normalizeCell(firstRow.GoldLabel ?? 'Gold'),
    SilverLabel: normalizeCell(firstRow.SilverLabel ?? 'Silver'),
    metal: normalizeCell(firstRow.metal),
    ContactNumber: normalizeCell(firstRow.ContactNumber ?? firstRow.contactNumber),
    BankName: normalizeCell(firstRow.BankName),
    EmandateBankName: normalizeCell(firstRow.EmandateBankName ?? firstRow.BankName),
    AccountHolderName: normalizeCell(firstRow.AccountHolderName),
    AccountNumber: normalizeCell(firstRow.AccountNumber),
    IFSCCode: normalizeCell(firstRow.IFSCCode),
    AccountType: normalizeCell(firstRow.AccountType),
    SIPWeeklyAmount: normalizeCell(firstRow.SIPWeeklyAmount),
    SIPWeeklyInvestmentDay: normalizeCell(firstRow.SIPWeeklyInvestmentDay),
    SIPWeeklyFrequency: normalizeCell(firstRow.SIPWeeklyFrequency),
    SIPWeeklySilverMetal: normalizeCell(firstRow.SIPWeeklySilverMetal),
    SIPMonthlyAmount: normalizeCell(firstRow.SIPMonthlyAmount),
    SIPMonthlyFrequency: normalizeCell(firstRow.SIPMonthlyFrequency),
    SIPMonthlyGoldMetal: normalizeCell(firstRow.SIPMonthlyGoldMetal),
    SIPMonthlyPlanPrefix: normalizeCell(firstRow.SIPMonthlyPlanPrefix),
    SIPMonthlySilverMetal: normalizeCell(firstRow.SIPMonthlySilverMetal),
  };
}
