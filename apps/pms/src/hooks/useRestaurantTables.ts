import * as React from 'react';
import {
  getSupabaseClient,
  type RestaurantTable as RestaurantTableRow,
} from '@trinserhof/supabase';
import { RestaurantTable } from '@trinserhof/types';

const toRestaurantTable = (row: RestaurantTableRow): RestaurantTable => ({
  id: row.id,
  number: row.number,
  areaName: row.areaName,
  maxGuests: row.maxGuests,
});

const useRestaurantTables = () => {
  const [tables, setTables] = React.useState<RestaurantTable[]>([]);

  React.useEffect(() => {
    let active = true;

    getSupabaseClient()
      .from('RestaurantTable')
      .select('*')
      .then(({ data, error }: { data: RestaurantTableRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setTables((data ?? []).map(toRestaurantTable));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return tables;
};

export default useRestaurantTables;
