import { getYYYYmmDD } from './getYYYYmmDD';
import { STATUSES, ROOM_IDS, type Booking } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewBooking = (): Booking => {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  return {
    adults: 0,
    babies: 0,
    checkIn: getYYYYmmDD(checkIn),
    checkOut: getYYYYmmDD(checkOut),
    children: 0,
    customers: [],
    email: '',
    id: uuidv4(),
    pets: 0,
    roomId: ROOM_IDS[0],
    status: STATUSES[0].id,
  };
};
