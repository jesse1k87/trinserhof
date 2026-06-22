import { Booking, defaultRoomId } from '@trinserhof/types';
import { makeBookingBackwardsCompatible } from './makeBookingBackwardsCompatible';
import { mergeLegacyNotes } from './mergeLegacyNotes';
import { bookingsAreDifferent } from './bookingsAreDifferent';
import { REQUIRED_BOOKING_FIELD_TYPES } from './getBookingValidationErrors';

// Fields that only exist on the old booking schema; once a booking has been
// mapped onto the current schema these are pure clutter and get dropped.
const LEGACY_KEYS = [
  'start',
  'end',
  'group',
  'contact',
  'content',
  'className',
  'created',
  'updated',
  'deleted',
  'createdBy',
  'updatedBy',
  'editable',
] as const;

export type CleanupReviewFlag = { bookingId: string; reason: string };

export type CleanupBookingsResult = {
  /** Bookings that need rewriting (already mapped to the current schema), keyed by id. */
  changedBookings: Record<string, Booking>;
  summary: { totalBookings: number; changedCount: number };
  /** Best-guess defaults applied that are worth a human glancing at. */
  reviewFlags: CleanupReviewFlag[];
};

const hasLegacyKeys = (booking: Record<string, unknown>) => LEGACY_KEYS.some((key) => key in booking);

const stripLegacyKeys = (booking: Booking): Booking => {
  const cleaned: Record<string, unknown> = { ...booking };
  for (const key of LEGACY_KEYS) {
    delete cleaned[key];
  }
  return cleaned as Booking;
};

// Belt-and-suspenders: forces a type-appropriate default for any field still
// invalid after mapping, so a single unanticipated shape can never again block
// the atomic multi-booking write the way the original PERMISSION_DENIED did.
const forceRequiredDefaults = (booking: Booking): Booking => {
  const result: Record<string, unknown> = { ...booking };
  for (const [field, type] of Object.entries(REQUIRED_BOOKING_FIELD_TYPES)) {
    const value = result[field];
    if (value === undefined || value === null || typeof value !== type) {
      result[field] = type === 'string' ? '' : type === 'number' ? 0 : false;
    }
  }
  return result as Booking;
};

export const cleanupLegacyBookings = (bookings: Record<string, Booking>): CleanupBookingsResult => {
  const changedBookings: Record<string, Booking> = {};
  const reviewFlags: CleanupReviewFlag[] = [];

  for (const [bookingId, original] of Object.entries(bookings)) {
    const mapped = makeBookingBackwardsCompatible(original);
    const cleaned = forceRequiredDefaults(stripLegacyKeys({ ...mapped, notes: mergeLegacyNotes(mapped) }));

    if (original.roomId !== cleaned.roomId && cleaned.roomId === defaultRoomId) {
      reviewFlags.push({
        bookingId,
        reason: `roomId "${original.roomId ?? original.group ?? ''}" was not a recognized room; defaulted to unassigned.`,
      });
    }
    if (!original.status && cleaned.status === 'NO_STATUS') {
      reviewFlags.push({ bookingId, reason: 'status was missing or empty; defaulted to NO_STATUS.' });
    }

    const needsUpdate =
      bookingsAreDifferent(original, cleaned) || hasLegacyKeys(original as Record<string, unknown>);
    if (needsUpdate) {
      changedBookings[bookingId] = cleaned;
    }
  }

  return {
    changedBookings,
    summary: {
      totalBookings: Object.keys(bookings).length,
      changedCount: Object.keys(changedBookings).length,
    },
    reviewFlags,
  };
};
