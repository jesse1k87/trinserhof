import { Room, ROOMS } from '@trinserhof/types';

export type RoomSeedResult = {
  changedRooms: Record<string, Room>;
  summary: { totalRooms: number; changedCount: number };
};

const roomsAreDifferent = (a: Room, b: Room) =>
  a.type !== b.type ||
  a.label !== b.label ||
  a.description !== b.description ||
  JSON.stringify(a.pricePerNight) !== JSON.stringify(b.pricePerNight);

/**
 * Migration: copies the (formerly hardcoded) ROOMS list from @trinserhof/types
 * into Firebase's rooms/$roomId so the client app can read room data at runtime
 * instead of bundling it. Idempotent: rooms already matching the source data are skipped.
 */
export const seedRooms = (existingRooms: Record<string, Room>): RoomSeedResult => {
  const changedRooms: Record<string, Room> = {};

  for (const room of ROOMS) {
    const existing = existingRooms[room.id];
    if (!existing || roomsAreDifferent(existing, room)) {
      changedRooms[room.id] = room;
    }
  }

  return {
    changedRooms,
    summary: { totalRooms: ROOMS.length, changedCount: Object.keys(changedRooms).length },
  };
};
