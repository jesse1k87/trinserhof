import * as React from 'react';
import {
  getDb,
  type RestaurantReservation as RestaurantReservationRow,
} from '@trinserhof/supabase-db';
import { RestaurantReservation } from '@trinserhof/types';

const toRestaurantReservation = (row: RestaurantReservationRow): RestaurantReservation => ({
  id: row.id,
  start: row.start.toISOString(),
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

    getDb()
      .restaurantReservation.findMany()
      .then((rows: RestaurantReservationRow[]) => {
        if (active) {
          setRestaurantReservations(rows.map(toRestaurantReservation));
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
