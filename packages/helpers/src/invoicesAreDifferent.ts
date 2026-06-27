import { Invoice } from '@trinserhof/types';

export const invoicesAreDifferent = (a: Invoice, b: Invoice) => {
  const properties: Array<keyof Invoice> = ['number', 'created', 'customerId', 'notes'];

  if (JSON.stringify(a.bookingIds ?? []) !== JSON.stringify(b.bookingIds ?? [])) {
    return true;
  }

  if (JSON.stringify(a.products ?? []) !== JSON.stringify(b.products ?? [])) {
    return true;
  }

  return properties.some((property) => (a[property] ?? '') !== (b[property] ?? ''));
};
