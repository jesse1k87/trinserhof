import { Invoice } from '@trinserhof/types';

// Mirrors the shape enforced by invoiceSchema, so a rejected write can be
// reported back with the specific field(s) that failed instead of just
// "PERMISSION_DENIED".
export const REQUIRED_INVOICE_FIELD_TYPES: Record<string, 'string'> = {
  id: 'string',
  number: 'string',
  created: 'string',
  customerId: 'string',
};

export const getInvoiceValidationErrors = (invoice: Invoice): string[] => {
  const errors = Object.entries(REQUIRED_INVOICE_FIELD_TYPES).reduce<string[]>(
    (errors, [field, type]) => {
      const value = (invoice as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is missing`);
      } else if (typeof value !== type) {
        errors.push(`${field} must be a ${type} (got ${typeof value})`);
      }
      return errors;
    },
    [],
  );

  if (!Array.isArray(invoice.bookingIds)) {
    errors.push('bookingIds must be an array');
  }

  if (!Array.isArray(invoice.products)) {
    errors.push('products must be an array');
  }

  return errors;
};
