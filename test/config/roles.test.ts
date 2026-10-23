import { describe, it, expect } from 'vitest';
import { ADMIN_ROLES, isAdminRole, roleMobileKey } from '../../config/roles';

describe('admin roles', () => {
  it('lists the five roles', () => {
    expect([...ADMIN_ROLES]).toEqual(['admin', 'appraiser', 'bm', 'ops', 'partner']);
  });
  it('type-guards role names', () => {
    expect(isAdminRole('ops')).toBe(true);
    expect(isAdminRole('nope')).toBe(false);
  });
  it('builds the mobile env key for a role and prefix', () => {
    expect(roleMobileKey('bm', 'TEST')).toBe('TEST_ADMIN_BM_MOBILE');
  });
});
