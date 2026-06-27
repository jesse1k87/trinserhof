import { Invoice } from '@trinserhof/types';
import * as React from 'react';

export type InvoiceContextType = Invoice | null;

export type InvoiceContextValue = [
  InvoiceContextType,
  React.Dispatch<React.SetStateAction<InvoiceContextType>>,
];

export const InvoiceContext = React.createContext<InvoiceContextValue>([null, () => {}]);
