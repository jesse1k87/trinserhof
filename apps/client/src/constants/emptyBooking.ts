import { dateToString } from '@bookings/helpers';
import { Booking, ROOM_TYPE_IDS, STATUSES } from '@bookings/types';

export const emptyBooking: Booking = {
  id: '',
  created: dateToString(new Date()),
  email: '',
  name: '',
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
