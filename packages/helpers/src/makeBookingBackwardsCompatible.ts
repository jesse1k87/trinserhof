import { defaultRoomId, type Booking, type OldBooking, type RoomId } from '@trinserhof/types';
import { getYYYYmmDD } from './getYYYYmmDD';

type LegacyStatus = 'confirmed' | 'maybe' | 'employee';

type RawBooking = Omit<Booking, 'status' | 'price'> &
  OldBooking & {
    status: Booking['status'] | LegacyStatus;
    price: number | string;
  };

export const makeBookingBackwardsCompatible = (b: RawBooking): Booking => {
  const price = typeof b.price === 'string' ? parseFloat(b.price) : b.price;

  const checkIn = !b.checkIn && b.start ? getYYYYmmDD(b.start) : b.checkIn;
  const checkOut = !b.checkOut && b.end ? getYYYYmmDD(b.end) : b.checkOut;
  const rawRoomId = !b.roomId && b.group ? (`${b.group ?? defaultRoomId}` as RoomId) : b.roomId;
  // Room 119 was renumbered to 120; map old bookings that still reference it.
  const roomId = (rawRoomId as string) === '119' ? '120' : rawRoomId;
  const channel = typeof b.channel !== 'string' || b.channel === '' ? 'UNKNOWN' : b.channel;
  const name =
    typeof b.name !== 'string' || b.name === ''
      ? typeof b.content === 'string' && b.content !== ''
        ? b.content
        : 'Unknown'
      : b.name;

  const booking: Booking = {
    ...b,
    adults: b.adults ?? 0,
    children: b.children ?? 0,
    babies: b.babies ?? 0,
    pets: b.pets ?? 0,
    price: isNaN(price) ? 0 : price,
    notes: typeof b.notes === 'string' ? b.notes : '',
    checkIn,
    checkOut,
    roomId,
    channel,
    name,
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
