import { defaultRoomId, type Booking, type OldBooking } from '@bookings/types';
import { getYYYYmmDD } from './getYYYYmmDD';

export const makeBookingBackwardsCompatible = (b: Booking & OldBooking) => {
  const booking: Booking = {
    ...b,
    ...(!b.checkIn && b.start && { checkIn: getYYYYmmDD(b.start) }),
    ...(!b.checkOut && b.end && { checkOut: getYYYYmmDD(b.end) }),
    ...(!b.message && b.content && { message: b.content }),
    ...(!b.roomId && b.group && { roomId: `${b.group ?? defaultRoomId}` }),
    ...(!b.priceFixed && b.price && { priceFixed: b.price }),
    ...(!b.channel && { channel: 'UNKNOWN' }),
    ...(b.notes === undefined && b.content && { notes: b.content }),
    ...(!b.name && {
      name:
        typeof b.content === 'string' && b.content !== ''
          ? b.content
          : typeof b.contact === 'string' && b.contact !== ''
            ? b.contact
            : 'Unknown',
    }),
    status:
      b.status === 'confirmed'
        ? 'CONFIRMED'
        : b.status === 'maybe'
          ? 'PENDING'
          : b.status === 'employee'
            ? 'BLOCKED'
            : b.deleted
              ? 'DECLINED'
              : b.status,

    adults: b.adults ?? 0,
    children: b.children ?? 0,
    pets: b.pets ?? 0,
  };

  // if (booking.name && !booking.content) booking.content = booking.name;
  // if (booking.checkIn && !booking.start) booking.start = booking.checkIn;
  // if (booking.checkOut && !booking.end) booking.end = booking.checkOut;
  // if (booking.roomId && !booking.group) booking.group = booking.roomId;

  // if (booking.created) delete booking.created;
  // if (booking.deleted) delete booking.deleted;
  // if (booking.end) delete booking.end;
  // if (booking.start) delete booking.start;
  // if (booking.updated) delete booking.updated;
  // if (booking.content) delete booking.content;
  // if (booking.className) delete booking.className;
  // if (booking.group) delete booking.group;

  return booking;
};
