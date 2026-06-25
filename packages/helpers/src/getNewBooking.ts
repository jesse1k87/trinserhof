import { getYYYYmmDD } from './getYYYYmmDD';
import { STATUSES, type Booking } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewBooking = (): Booking => {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  return {
    adults: 1,
    checkIn: getYYYYmmDD(checkIn),
    checkOut: getYYYYmmDD(checkOut),
    children: 0,
    customers: [],
    id: uuidv4(),
    pets: 0,
    roomId: '',
    status: STATUSES[0].id,
  };
};
