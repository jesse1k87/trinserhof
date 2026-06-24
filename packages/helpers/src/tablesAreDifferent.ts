import { RestaurantTable } from '@trinserhof/types';

export const tablesAreDifferent = (a: RestaurantTable, b: RestaurantTable) => {
  const properties: Array<keyof RestaurantTable> = ['name', 'nickname', 'areaName', 'maxGuests'];

  return properties.some((property) => a[property] !== b[property]);
};
