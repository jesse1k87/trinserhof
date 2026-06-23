import { Customer } from '@trinserhof/types';
import * as React from 'react';

export type CustomerContextType = Customer | null;

export type CustomerContextValue = [
  CustomerContextType,
  React.Dispatch<React.SetStateAction<CustomerContextType>>,
];

export const CustomerContext = React.createContext<CustomerContextValue>([null, () => {}]);
