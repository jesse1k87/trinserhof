import { Booking } from '@trinserhof/types';

// Customer-identifying fields that live directly on a booking. Once a booking
// references a customer record (via its `customers` array), these are redundant
// duplicates of data now owned by the `customers` node, so they get removed.
export const BOOKING_CUSTOMER_FIELDS = ['email', 'phone', 'name', 'contact'] as const;

export type StripCustomerDataReviewFlag = { bookingId: string; reason: string };

export type StripCustomerDataResult = {
  /**
   * bookingId -> { field: null } removals for bookings that are linked to a
   * customer and still carry customer data. Written as a multi-path update where
   * each null deletes that field from the booking.
   */
  bookingFieldRemovals: Record<string, Record<string, null>>;
  summary: {
    totalBookings: number;
    /** Bookings that had customer data removed. */
    changedCount: number;
    /** Bookings left untouched because they hold customer data but lack a customer link. */
    skippedUnlinkedCount: number;
  };
  /** Bookings with customer data but no customer link (left untouched), for manual review. */
  reviewFlags: StripCustomerDataReviewFlag[];
};

/**
 * Removes redundant customer data (email/phone/name/contact) from bookings once
 * the data lives in the `customers` node. Only touches bookings that already
 * reference a customer — a booking whose only copy of the contact details is on
 * itself is left untouched and flagged, so the migration can never lose data.
 *
 * Pure (no Firebase / no fs): given the current bookings map it returns the
 * field removals to write plus review flags. Run "Extract customers from
 * bookings" first so the data is safely stored elsewhere before stripping it.
 *
 * Idempotent: bookings with no remaining customer data are skipped.
 */
export const stripBookingCustomerData = (
  bookings: Record<string, Booking>,
): StripCustomerDataResult => {
  const bookingFieldRemovals: Record<string, Record<string, null>> = {};
  const reviewFlags: StripCustomerDataReviewFlag[] = [];
  let skippedUnlinkedCount = 0;

  for (const [bookingId, booking] of Object.entries(bookings)) {
    const record = booking as Record<string, unknown>;
    const presentFields = BOOKING_CUSTOMER_FIELDS.filter((field) => record[field] != null);
    if (presentFields.length === 0) continue;

    const hasCustomerLink = Array.isArray(booking.customers) && booking.customers.length > 0;
    if (!hasCustomerLink) {
      // Don't drop the only copy of this person's contact details.
      skippedUnlinkedCount++;
      reviewFlags.push({
        bookingId,
        reason: `Has customer data (${presentFields.join(
          ', ',
        )}) but no customer link; run "Extract customers from bookings" first. Left untouched.`,
      });
      continue;
    }

    const removals: Record<string, null> = {};
    for (const field of presentFields) {
      removals[field] = null;
    }
    bookingFieldRemovals[bookingId] = removals;
  }

  return {
    bookingFieldRemovals,
    summary: {
      totalBookings: Object.keys(bookings).length,
      changedCount: Object.keys(bookingFieldRemovals).length,
      skippedUnlinkedCount,
    },
    reviewFlags,
  };
};
