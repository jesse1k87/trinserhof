import { Booking } from '@trinserhof/types';
import * as React from 'react';

export type BookingContextType = Booking | null;

export type BookingContextValue = [
  BookingContextType,
  React.Dispatch<React.SetStateAction<BookingContextType>>,
];

export const BookingContext = React.createContext<BookingContextValue>([null, () => {}]);
