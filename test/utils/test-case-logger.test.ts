import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTestCaseLogger,
  formatLogValue,
  logActualExpected,
  valuesMatchForLog,
} from '../../utils/test/test-case-logger';

describe('test-case-logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formatLogValue stringifies primitives and objects', () => {
    expect(formatLogValue('abc')).toBe('abc');
    expect(formatLogValue(1602)).toBe('1602');
    expect(formatLogValue({ a: 1 })).toBe('{"a":1}');
  });

  it('valuesMatchForLog compares numbers with tolerance', () => {
    expect(valuesMatchForLog(1602, 1602)).toBe(true);
    expect(valuesMatchForLog(1602.004, 1602)).toBe(true);
    expect(valuesMatchForLog(1500, 1602)).toBe(false);
  });

  it('valuesMatchForLog supports regex and > N patterns', () => {
    expect(valuesMatchForLog('Payment Received', /payment received/i)).toBe(true);
    expect(valuesMatchForLog(150.91, '> 0')).toBe(true);
    expect(valuesMatchForLog(0, '> 0')).toBe(false);
  });

  it('valuesMatchForLog treats descriptive expected labels as informational pass', () => {
    expect(valuesMatchForLog('ORDERED ON JUNE 05, 2026', 'ORDERED ON (today)')).toBe(true);
  });

  it('logActualExpected prints red ANSI when values mismatch', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logActualExpected('TC_X', 'Price', 1500, 1602);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('\x1b[31m'));
    expect(spy.mock.calls[0]?.[0]).toContain('Actual: 1500');
  });

  it('logActualExpected omits red when values match', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logActualExpected('TC_X', 'Price', 1602, 1602);
    expect(spy.mock.calls[0]?.[0]).not.toContain('\x1b[31m');
  });

  it('createTestCaseLogger prefixes step numbers', () => {
    const log = createTestCaseLogger('TC_SHOP_001');
    expect(log.stepId()).toBe('TC_SHOP_001');
    expect(log.stepId(5)).toBe('TC_SHOP_001_5');
  });

  it('createTestCaseLogger is a no-op when testCaseId is omitted', () => {
    const log = createTestCaseLogger();
    expect(log.id).toBe('');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.get('label', 'details');
    expect(spy).not.toHaveBeenCalled();
  });
});
