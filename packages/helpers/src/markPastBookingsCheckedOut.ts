import { Booking } from '@trinserhof/types';
import { makeBookingBackwardsCompatible } from './makeBookingBackwardsCompatible';
import { getYYYYmmDD } from './getYYYYmmDD';

export type CheckedOutResult = {
  /** bookingId -> the status it would be changed to ('CHECKED_OUT'). */
  changedBookings: Record<string, 'CHECKED_OUT'>;
  summary: {
    totalBookings: number;
    changedCount: number;
    /** How many of the changed bookings were CONFIRMED vs. PAID before. */
    fromConfirmed: number;
    fromPaid: number;
  };
};

/**
 * Migration: marks past CONFIRMED and PAID bookings as CHECKED_OUT.
 *
 * A booking is "past" when its check-out date is strictly before `today`
 * (YYYY-MM-DD) — i.e. the guest has already left. Status and check-out are read
 * through makeBookingBackwardsCompatible so legacy shapes (e.g. lowercase
 * `confirmed`, or only `end` set) are matched too. Idempotent: bookings already
 * CHECKED_OUT (or in any other status) are left untouched.
 */
export const markPastBookingsCheckedOut = (
  bookings: Record<string, Booking>,
  today: string,
): CheckedOutResult => {
  const changedBookings: Record<string, 'CHECKED_OUT'> = {};
  let fromConfirmed = 0;
  let fromPaid = 0;

  for (const [bookingId, original] of Object.entries(bookings)) {
    const mapped = makeBookingBackwardsCompatible(original);

    if (!mapped.checkOut) continue;
    if (getYYYYmmDD(mapped.checkOut) >= today) continue;

    if (mapped.status !== 'CONFIRMED' && mapped.status !== 'PAID') continue;

    changedBookings[bookingId] = 'CHECKED_OUT';
    if (mapped.status === 'CONFIRMED') fromConfirmed += 1;
    else fromPaid += 1;
  }

  return {
    changedBookings,
    summary: {
      totalBookings: Object.keys(bookings).length,
      changedCount: Object.keys(changedBookings).length,
      fromConfirmed,
      fromPaid,
    },
  };
};
