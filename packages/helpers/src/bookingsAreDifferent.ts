import { Booking } from '@bookings/types';

export const bookingsAreDifferent = (a: Booking, b: Booking) => {
  const log = false;
  const results = [];

  const res = [
    'email',
    'phone',
    'name',
    'channel',
    'status',
    'notes',
    'checkIn',
    'checkOut',
    'roomId',
    'adults',
    'children',
    'babies',
    'pets',
    'price',
    'priceFixed',
  ].map((property) => {
    if (log) {
      results.push({
        same: a[property] === b[property],
        property,
        a: a[property],
        b: b[property],
      });
    }

    return a[property] === b[property];
  });

  if (log) console.log(results);

  return res.includes(false);
};
