import { describe, it, expect } from 'vitest';
import { getLoginData, columnValues, pickFieldValue } from '../../utils/data/admin-excel-data';

describe('admin excel data', () => {
  it('reads the login sheet row', () => {
    const d = getLoginData();
    expect(d).toHaveProperty('branchName');
    expect(d).toHaveProperty('state');
    expect(typeof d.firstName).toBe('string');
  });

  it('getLoginData returns partnerNumber', () => {
    const d = getLoginData();
    expect(d.partnerNumber).toBe('6670305875');
  });

  it('getLoginData returns branchName', () => {
    const d = getLoginData();
    expect(d.branchName).toBe('Augmont');
  });

  it('columnValues skips blank rows and returns the single first name', () => {
    expect(columnValues('FirstName')).toEqual(['Priyanka']);
  });

  it('pickFieldValue returns one of the expected first names', () => {
    const name = pickFieldValue('FirstName');
    expect(['Priyanka']).toContain(name);
  });

  it('pickFieldValue is memoised per field (same value on repeated calls)', () => {
    const first = pickFieldValue('LastName');
    const second = pickFieldValue('LastName');
    expect(first).toBe(second);
  });

  it('columnValues throws for unknown header', () => {
    expect(() => columnValues('NonExistentHeader')).toThrow(/not found in sheet "sheetLogin"/);
  });
});
