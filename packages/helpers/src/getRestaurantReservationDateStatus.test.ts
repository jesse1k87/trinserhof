import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getRestaurantReservationDateStatus } from './getRestaurantReservationDateStatus';

beforeAll(() => {
  process.env.TZ = 'UTC';
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 25, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getRestaurantReservationDateStatus', () => {
  it('returns PAST for a start date before today', () => {
    expect(getRestaurantReservationDateStatus('2026-06-24T18:00:00')).toBe('PAST');
  });

  it('returns TODAY for a start date on today, regardless of time', () => {
    expect(getRestaurantReservationDateStatus('2026-06-25T08:00:00')).toBe('TODAY');
  });

  it('returns FUTURE for a start date after today', () => {
    expect(getRestaurantReservationDateStatus('2026-06-26T08:00:00')).toBe('FUTURE');
  });
});
