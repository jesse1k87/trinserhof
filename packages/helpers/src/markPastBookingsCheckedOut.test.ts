import { describe, expect, it } from 'vitest';
import { Booking } from '@trinserhof/types';
import { markPastBookingsCheckedOut } from './markPastBookingsCheckedOut';

// Build minimal booking-shaped objects and cast rather than spelling out every
// required Booking field (the function also reads OldBooking fields).
const booking = (b: Record<string, unknown>) => b as unknown as Booking;

const TODAY = '2026-06-23';

describe('markPastBookingsCheckedOut', () => {
  it('marks past CONFIRMED and PAID bookings as CHECKED_OUT', () => {
    const result = markPastBookingsCheckedOut(
      {
        confirmed: booking({ id: 'confirmed', checkOut: '2026-06-20', status: 'CONFIRMED' }),
        paid: booking({ id: 'paid', checkOut: '2026-06-01', status: 'PAID' }),
      },
      TODAY,
    );

    expect(result.changedBookings).toEqual({ confirmed: 'CHECKED_OUT', paid: 'CHECKED_OUT' });
    expect(result.summary).toEqual({
      totalBookings: 2,
      changedCount: 2,
      fromConfirmed: 1,
      fromPaid: 1,
    });
  });

  it('leaves future and same-day check-out bookings untouched', () => {
    const result = markPastBookingsCheckedOut(
      {
        future: booking({ id: 'future', checkOut: '2026-07-01', status: 'CONFIRMED' }),
        today: booking({ id: 'today', checkOut: TODAY, status: 'PAID' }),
      },
      TODAY,
    );

    expect(result.changedBookings).toEqual({});
    expect(result.summary.changedCount).toBe(0);
  });

  it('ignores past bookings in other statuses', () => {
    const result = markPastBookingsCheckedOut(
      {
        pending: booking({ id: 'pending', checkOut: '2026-06-01', status: 'PENDING' }),
        cancelled: booking({ id: 'cancelled', checkOut: '2026-06-01', status: 'CANCELLED' }),
        alreadyOut: booking({ id: 'alreadyOut', checkOut: '2026-06-01', status: 'CHECKED_OUT' }),
      },
      TODAY,
    );

    expect(result.changedBookings).toEqual({});
    expect(result.summary.changedCount).toBe(0);
  });

  it('matches legacy shapes (lowercase status, only `end` set)', () => {
    const result = markPastBookingsCheckedOut(
      {
        legacy: booking({ id: 'legacy', end: '2026-06-10T00:00:00.000Z', status: 'confirmed' }),
      },
      TODAY,
    );

    expect(result.changedBookings).toEqual({ legacy: 'CHECKED_OUT' });
    expect(result.summary.fromConfirmed).toBe(1);
  });
});
