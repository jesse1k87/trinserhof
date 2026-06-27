import { z } from 'zod';

// An invoice is a billing document linked to exactly one customer (the payer)
// and to zero or more bookings. Amounts shown on the invoice are derived from
// the linked bookings, so only the links (and the invoice's own metadata) are
// stored here.
export type Invoice = {
  id: string;
  number: string;
  created: string; // YYYY-MM-DD
  customerId: string;
  bookingIds: string[];
  notes?: string;
};

export const invoiceSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  number: z.string({ message: 'Invalid invoice number' }).trim().min(1),
  created: z.string().date(),
  customerId: z.string({ message: 'Invalid customer' }).trim().min(1),
  bookingIds: z.array(z.string().trim().min(1)),
  notes: z.string().trim().optional(),
});
