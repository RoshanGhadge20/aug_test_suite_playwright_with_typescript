import { describe, it, expect } from 'vitest';
import { computeBackendApiSignature } from '../../api-services/core/backend-api-signature';

const SECRET =
  '3056301006072a8648ce3d020106052b8104000a0342000499c5f442c3264bcdfb093b0bc820e3f0f6546972856ebec2f8ccc03f49abdb47ffcfcaf4f37e0ec53050760e74014767e30a8a3e891f4db8c83fa27627898f15';

describe('computeBackendApiSignature', () => {
  it('returns 64-char hex for GET', () => {
    const sig = computeBackendApiSignature(
      'GET',
      '/api/coupons?search=&from=1&to=25&type=single',
      undefined,
      SECRET,
    );
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns 64-char hex for POST', () => {
    const sig = computeBackendApiSignature('POST', '/api/coupons', { code: 'SIN123' }, SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});
