import { describe, expect, it, beforeAll } from 'vitest';
import { getYYYYmmDD } from './getYYYYmmDD';

// getYYYYmmDD reads local date components, so pin the runtime timezone to
// remove ambiguity between this and CI/dev machines.
beforeAll(() => {
  process.env.TZ = 'UTC';
});

describe('getYYYYmmDD', () => {
  it('formats a Date object with zero-padded month and day', () => {
    expect(getYYYYmmDD(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formats a Date object in December', () => {
    expect(getYYYYmmDD(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('parses and formats a date string', () => {
    expect(getYYYYmmDD('2026-07-01')).toBe('2026-07-01');
  });
});
