import * as React from 'react';
import { getDb, type Invoice as InvoiceRow } from '@trinserhof/supabase';
import { Invoice, InvoiceProduct } from '@trinserhof/types';

const toInvoice = (row: InvoiceRow): Invoice => ({
  id: row.id,
  number: row.number,
  created: row.created.toISOString().slice(0, 10),
  customerId: row.customerId,
  bookingIds: row.bookingIds,
  products: row.products as unknown as InvoiceProduct[],
  notes: row.notes ?? undefined,
});

const useInvoices = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .invoice.findMany()
      .then((rows: InvoiceRow[]) => {
        if (active) {
          setInvoices(rows.map(toInvoice));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return invoices;
};

export default useInvoices;
