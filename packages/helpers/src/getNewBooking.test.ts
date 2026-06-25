import { describe, expect, it, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { getNewBooking } from './getNewBooking';

beforeAll(() => {
  process.env.TZ = 'UTC';
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 19));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getNewBooking', () => {
  it('defaults checkIn to today and checkOut two days later', () => {
    const booking = getNewBooking();
    expect(booking.checkIn).toBe('2026-06-19');
    expect(booking.checkOut).toBe('2026-06-21');
  });

  it('defaults guest counts', () => {
    const booking = getNewBooking();
    expect(booking.customers).toEqual([]);
    expect(booking.adults).toBe(1);
    expect(booking.children).toBe(0);
    expect(booking.pets).toBe(0);
  });
});
