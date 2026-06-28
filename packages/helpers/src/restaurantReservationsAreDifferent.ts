import { RestaurantReservation } from '@trinserhof/types';

export const restaurantReservationsAreDifferent = (
  a: RestaurantReservation,
  b: RestaurantReservation,
) => {
  const properties: Array<keyof RestaurantReservation> = [
    'start',
    'numberOfPeople',
    'tableId',
    'customerId',
  ];

  return properties.some((property) => a[property] !== b[property]);
};
