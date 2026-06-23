import {
  defaultRoomId,
  ROOM_IDS,
  CHANNELS,
  type Booking,
  type OldBooking,
  type RoomId,
} from '@trinserhof/types';
import { getYYYYmmDD } from './getYYYYmmDD';

type LegacyStatus = 'confirmed' | 'maybe' | 'employee';

type LegacyChannel = string | { id?: string; label?: string };

type RawBooking = Omit<Booking, 'status' | 'price' | 'channel' | 'priceFixed'> &
  OldBooking & {
    status: Booking['status'] | LegacyStatus | '';
    price: number | string;
    channel?: LegacyChannel;
    priceFixed?: string | number;
  };

const VALID_CHANNEL_IDS: readonly string[] = CHANNELS.map((c) => c.id);

const resolveChannel = (channel: LegacyChannel | undefined): Booking['channel'] => {
  if (typeof channel === 'string' && channel !== '') return channel as Booking['channel'];
  if (channel && typeof channel === 'object' && VALID_CHANNEL_IDS.includes(channel.id ?? '')) {
    return channel.id as Booking['channel'];
  }
  return 'UNKNOWN';
};

const resolvePriceFixed = (priceFixed: string | number | undefined): string => {
  if (priceFixed === undefined || priceFixed === '') return '0';
  return typeof priceFixed === 'number' ? String(priceFixed) : priceFixed;
};

export const makeBookingBackwardsCompatible = (b: RawBooking): Booking => {
  const price = typeof b.price === 'string' ? parseFloat(b.price) : b.price;

  const checkIn = !b.checkIn && b.start ? getYYYYmmDD(b.start) : b.checkIn;
  const checkOut = !b.checkOut && b.end ? getYYYYmmDD(b.end) : b.checkOut;
  const rawRoomId = !b.roomId && b.group ? (`${b.group ?? defaultRoomId}` as RoomId) : b.roomId;
  // Room 119 was renumbered to 120; map old bookings that still reference it.
  const remappedRoomId = (rawRoomId as string) === '119' ? '120' : rawRoomId;
  const roomId = (ROOM_IDS as readonly string[]).includes(remappedRoomId as string)
    ? remappedRoomId
    : defaultRoomId;
  const channel = resolveChannel(b.channel);
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
    priceFixed: resolvePriceFixed(b.priceFixed),
    halbpension: b.halbpension ?? false,
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
              : !b.status
                ? 'NO_STATUS'
                : b.status,
  };

  return booking;
};
