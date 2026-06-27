import { describe, expect, it } from 'vitest';
import { type Invoice } from '@trinserhof/types';
import { getInvoiceValidationErrors } from './getInvoiceValidationErrors';

const validInvoice: Invoice = {
  id: 'inv-1',
  number: 'TRH-2026-ABC123',
  created: '2026-06-27',
  customerId: 'cust-1',
  bookingIds: [],
};

describe('getInvoiceValidationErrors', () => {
  it('returns no errors for a valid invoice', () => {
    expect(getInvoiceValidationErrors(validInvoice)).toEqual([]);
  });

  it('returns no errors for an invoice linked to several bookings', () => {
    expect(getInvoiceValidationErrors({ ...validInvoice, bookingIds: ['b1', 'b2', 'b3'] })).toEqual(
      [],
    );
  });

  it('flags a missing customer', () => {
    const errors = getInvoiceValidationErrors({ ...validInvoice, customerId: '' });
    expect(errors).toContain('customerId is missing');
  });

  it('flags a missing invoice number', () => {
    const errors = getInvoiceValidationErrors({ ...validInvoice, number: '' });
    expect(errors).toContain('number is missing');
  });

  it('flags a non-array bookingIds', () => {
    const errors = getInvoiceValidationErrors({
      ...validInvoice,
      bookingIds: undefined as unknown as string[],
    });
    expect(errors).toContain('bookingIds must be an array');
  });
});
