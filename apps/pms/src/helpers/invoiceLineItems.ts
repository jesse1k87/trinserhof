import { Booking, Invoice, Product } from '@trinserhof/types';
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
  amountOfPeople: number;
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
        amountOfPeople: 0,
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
      amountOfPeople: booking.adults + booking.children,
      amount: nights * pricePerNight,
    };
  });

// One product line on an invoice, derived from an entry in `invoice.products`.
// The product's name and unit price are resolved live from the products
// collection; `addedAt` records when the entry was added so the invoice can
// list them in chronological order (oldest first).
export type InvoiceProductLineItem = {
  productId: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  addedAt: string;
};

export const getInvoiceProductLineItems = (
  invoice: Invoice,
  productsById: Map<string, Product>,
): InvoiceProductLineItem[] =>
  (invoice.products ?? [])
    .map((entry) => {
      const product = productsById.get(entry.productId);
      const unitPrice = product?.price ?? 0;

      return {
        productId: entry.productId,
        product,
        description: product?.name ?? 'Unknown product',
        quantity: entry.quantity,
        unitPrice,
        amount: entry.quantity * unitPrice,
        addedAt: entry.addedAt,
      };
    })
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));

export const getInvoiceTotal = (
  invoice: Invoice,
  bookingsById: Map<string, Booking>,
  productsById: Map<string, Product> = new Map(),
): number =>
  getInvoiceLineItems(invoice, bookingsById).reduce((sum, item) => sum + item.amount, 0) +
  getInvoiceProductLineItems(invoice, productsById).reduce((sum, item) => sum + item.amount, 0);
