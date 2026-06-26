import { getYYYYmmDD } from './getYYYYmmDD';
import { DEFAULT_BOOKING_STATUS, DEFAULT_BOOKING_ORIGIN, type Booking } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewBooking = (): Booking => {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  return {
    adults: 1,
    created: new Date().toISOString(),
    checkIn: getYYYYmmDD(checkIn),
    checkOut: getYYYYmmDD(checkOut),
    children: 0,
    customers: [],
    id: uuidv4(),
    pets: 0,
    roomId: '',
    status: DEFAULT_BOOKING_STATUS,
    origin: DEFAULT_BOOKING_ORIGIN,
  };
};
