import { TableReservation } from '@trinserhof/types';
import * as React from 'react';

export type TableReservationContextType = TableReservation | null;

export type TableReservationContextValue = [
  TableReservationContextType,
  React.Dispatch<React.SetStateAction<TableReservationContextType>>,
];

export const TableReservationContext = React.createContext<TableReservationContextValue>([
  null,
  () => {},
]);
