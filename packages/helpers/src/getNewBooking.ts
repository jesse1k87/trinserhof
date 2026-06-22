import { getYYYYmmDD } from './getYYYYmmDD';
import { STATUSES, ROOM_IDS, CHANNELS, type Booking } from '@trinserhof/types';
import { uuidv4 } from './uuidv4';

export const getNewBooking = (): Booking => {
  const checkIn = new Date();
  const checkOut = new Date();
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);

  return {
    id: uuidv4(),
    name: '',
    email: '',
    checkIn: getYYYYmmDD(checkIn),
    checkOut: getYYYYmmDD(checkOut),
    status: STATUSES[0],
    roomId: ROOM_IDS[0],
    channel: CHANNELS[0].id,
    adults: 0,
    children: 0,
    babies: 0,
    pets: 0,
    halbpension: false,
    price: 0,
    priceFixed: '0',
  };
};
