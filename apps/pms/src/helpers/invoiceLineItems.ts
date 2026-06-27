import { Booking, Invoice } from '@trinserhof/types';
import { getAmountOfNightsFromDateRange } from '@trinserhof/helpers';

// One billable line on an invoice, derived from a linked booking. Amounts are
// computed from the booking's stored nightly price and stay length rather than
// stored on the invoice, so an invoice always reflects its linked bookings.
export type InvoiceLineItem = {
  bookingId: string;
  booking?: Booking;
  description: string;
  nights: number;
  pricePerNight: number;
  amount: number;
};

const getNights = (booking: Booking): number =>
  getAmountOfNightsFromDateRange({
    from: booking.checkIn ? new Date(booking.checkIn) : undefined,
    to: booking.checkOut ? new Date(booking.checkOut) : undefined,
  });

export const getInvoiceLineItems = (
  invoice: Invoice,
  bookingsById: Map<string, Booking>,
): InvoiceLineItem[] =>
  (invoice.bookingIds ?? []).map((bookingId) => {
    const booking = bookingsById.get(bookingId);

    if (!booking) {
      return {
        bookingId,
        description: 'Unknown booking',
        nights: 0,
        pricePerNight: 0,
        amount: 0,
      };
    }

    const nights = getNights(booking);
    const pricePerNight = booking.pricePerNight ?? 0;
    const room = booking.roomId ? `Room ${booking.roomId}` : 'Unassigned room';

    return {
      bookingId,
      booking,
      description: `${room} · ${booking.checkIn} – ${booking.checkOut}`,
      nights,
      pricePerNight,
      amount: nights * pricePerNight,
    };
  });

export const getInvoiceTotal = (invoice: Invoice, bookingsById: Map<string, Booking>): number =>
  getInvoiceLineItems(invoice, bookingsById).reduce((sum, item) => sum + item.amount, 0);
