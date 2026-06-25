import { describe, expect, it } from 'vitest';
import { getNightsInDateRange } from './getNightsInDateRange';

describe('getNightsInDateRange', () => {
  it('returns one entry per night, check-out exclusive', () => {
    expect(getNightsInDateRange('2026-07-01', '2026-07-04')).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ]);
  });

  it('returns a single night for a one-night stay', () => {
    expect(getNightsInDateRange('2026-07-01', '2026-07-02')).toEqual(['2026-07-01']);
  });

  it('returns an empty array when check-in equals check-out', () => {
    expect(getNightsInDateRange('2026-07-01', '2026-07-01')).toEqual([]);
  });

  it('returns an empty array when check-out is before check-in', () => {
    expect(getNightsInDateRange('2026-07-05', '2026-07-01')).toEqual([]);
  });

  it('crosses month boundaries', () => {
    expect(getNightsInDateRange('2026-07-30', '2026-08-02')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ]);
  });

  it('handles a leap day', () => {
    expect(getNightsInDateRange('2024-02-28', '2024-03-01')).toEqual(['2024-02-28', '2024-02-29']);
  });

  it('returns an empty array for malformed dates', () => {
    expect(getNightsInDateRange('not-a-date', '2026-07-02')).toEqual([]);
  });
});
