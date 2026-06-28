import * as React from 'react';
import { getDb, type RestaurantTable as RestaurantTableRow } from '@trinserhof/supabase-db';
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

    getDb()
      .restaurantTable.findMany()
      .then((rows: RestaurantTableRow[]) => {
        if (active) {
          setTables(rows.map(toRestaurantTable));
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
