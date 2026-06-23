import { Booking, defaultRoomId, Room, RoomId, ROOM_IDS, ROOMS } from '@trinserhof/types';

export type RoomSeedResult = {
  /** Rooms that need writing (new or changed vs. the source data), keyed by id. */
  changedRooms: Record<string, Room>;
  /** bookingId -> [roomId] for bookings that gained a room link. */
  bookingRoomUpdates: Record<string, RoomId[]>;
  summary: { totalRooms: number; changedCount: number; bookingsLinked: number };
};

const VALID_ROOM_IDS = new Set<string>(ROOM_IDS);

const roomsAreDifferent = (a: Room, b: Room) =>
  a.type !== b.type ||
  a.label !== b.label ||
  a.description !== b.description ||
  JSON.stringify(a.pricePerNight) !== JSON.stringify(b.pricePerNight);

/**
 * Migration: copies the (formerly hardcoded) ROOMS list from @trinserhof/types
 * into Firebase's rooms/$roomId so the client app can read room data at runtime
 * instead of bundling it, and links every existing booking to its room via a
 * `rooms: [roomId]` reference array (mirroring the `customers` link).
 *
 * Idempotent: rooms already matching the source data are skipped, and bookings
 * that already have a non-empty `rooms` array are left untouched. A booking's
 * room is resolved from its `roomId` (falling back to the legacy `group`),
 * defaulting to the unassigned room when it isn't a recognized room id.
 */
export const seedRooms = (
  existingRooms: Record<string, Room>,
  bookings: Record<string, Booking> = {},
): RoomSeedResult => {
  const changedRooms: Record<string, Room> = {};

  for (const room of ROOMS) {
    const existing = existingRooms[room.id];
    if (!existing || roomsAreDifferent(existing, room)) {
      changedRooms[room.id] = room;
    }
  }

  const bookingRoomUpdates: Record<string, RoomId[]> = {};

  for (const [bookingId, booking] of Object.entries(bookings)) {
    if (Array.isArray(booking.rooms) && booking.rooms.length > 0) continue;

    const rawRoomId = booking.roomId ?? booking.group;
    const roomId =
      rawRoomId != null && VALID_ROOM_IDS.has(String(rawRoomId))
        ? (String(rawRoomId) as RoomId)
        : defaultRoomId;

    bookingRoomUpdates[bookingId] = [roomId];
  }

  return {
    changedRooms,
    bookingRoomUpdates,
    summary: {
      totalRooms: ROOMS.length,
      changedCount: Object.keys(changedRooms).length,
      bookingsLinked: Object.keys(bookingRoomUpdates).length,
    },
  };
};
