import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { RestaurantReservation } from '@trinserhof/types';

const useRestaurantReservations = () => {
  const [restaurantReservations, setRestaurantReservations] = React.useState<
    RestaurantReservation[]
  >([]);

  const db = getDb();

  React.useEffect(() => {
    const unsubscribe = onValue(
      ref(db, 'restaurantReservations'),
      (snapshot) => {
        const documents = snapshot.val() ?? {};
        const restaurantReservationsAsArray: RestaurantReservation[] = Object.keys(documents).map(
          (id) => documents[id],
        );

        setRestaurantReservations(restaurantReservationsAsArray);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, [db]);

  return restaurantReservations;
};

export default useRestaurantReservations;
