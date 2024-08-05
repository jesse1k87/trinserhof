import { type Booking, type OldBooking } from '@bookings/types';
import { getYYYYmmDD } from './getYYYYmmDD';

export const makeBookingBackwardsCompatible = (b: Booking & OldBooking) => {
  const booking: Booking = {
    ...b,
    email: b.email,
    channel: 'UNKNOWN',
    name:
      typeof b.content === 'string' && b.content !== ''
        ? b.content
        : typeof b.name === 'string' && b.name !== ''
          ? b.name
          : typeof b.contact === 'string' && b.contact !== ''
            ? b.contact
            : 'Unknown',
    message: b.content,
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
    ...(b.start && { checkIn: getYYYYmmDD(b.start) }),
    ...(b.end && { checkOut: getYYYYmmDD(b.end) }),
    ...(b.price && { priceFixed: b.price }),
    ...(b.group && { roomId: `${b.group}` }),

    adults: b.adults ?? 0,
    children: b.children ?? 0,
    pets: b.pets ?? 0,
  };

  if (booking.created) delete booking.created;
  if (booking.deleted) delete booking.deleted;
  if (booking.end) delete booking.end;
  if (booking.group) delete booking.group;
  if (booking.start) delete booking.start;
  if (booking.updated) delete booking.updated;
  // if (booking.content) delete booking.content;
  if (booking.className) delete booking.className;

  return booking;
};
