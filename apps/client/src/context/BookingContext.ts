import { Booking } from '@bookings/types';
import * as React from 'react';

export type BookingContextType = Booking | null;

export const BookingContext = React.createContext<BookingContextType>(null);
