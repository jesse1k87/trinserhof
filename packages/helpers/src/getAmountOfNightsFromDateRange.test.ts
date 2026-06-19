import { describe, expect, it } from 'vitest';
import { getAmountOfNightsFromDateRange } from './getAmountOfNightsFromDateRange';

describe('getAmountOfNightsFromDateRange', () => {
  it('returns 0 when dateRange is undefined', () => {
    expect(getAmountOfNightsFromDateRange(undefined)).toBe(0);
  });

  it('returns 0 when from is missing', () => {
    expect(getAmountOfNightsFromDateRange({ from: undefined, to: new Date(2026, 6, 5) })).toBe(0);
  });

  it('returns 0 when to is missing', () => {
    expect(getAmountOfNightsFromDateRange({ from: new Date(2026, 6, 1), to: undefined })).toBe(0);
  });

  it('returns the number of nights between two dates', () => {
    expect(
      getAmountOfNightsFromDateRange({ from: new Date(2026, 6, 1), to: new Date(2026, 6, 5) }),
    ).toBe(4);
  });

  it('returns 0 for the same day', () => {
    const date = new Date(2026, 6, 1);
    expect(getAmountOfNightsFromDateRange({ from: date, to: date })).toBe(0);
  });
});
