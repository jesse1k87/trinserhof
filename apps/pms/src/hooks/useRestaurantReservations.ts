import * as React from 'react';
import {
  getSupabaseClient,
  toUtcIso,
  type RestaurantReservation as RestaurantReservationRow,
} from '@trinserhof/supabase';
import { RestaurantReservation } from '@trinserhof/types';

const toRestaurantReservation = (row: RestaurantReservationRow): RestaurantReservation => ({
  id: row.id,
  start: toUtcIso(row.start),
  numberOfPeople: row.numberOfPeople,
  tableId: row.tableId ?? undefined,
  customerId: row.customerId ?? undefined,
});

const useRestaurantReservations = () => {
  const [restaurantReservations, setRestaurantReservations] = React.useState<
    RestaurantReservation[]
  >([]);

  React.useEffect(() => {
    let active = true;

    Promise.resolve(getSupabaseClient().from('RestaurantReservation').select('*'))
      .then(({ data, error }: { data: RestaurantReservationRow[] | null; error: unknown }) => {
        if (error) throw error;
        if (active) {
          setRestaurantReservations((data ?? []).map(toRestaurantReservation));
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      active = false;
    };
  }, []);

  return restaurantReservations;
};

export default useRestaurantReservations;
