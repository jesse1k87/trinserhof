import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Booking } from '@bookings/types';

const { initializeApp, getApps } = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [] as unknown[]),
}));

const { getDatabase, ref, set } = vi.hoisted(() => ({
  getDatabase: vi.fn(() => 'mock-db'),
  ref: vi.fn((db: string, path: string) => ({ db, path })),
  set: vi.fn(async () => undefined),
}));

vi.mock('firebase/app', () => ({ initializeApp, getApps }));
vi.mock('firebase/database', () => ({ getDatabase, ref, set }));

const { upsertBooking } = await import('./firebase');

const booking: Booking = {
  id: 'mews-123',
  email: 'guest@example.com',
  checkIn: '2026-07-01',
  checkOut: '2026-07-05',
  status: 'CONFIRMED',
  roomId: '101',
  channel: 'MEWS',
  adults: 2,
  children: 0,
  babies: 0,
  pets: 0,
  price: 400,
  priceFixed: '0',
  name: 'Guest Name',
  className: '',
  contact: '',
  content: '',
  deleted: false,
  end: '',
  group: '',
  start: '',
  updated: '',
};

describe('upsertBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApps.mockReturnValue([]);
  });

  it('initializes the firebase app from env vars on first call', async () => {
    await upsertBooking(booking);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it('does not re-initialize the firebase app if one already exists', async () => {
    getApps.mockReturnValue([{}]);
    await upsertBooking(booking);
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('writes the booking to bookings/<id>', async () => {
    await upsertBooking(booking);
    expect(ref).toHaveBeenCalledWith('mock-db', 'bookings/mews-123');
    expect(set).toHaveBeenCalledWith({ db: 'mock-db', path: 'bookings/mews-123' }, booking);
  });

  it('returns the booking', async () => {
    const result = await upsertBooking(booking);
    expect(result).toBe(booking);
  });
});
