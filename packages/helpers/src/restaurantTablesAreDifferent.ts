import { RestaurantTable } from '@trinserhof/types';

export const restaurantTablesAreDifferent = (a: RestaurantTable, b: RestaurantTable) => {
  const properties: Array<keyof RestaurantTable> = ['number', 'areaName', 'maxGuests'];

  return properties.some((property) => a[property] !== b[property]);
};
