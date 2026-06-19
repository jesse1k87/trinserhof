import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

// de-AT formats currency with a non-breaking space (U+00A0) between the symbol and amount.
const nbsp = '\u00A0';

describe('formatCurrency', () => {
  it('formats whole amounts with 2 decimal places by default', () => {
    expect(formatCurrency(100)).toBe(`€${nbsp}100,00`);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe(`€${nbsp}0,00`);
  });

  it('respects a custom maximumFractionDigits', () => {
    expect(formatCurrency(25, 0)).toBe(`€${nbsp}25`);
  });
});
