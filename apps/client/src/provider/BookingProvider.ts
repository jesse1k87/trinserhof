import { dateToString } from '@bookings/helpers';
import { ROOM_TYPE_IDS, STATUSES } from '@bookings/types';
import * as React from 'react';

export const emptyBooking = {
  id: '',
  created: dateToString(new Date()),
  email: '',
  message: '',
  status: STATUSES.PENDING,
  checkIn: dateToString(new Date()),
  checkOut: dateToString(new Date()),
  roomType: ROOM_TYPE_IDS.SUITE,
  roomId: undefined,
  adults: 1,
  children: 0,
  pets: 0,
  price: 0,
};

export const BookingContext = React.createContext<React.Context>(emptyBooking);
