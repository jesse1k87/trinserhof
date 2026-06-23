import { describe, expect, it } from 'vitest';
import { Booking } from '@trinserhof/types';
import { stripBookingCustomerData } from './stripBookingCustomerData';

// Only a handful of fields matter; build minimal booking-shaped objects and cast
// rather than spelling out every required Booking field.
const booking = (b: Partial<Booking>): Booking => b as Booking;

describe('stripBookingCustomerData', () => {
  it('removes customer data from a booking that is linked to a customer', () => {
    const result = stripBookingCustomerData({
      b1: booking({
        id: 'b1',
        email: 'anna@example.com',
        phone: '123',
        name: 'Anna',
        customers: ['c1'],
      }),
    });

    expect(result.summary).toEqual({
      totalBookings: 1,
      changedCount: 1,
      skippedUnlinkedCount: 0,
    });
    expect(result.bookingFieldRemovals).toEqual({
      b1: { email: null, phone: null, name: null },
    });
    expect(result.reviewFlags).toEqual([]);
  });

  it('strips the legacy contact field too', () => {
    const result = stripBookingCustomerData({
      b1: booking({ id: 'b1', contact: 'legacy@example.com', customers: ['c1'] }),
    });

    expect(result.bookingFieldRemovals).toEqual({ b1: { contact: null } });
  });

  it('leaves a booking with customer data but no customer link untouched and flags it', () => {
    const result = stripBookingCustomerData({
      b1: booking({ id: 'b1', email: 'anna@example.com', name: 'Anna' }),
    });

    expect(result.summary).toEqual({
      totalBookings: 1,
      changedCount: 0,
      skippedUnlinkedCount: 1,
    });
    expect(result.bookingFieldRemovals).toEqual({});
    expect(result.reviewFlags).toHaveLength(1);
    expect(result.reviewFlags[0].bookingId).toBe('b1');
  });

  it('treats an empty customers array as no link', () => {
    const result = stripBookingCustomerData({
      b1: booking({ id: 'b1', email: 'anna@example.com', customers: [] }),
    });

    expect(result.summary.changedCount).toBe(0);
    expect(result.summary.skippedUnlinkedCount).toBe(1);
  });

  it('skips bookings that have no customer data (idempotent)', () => {
    const result = stripBookingCustomerData({
      b1: booking({ id: 'b1', customers: ['c1'] }),
    });

    expect(result.summary).toEqual({
      totalBookings: 1,
      changedCount: 0,
      skippedUnlinkedCount: 0,
    });
    expect(result.bookingFieldRemovals).toEqual({});
    expect(result.reviewFlags).toEqual([]);
  });

  it('only removes the customer fields that are actually present', () => {
    const result = stripBookingCustomerData({
      b1: booking({ id: 'b1', email: 'anna@example.com', customers: ['c1'] }),
    });

    expect(result.bookingFieldRemovals).toEqual({ b1: { email: null } });
  });
});
