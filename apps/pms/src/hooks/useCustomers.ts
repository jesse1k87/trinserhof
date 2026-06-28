import * as React from 'react';
import { getSupabaseClient, type Customer as CustomerRow } from '@trinserhof/supabase';
import { Customer } from '@trinserhof/types';

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  created: row.created,
  name: row.name,
  surname: row.surname ?? undefined,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  dateOfBirth: row.dateOfBirth ?? undefined,
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

    Promise.resolve(getSupabaseClient().from('Customer').select('*'))
      .then(({ data, error }: { data: CustomerRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setCustomers((data ?? []).map(toCustomer));
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
