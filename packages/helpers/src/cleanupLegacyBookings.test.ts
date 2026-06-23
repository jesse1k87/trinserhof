import { describe, expect, it } from 'vitest';
import { Booking } from '@trinserhof/types';
import { cleanupLegacyBookings } from './cleanupLegacyBookings';

// The function reads OldBooking fields too; build minimal booking-shaped
// objects and cast rather than spelling out every required Booking field.
const booking = (b: Record<string, unknown>) => b as unknown as Booking;

describe('cleanupLegacyBookings', () => {
  it('fully repairs a fully-legacy booking', () => {
    const result = cleanupLegacyBookings({
      b1: booking({
        id: 'b1',
        email: 'a@example.com',
        start: '2026-06-19T00:00:00.000Z',
        end: '2026-06-21T00:00:00.000Z',
        group: 114,
        contact: 'phone: 12345',
        content: 'Anna',
        status: 'confirmed',
      }),
    });

    expect(result.summary).toEqual({ totalBookings: 1, changedCount: 1 });
    const cleaned = result.changedBookings.b1;
    expect(cleaned.checkIn).toBe('2026-06-19');
    expect(cleaned.checkOut).toBe('2026-06-21');
    expect(cleaned.roomId).toBe('114');
    expect(cleaned.status).toBe('CONFIRMED');
    expect(cleaned.notes).toBe('phone: 12345 Anna');
    expect(cleaned).not.toHaveProperty('start');
    expect(cleaned).not.toHaveProperty('end');
    expect(cleaned).not.toHaveProperty('group');
    expect(cleaned).not.toHaveProperty('contact');
    expect(cleaned).not.toHaveProperty('content');
  });

  it('strips a stray legacy key even when every visible field already matches', () => {
    const result = cleanupLegacyBookings({
      b1: booking({
        id: 'b1',
        email: 'a@example.com',
        checkIn: '2026-06-19',
        checkOut: '2026-06-21',
        status: 'CONFIRMED',
        roomId: '114',
        channel: 'AIRBNB',
        adults: 2,
        children: 0,
        babies: 0,
        pets: 0,
        price: 200,
        priceFixed: '200',
        halbpension: true,
        notes: 'note',
        name: 'Anna',
        deleted: false,
      }),
    });

    expect(result.summary.changedCount).toBe(1);
    expect(result.changedBookings.b1).not.toHaveProperty('deleted');
  });

  it('does not flag a roomId of "119" stored directly (deterministic remap)', () => {
    const result = cleanupLegacyBookings({
      b1: booking({ id: 'b1', email: 'a@example.com', roomId: '120', status: 'CONFIRMED' }),
    });

    expect(result.changedBookings.b1.roomId).toBe('120');
    expect(result.reviewFlags).toEqual([]);
  });

  it('flags a non-room group value', () => {
    const result = cleanupLegacyBookings({
      b1: booking({ id: 'b1', email: 'a@example.com', group: 'Jesse', status: 'CONFIRMED' }),
    });

    expect(result.changedBookings.b1.roomId).toBe('0');
    expect(result.reviewFlags).toHaveLength(1);
    expect(result.reviewFlags[0]).toMatchObject({ bookingId: 'b1' });
    expect(result.reviewFlags[0].reason).toMatch(/roomId/);
  });

  it('flags an empty or missing status', () => {
    const result = cleanupLegacyBookings({
      b1: booking({ id: 'b1', email: 'a@example.com', roomId: '114', status: '' }),
      b2: booking({ id: 'b2', email: 'a@example.com', roomId: '114' }),
    });

    expect(result.reviewFlags).toHaveLength(2);
    expect(result.reviewFlags.every((f) => /status/.test(f.reason))).toBe(true);
  });

  it('is idempotent: re-running over the changed output yields no further changes', () => {
    const first = cleanupLegacyBookings({
      b1: booking({
        id: 'b1',
        email: 'a@example.com',
        start: '2026-06-19T00:00:00.000Z',
        end: '2026-06-21T00:00:00.000Z',
        group: 114,
        status: 'confirmed',
      }),
    });

    const second = cleanupLegacyBookings(first.changedBookings);

    expect(second.summary.changedCount).toBe(0);
    expect(second.changedBookings).toEqual({});
  });
});
