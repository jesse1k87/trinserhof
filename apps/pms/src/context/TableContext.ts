import { RestaurantTable } from '@trinserhof/types';
import * as React from 'react';

export type TableContextType = RestaurantTable | null;

export type TableContextValue = [
  TableContextType,
  React.Dispatch<React.SetStateAction<TableContextType>>,
];

export const TableContext = React.createContext<TableContextValue>([null, () => {}]);
