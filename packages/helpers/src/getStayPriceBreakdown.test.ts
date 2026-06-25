import { describe, expect, it } from 'vitest';
import { Prices } from '@trinserhof/types';
import { getRoomTypePriceForDate, getStayPriceBreakdown } from './getStayPriceBreakdown';

const prices: Prices = {
  base: { STANDARD: 100, SUITE: 200 },
  overrides: {
    '2026-07-02': { STANDARD: 150 },
    '2026-07-03': { SUITE: 250 },
  },
};

describe('getRoomTypePriceForDate', () => {
  it('returns the base price when no override exists', () => {
    expect(getRoomTypePriceForDate(prices, 'STANDARD', '2026-07-01')).toEqual({
      price: 100,
      isOverride: false,
    });
  });

  it('returns the override when one exists', () => {
    expect(getRoomTypePriceForDate(prices, 'STANDARD', '2026-07-02')).toEqual({
      price: 150,
      isOverride: true,
    });
  });

  it('returns undefined when neither base nor override is set', () => {
    expect(getRoomTypePriceForDate(prices, 'FAMILY', '2026-07-01')).toEqual({
      price: undefined,
      isOverride: false,
    });
  });
});

describe('getStayPriceBreakdown', () => {
  it('sums base prices across the charged nights (check-out excluded)', () => {
    const result = getStayPriceBreakdown(prices, 'SUITE', '2026-07-01', '2026-07-03');
    expect(result.total).toBe(400);
    expect(result.nights).toHaveLength(2);
    expect(result.hasOverride).toBe(false);
    expect(result.hasUnknownPrice).toBe(false);
  });

  it('applies per-night overrides within the range', () => {
    const result = getStayPriceBreakdown(prices, 'STANDARD', '2026-07-01', '2026-07-04');
    expect(result.total).toBe(350);
    expect(result.hasOverride).toBe(true);
    expect(result.nights).toEqual([
      { date: '2026-07-01', price: 100, isOverride: false },
      { date: '2026-07-02', price: 150, isOverride: true },
      { date: '2026-07-03', price: 100, isOverride: false },
    ]);
  });

  it('flags nights with no known price and excludes them from the total', () => {
    const result = getStayPriceBreakdown(prices, 'FAMILY', '2026-07-01', '2026-07-03');
    expect(result.total).toBe(0);
    expect(result.hasUnknownPrice).toBe(true);
    expect(result.nights).toHaveLength(2);
  });

  it('returns an empty breakdown when the room type is undefined', () => {
    const result = getStayPriceBreakdown(prices, undefined, '2026-07-01', '2026-07-04');
    expect(result).toEqual({ nights: [], total: 0, hasOverride: false, hasUnknownPrice: false });
  });

  it('returns a zero total for a zero-night range', () => {
    const result = getStayPriceBreakdown(prices, 'STANDARD', '2026-07-01', '2026-07-01');
    expect(result.total).toBe(0);
    expect(result.nights).toHaveLength(0);
  });
});
