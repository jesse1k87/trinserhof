import { Room, ROOM_AMENITIES, ROOM_BED_COUNTS } from '@trinserhof/types';

export const roomsAreDifferent = (a: Room, b: Room) =>
  a.type !== b.type ||
  a.maxCustomers !== b.maxCustomers ||
  a.floor !== b.floor ||
  a.color !== b.color ||
  ROOM_AMENITIES.some((amenity) => Boolean(a[amenity]) !== Boolean(b[amenity])) ||
  ROOM_BED_COUNTS.some((bedCount) => (a[bedCount] ?? 0) !== (b[bedCount] ?? 0));
