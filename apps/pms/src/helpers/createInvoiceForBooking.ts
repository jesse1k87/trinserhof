import { Booking, Invoice } from '@trinserhof/types';
import { getNewInvoice } from '@trinserhof/helpers';
import { logAuditEvent, saveInvoice } from '@trinserhof/database';

export const createInvoiceForBooking = async (
  booking: Booking,
  email?: string | null,
): Promise<Invoice> => {
  const invoice = await saveInvoice({
    ...getNewInvoice(),
    bookingIds: [booking.id],
    customerId: booking.customers[0] ?? '',
  });
  logAuditEvent('INVOICE_CREATED', email);
  return invoice;
};
