import * as React from 'react';
import { getSupabaseClient, type Invoice as InvoiceRow } from '@trinserhof/supabase';
import { Invoice, InvoiceProduct } from '@trinserhof/types';

const toInvoice = (row: InvoiceRow): Invoice => ({
  id: row.id,
  number: row.number,
  created: row.created,
  customerId: row.customerId,
  bookingIds: row.bookingIds,
  products: row.products as unknown as InvoiceProduct[],
  notes: row.notes ?? undefined,
});

const useInvoices = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('Invoice').select('*'))
      .then(({ data, error }: { data: InvoiceRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setInvoices((data ?? []).map(toInvoice));
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
