import { Room } from '@trinserhof/types';

export const roomsAreDifferent = (a: Room, b: Room) =>
  a.type !== b.type ||
  a.label !== b.label ||
  a.description !== b.description ||
  JSON.stringify(a.pricePerNight) !== JSON.stringify(b.pricePerNight);
