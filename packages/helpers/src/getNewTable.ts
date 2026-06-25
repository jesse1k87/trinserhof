import { type RestaurantTable } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewTable = (): RestaurantTable => ({
  id: uuidv4(),
  number: 0,
  areaName: '',
  maxGuests: 2,
});
