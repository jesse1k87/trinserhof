import { Room, ROOMS } from '@trinserhof/types';
import { roomsAreDifferent } from './roomsAreDifferent';

export type RoomSeedResult = {
  /** Rooms that need writing (new or changed vs. the source data), keyed by id. */
  changedRooms: Record<string, Room>;
  summary: { totalRooms: number; changedCount: number };
};

/**
 * Migration: copies the (formerly hardcoded) ROOMS list from @trinserhof/types
 * into Firebase's rooms/$roomId so the PMS app can read room data at runtime
 * instead of bundling it.
 *
 * Idempotent: rooms already matching the source data are skipped.
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
    summary: {
      totalRooms: ROOMS.length,
      changedCount: Object.keys(changedRooms).length,
    },
  };
};
