import { RestaurantTable } from '@trinserhof/types';
import * as React from 'react';

export type RestaurantTableContextType = RestaurantTable | null;

export type RestaurantTableContextValue = [
  RestaurantTableContextType,
  React.Dispatch<React.SetStateAction<RestaurantTableContextType>>,
];

export const RestaurantTableContext = React.createContext<RestaurantTableContextValue>([
  null,
  () => {},
]);
