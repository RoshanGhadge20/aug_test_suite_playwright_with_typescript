import { describe, it, expect } from 'vitest';
import { TestDataFactory } from '../../utils/data/test-data.factory';

describe('TestDataFactory', () => {
  it('generates a unique email each call', () => {
    const a = TestDataFactory.email();
    const b = TestDataFactory.email();
    expect(a).not.toBe(b);
    expect(a).toMatch(/@augmont\.test$/);
  });

  it('generates a phone number with 10 digits', () => {
    expect(TestDataFactory.phone()).toMatch(/^[6-9]\d{9}$/);
  });

  it('generates a user payload with deterministic prefix when passed', () => {
    const u = TestDataFactory.user({ prefix: 'smoke' });
    expect(u.email.startsWith('smoke-')).toBe(true);
    expect(u.password.length).toBeGreaterThanOrEqual(8);
  });
});

describe('admin data generators', () => {
  it('mobile is 10 digits starting 6-9', () => {
    expect(TestDataFactory.mobile()).toMatch(/^[6-9]\d{9}$/);
  });
  it('pan matches AAAAA9999A shape', () => {
    expect(TestDataFactory.pan()).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);
  });
  it('stamp is unique-ish and filename-safe', () => {
    expect(TestDataFactory.stamp()).toMatch(/^_[A-Za-z0-9_]+$/);
  });
});
