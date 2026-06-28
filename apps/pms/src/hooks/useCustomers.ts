import * as React from 'react';
import { getDb, type Customer as CustomerRow } from '@trinserhof/supabase-db';
import { Customer } from '@trinserhof/types';

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  created: row.created.toISOString().slice(0, 10),
  name: row.name,
  surname: row.surname ?? undefined,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  dateOfBirth: row.dateOfBirth?.toISOString().slice(0, 10),
  nationality: row.nationality ?? undefined,
  language: row.language ?? undefined,
  street: row.street ?? undefined,
  streetNumber: row.streetNumber ?? undefined,
  postcode: row.postcode ?? undefined,
  city: row.city ?? undefined,
  country: row.country ?? undefined,
});

const useCustomers = () => {
  const [customers, setCustomers] = React.useState<Customer[]>([]);

  React.useEffect(() => {
    let active = true;

    getDb()
      .customer.findMany()
      .then((rows: CustomerRow[]) => {
        if (active) {
          setCustomers(rows.map(toCustomer));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return customers;
};

export default useCustomers;
