import { type RestaurantReservation } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewRestaurantReservation = (): RestaurantReservation => ({
  id: uuidv4(),
  start: new Date().toISOString(),
  numberOfPeople: 2,
  tableId: '',
});
