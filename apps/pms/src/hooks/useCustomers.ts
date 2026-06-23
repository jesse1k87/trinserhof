import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Customer } from '@trinserhof/types';

/**
 * Real-time listener on the Firebase `customers` collection.
 */
const useCustomers = () => {
  const [customers, setCustomers] = React.useState<Customer[]>([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'customers'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const docsAsArray: Customer[] = Object.keys(documents)
          .map((id) => documents[id])
          .filter((customer: Customer) => !customer.deleted);

        setCustomers(docsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return customers;
};

export default useCustomers;
