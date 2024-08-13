import { defaultRoomId, type Booking, type OldBooking } from '@bookings/types';
import { getYYYYmmDD } from './getYYYYmmDD';

export const makeBookingBackwardsCompatible = (b: Booking & OldBooking) => {
  const booking: Booking = {
    ...b,
    adults: b.adults ?? 0,
    children: b.children ?? 0,
    babies: b.babies ?? 0,
    pets: b.pets ?? 0,
    price: isNaN(b.price) ? 0 : b.price,
    notes: typeof b.notes === 'string' ? b.notes : '',
    ...(!b.checkIn && b.start && { checkIn: getYYYYmmDD(b.start) }),
    ...(!b.checkOut && b.end && { checkOut: getYYYYmmDD(b.end) }),
    ...(!b.roomId && b.group && { roomId: `${b.group ?? defaultRoomId}` }),
    ...((typeof b.channel !== 'string' || b.channel === '') && { channel: 'UNKNOWN' }),
    ...((typeof b.name !== 'string' || b.name === '') && {
      name: typeof b.content === 'string' && b.content !== '' ? b.content : 'Unknown',
    }),
    status:
      b.status === 'confirmed'
        ? 'CONFIRMED'
        : b.status === 'maybe'
          ? 'PENDING'
          : b.status === 'employee'
            ? 'BLOCKED'
            : b.deleted
              ? 'CANCELLED'
              : b.status,
  };

  return booking;
};
