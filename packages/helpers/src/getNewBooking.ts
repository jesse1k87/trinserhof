import { getYYYYmmDD } from './getYYYYmmDD';
import { STATUSES, ROOM_IDS, CHANNELS } from '@trinserhof/types';

export const getNewBooking = () => {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  return {
    name: '',
    email: '',
    checkIn: getYYYYmmDD(checkIn),
    checkOut: getYYYYmmDD(checkOut),
    status: STATUSES[0],
    roomId: ROOM_IDS[0],
    channel: CHANNELS[0],
    adults: 0,
    children: 0,
    babies: 0,
    pets: 0,
    price: 0,
    priceFixed: 0,
  };
};
