import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getTableReservationDateStatus } from './getTableReservationDateStatus';

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

describe('getTableReservationDateStatus', () => {
  it('returns PAST for a start date before today', () => {
    expect(getTableReservationDateStatus('2026-06-24T18:00:00')).toBe('PAST');
  });

  it('returns TODAY for a start date on today, regardless of time', () => {
    expect(getTableReservationDateStatus('2026-06-25T08:00:00')).toBe('TODAY');
  });

  it('returns FUTURE for a start date after today', () => {
    expect(getTableReservationDateStatus('2026-06-26T08:00:00')).toBe('FUTURE');
  });
});
