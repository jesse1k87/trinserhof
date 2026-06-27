import { z } from 'zod';

// A single product added to an invoice. The product (and its current price) is
// resolved from the `products` collection via `productId`; only the chosen
// quantity and the moment it was added to the invoice are stored here. `addedAt`
// is a full ISO timestamp so entries can be shown in the exact order they were
// added (chronological, oldest first).
export type InvoiceProduct = {
  productId: string;
  quantity: number;
  addedAt: string; // ISO 8601 timestamp
};

// An invoice is a billing document linked to exactly one customer (the payer)
// and to zero or more bookings. Amounts shown on the invoice are derived from
// the linked bookings, so only the links (and the invoice's own metadata) are
// stored here. Products added directly to the invoice are stored in `products`.
export type Invoice = {
  id: string;
  number: string;
  created: string; // YYYY-MM-DD
  customerId: string;
  bookingIds: string[];
  products: InvoiceProduct[];
  notes?: string;
};

export const invoiceProductSchema = z.object({
  productId: z.string({ message: 'Invalid product' }).trim().min(1),
  quantity: z.number().int().positive(),
  addedAt: z.string().min(1),
});

export const invoiceSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  number: z.string({ message: 'Invalid invoice number' }).trim().min(1),
  created: z.string().date(),
  customerId: z.string({ message: 'Invalid customer' }).trim().min(1),
  bookingIds: z.array(z.string().trim().min(1)),
  products: z.array(invoiceProductSchema),
  notes: z.string().trim().optional(),
});
