import { Booking } from '@trinserhof/types';

export const bookingsAreDifferent = (a: Booking, b: Booking) => {
  const log = false;
  const results: Array<{ same: boolean; property: keyof Booking; a: unknown; b: unknown }> = [];

  const properties: Array<keyof Booking> = [
    'adults',
    'babies',
    'checkIn',
    'checkOut',
    'children',
    'email',
    'pets',
    'phone',
    'roomId',
    'status',
  ];

  const res = properties.map((property) => {
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

  const customersChanged =
    JSON.stringify([...(a.customers ?? [])].sort()) !==
    JSON.stringify([...(b.customers ?? [])].sort());

  return res.includes(false) || customersChanged;
};
