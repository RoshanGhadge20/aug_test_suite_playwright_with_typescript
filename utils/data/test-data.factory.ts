import { randomUUID } from 'crypto';

export const TestDataFactory = {
  email(prefix = 'user'): string {
    return `${prefix}-${randomUUID().slice(0, 8)}@augmont.test`;
  },
  phone(): string {
    const first = 6 + Math.floor(Math.random() * 4);
    let rest = '';
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
    return `${first}${rest}`;
  },
  password(length = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  },
  user(opts: { prefix?: string } = {}) {
    return {
      email: this.email(opts.prefix),
      password: this.password(),
      phone: this.phone(),
      firstName: 'Test',
      lastName: 'User',
    };
  },
  mobile(): string {
    return this.phone();
  },
  pan(): string {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letters = (n: number) => Array.from({ length: n }, () => L[Math.floor(Math.random() * 26)]).join('');
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    return `${letters(5)}${digits}${letters(1)}`;
  },
  /** Random 12-digit, format-only Aadhaar-shaped number (real Aadhaar never starts with 0 or 1). */
  aadhaar(): string {
    let out = String(2 + Math.floor(Math.random() * 8));
    for (let i = 0; i < 11; i++) out += Math.floor(Math.random() * 10);
    return out;
  },
  stamp(): string {
    return `_${randomUUID().slice(0, 8)}`;
  },
  idNumber(length = 6): string {
    let out = '';
    for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
    return out;
  },

  /** Unique coupon code for admin API (e.g. SINa1b2c3d4). */
  couponCode(prefix = 'SIN'): string {
    return `${prefix}${randomUUID().replace(/-/g, '').slice(0, 8)}`;
  },
};
