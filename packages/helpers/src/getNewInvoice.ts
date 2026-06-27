import { type Invoice } from '@trinserhof/types';
import { getYYYYmmDD } from './getYYYYmmDD';
import { uuidv4 } from './uuidv4';

// Derives a human-readable invoice number from the (stable) invoice id so it is
// unique and never changes once the invoice exists: e.g. TRH-2026-AB12CD.
const getInvoiceNumber = (id: string): string => {
  const suffix = id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `TRH-${new Date().getFullYear()}-${suffix}`;
};

export const getNewInvoice = (): Invoice => {
  const id = uuidv4();
  return {
    id,
    number: getInvoiceNumber(id),
    created: getYYYYmmDD(new Date()),
    customerId: '',
    bookingIds: [],
  };
};
