import path from 'path';
import * as XLSX from 'xlsx';

/** Customer test data workbook: `testdata/customer/customer-data.xlsx` */
export const CUSTOMER_DATA_DIR = path.resolve(process.cwd(), 'testdata', 'customer');
export const CUSTOMER_DATA_WORKBOOK = path.join(CUSTOMER_DATA_DIR, 'customer-data.xlsx');

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

function updateFirstDataRowCellByHeader(
  sheetName: string,
  headerName: string,
  value: string,
  filePath = CUSTOMER_DATA_WORKBOOK,
): void {
  const workbook = getWorkbook(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const headerRowIndex = range.s.r;
  const firstDataRowIndex = headerRowIndex + 1;

  let targetColumnIndex = -1;
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const headerCellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    const headerValue = normalizeCell(sheet[headerCellAddress]?.v);
    if (headerValue === headerName) {
      targetColumnIndex = col;
      break;
    }
  }

  if (targetColumnIndex === -1) {
    // Auto-create missing header at the end of the header row.
    targetColumnIndex = range.e.c + 1;
    const newHeaderCellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: targetColumnIndex });
    sheet[newHeaderCellAddress] = { t: 's', v: headerName };
    range.e.c = targetColumnIndex;
  }

  const targetCellAddress = XLSX.utils.encode_cell({ r: firstDataRowIndex, c: targetColumnIndex });
  sheet[targetCellAddress] = { t: 's', v: value };

  // Keep the sheet range valid in case first data row did not previously exist.
  if (firstDataRowIndex > range.e.r) {
    range.e.r = firstDataRowIndex;
    sheet['!ref'] = XLSX.utils.encode_range(range);
  }

  XLSX.writeFile(workbook, filePath);
  workbookCache.set(filePath, XLSX.readFile(filePath));
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

export interface WithdrawalTc003Dataset {
  invalidIfscAccountNumber: string;
  invalidIfscCode: string;
  expectedInvalidIfscMessage: string;
  invalidAccountNumber: string;
  invalidAccountIfscCode: string;
  expectedInvalidAccountMessage: string;
  validAccountNumber: string;
  validAccountInvalidIfscCode: string;
  expectedToastErrorMessage: string;
  expectedVerifiedAccountMessage: string;
  expectedVerifiedAccountTransactionErrorMessage: string;
  verifiedAccountNumber: string;
  verifiedAccountIfscCode: string;
}

export function getWithdrawalTc003Dataset(): WithdrawalTc003Dataset {
  const [firstRow] = readSheetRows<Record<string, unknown>>('withdrawal');
  if (!firstRow) {
    throw new Error(`No rows found in sheet "withdrawal" inside ${CUSTOMER_DATA_WORKBOOK}`);
  }

  return {
    invalidIfscAccountNumber: normalizeCell(firstRow.WithdrawalInvalidIfscAccountNumber ?? '1234567890'),
    invalidIfscCode: normalizeCell(firstRow.WithdrawalInvalidIfscCode ?? '1234567890'),
    expectedInvalidIfscMessage: normalizeCell(firstRow.WithdrawalExpectedInvalidIfscMessage ?? 'Enter a valid IFSC Code'),
    invalidAccountNumber: normalizeCell(firstRow.WithdrawalInvalidAccountNumber ?? '123'),
    invalidAccountIfscCode: normalizeCell(firstRow.WithdrawalInvalidAccountIfscCode ?? 'ICIC0006134'),
    expectedInvalidAccountMessage: normalizeCell(firstRow.WithdrawalExpectedInvalidAccountMessage ?? 'Enter a valid Account Number'),
    validAccountNumber: normalizeCell(firstRow.WithdrawalValidAccountNumber ?? '5312730447'),
    validAccountInvalidIfscCode: normalizeCell(firstRow.WithdrawalValidAccountInvalidIfscCode ?? 'ICIC0006244'),
    expectedToastErrorMessage: normalizeCell(firstRow.WithdrawalExpectedToastErrorMessage ?? 'TRANSACTION NOT ALLOWED AS INVALID ACCOUNT'),
    expectedVerifiedAccountMessage: normalizeCell(
      firstRow.WithdrawalExpectedVerifiedAccountMessage ?? firstRow.WithdrawalExpectedToastErrorMessage ?? 'TRANSACTION NOT ALLOWED AS INVALID ACCOUNT',
    ),
    expectedVerifiedAccountTransactionErrorMessage: normalizeCell(
      firstRow.WithdrawalExpectedVerifiedAccountTransactionErrorMessage ??
        firstRow.WithdrawalExpectedVerifiedAccountMessage ??
        firstRow.WithdrawalExpectedToastErrorMessage ??
        'TRANSACTION NOT ALLOWED AS INVALID ACCOUNT',
    ),
    verifiedAccountNumber: normalizeCell(firstRow.WithdrawalVerifiedAccountNumber ?? '3048155145'),
    verifiedAccountIfscCode: normalizeCell(firstRow.WithdrawalVerifiedAccountIfscCode ?? 'KKBK0001422'),
  };
}

export interface WithdrawalTc004Dataset {
  /** TC004 gold vault → coin product list selection (`WithdrawalTc004ProductName` column). */
  productName: string;
  /** TC005 SIP silver convert flow — product list selection (`WithdrawalTc005ProductName` column). */
  tc005ProductName: string;
  /** TC006 gold jewellery product list selection (`WithdrawalTc006ProductName` column). */
  tc006ProductName: string;
}

export function getWithdrawalTc004Dataset(): WithdrawalTc004Dataset {
  const [firstRow] = readSheetRows<Record<string, unknown>>('withdrawal');
  if (!firstRow) {
    throw new Error(`No rows found in sheet "withdrawal" inside ${CUSTOMER_DATA_WORKBOOK}`);
  }

  return {
    productName: normalizeCell(firstRow.WithdrawalTc004ProductName ?? 'Augmont 1Gm Gold Coin (916 Purity)'),
    tc005ProductName: normalizeCell(
      firstRow.WithdrawalTc005ProductName ?? 'Augmont 1GM Silver Coin 999 Purity',
    ),
    tc006ProductName: normalizeCell(
      firstRow.WithdrawalTc006ProductName ?? 'Augmont Classic Om Pendant',
    ),
  };
}

export function saveWithdrawalTc003VerifiedAccountActualErrorMessage(actualErrorMessage: string): void {
  updateFirstDataRowCellByHeader(
    'withdrawal',
    'WithdrawalVerifiedAccountActualErrorMessage',
    normalizeCell(actualErrorMessage),
  );
}

/** Persist TC005 silver product selection on the `withdrawal` sheet (`WithdrawalTc005ProductName` header, first data row). */
export function saveWithdrawalTc005ProductName(productName: string): void {
  updateFirstDataRowCellByHeader(
    'withdrawal',
    'WithdrawalTc005ProductName',
    normalizeCell(productName),
  );
}

/** Persist TC006 gold jewellery product selection on the `withdrawal` sheet (`WithdrawalTc006ProductName` header, first data row). */
export function saveWithdrawalTc006ProductName(productName: string): void {
  updateFirstDataRowCellByHeader(
    'withdrawal',
    'WithdrawalTc006ProductName',
    normalizeCell(productName),
  );
}

const SHOP_TC001_DEFAULT_MOBILE = '9561273901';
const SHOP_TC001_DEFAULT_OTP = '1234';

export interface ShopDataset {
  /** TC_SHOP_001 product list selection (`ShopTc001ProductName` column on `shop` sheet). */
  productName: string;
  /** OTP checkout mobile (`ShopTc001Mobile` on `shop` sheet, else `SHOP_TC001_MOBILE` env). */
  mobile: string;
  /** OTP checkout code (`ShopTc001Otp` on `shop` sheet, else `SHOP_TC001_OTP` env). */
  otp: string;
}

/** TC_SHOP_001 data from `shop` sheet in `testdata/customer/customer-data.xlsx`. */
export function getShopDataset(): ShopDataset {
  const [firstRow] = readSheetRows<Record<string, unknown>>('shop', CUSTOMER_DATA_WORKBOOK);
  if (!firstRow) {
    throw new Error(`No rows found in sheet "shop" inside ${CUSTOMER_DATA_WORKBOOK}`);
  }

  const excelMobile = normalizeCell(firstRow.ShopTc001Mobile);
  const excelOtp = normalizeCell(firstRow.ShopTc001Otp);

  return {
    productName: normalizeCell(
      firstRow.ShopTc001ProductName ?? 'Augmont 0.1Gm Gold Coin (999 Purity)',
    ),
    mobile: excelMobile || process.env.SHOP_TC001_MOBILE?.trim() || SHOP_TC001_DEFAULT_MOBILE,
    otp: excelOtp || process.env.SHOP_TC001_OTP?.trim() || SHOP_TC001_DEFAULT_OTP,
  };
}
