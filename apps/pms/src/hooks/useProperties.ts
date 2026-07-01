import * as React from 'react';
import { getSupabaseClient, type Property as PropertyRow } from '@trinserhof/supabase';
import { Property } from '@trinserhof/types';

const toProperty = (row: PropertyRow): Property => ({
  id: row.id,
  name: row.name,
  legalName: row.legalName,
  website: row.website,
  email: row.email,
  phone: row.phone,
  checkInTime: row.checkInTime,
  checkOutTime: row.checkOutTime,
  address: row.address,
  cityTaxPerPersonPerNight: row.cityTaxPerPersonPerNight,
  taxRegistryNumber: row.taxRegistryNumber,
  iban: row.iban,
  bic: row.bic,
});

const useProperties = () => {
  const [properties, setProperties] = React.useState<Property[]>([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('Property').select('*'))
      .then(({ data, error }: { data: PropertyRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setProperties((data ?? []).map(toProperty).sort((a, b) => a.name.localeCompare(b.name)));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return properties;
};

export default useProperties;
