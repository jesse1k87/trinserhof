import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Invoice } from '@trinserhof/types';

const useInvoices = () => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'invoices'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: Invoice[] = Object.keys(documents).map((id) => documents[id]);

        setInvoices(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return invoices;
};

export default useInvoices;
