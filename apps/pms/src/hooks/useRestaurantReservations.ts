import * as React from 'react';
import {
  getSupabaseClient,
  toUtcIso,
  type RestaurantReservation as RestaurantReservationRow,
} from '@trinserhof/supabase';
import { RestaurantReservation } from '@trinserhof/types';

const listeners = new Set<(data: RestaurantReservation[]) => void>();

export const notifyReservationsChanged = (data: RestaurantReservation[]) => {
  listeners.forEach((l) => l(data));
};

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

    // Fetch initial data
    const fetchData = async () => {
      const { data, error } = await getSupabaseClient().from('RestaurantReservation').select('*');
      if (error) throw error;
      if (active) setRestaurantReservations((data ?? []).map(toRestaurantReservation));
    };

    fetchData();

    const listener = (newData: RestaurantReservation[]) => {
      if (active) setRestaurantReservations(newData);
    };
    listeners.add(listener);

    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return restaurantReservations;
};

export default useRestaurantReservations;
