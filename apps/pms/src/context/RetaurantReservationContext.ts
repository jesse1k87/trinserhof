import { RestaurantReservation } from '@trinserhof/types';
import * as React from 'react';

export type RestaurantReservationContextType = RestaurantReservation | null;

export type RestaurantReservationContextValue = [
  RestaurantReservationContextType,
  React.Dispatch<React.SetStateAction<RestaurantReservationContextType>>,
];

export const RestaurantReservationContext = React.createContext<RestaurantReservationContextValue>([
  null,
  () => {},
]);
