import { z } from 'zod';

export const ROOM_TYPES_IDS = ['SUITE', 'STANDARD', 'BERGSTEIGER', 'FAMILY'] as const;

export const RoomTypeIdEnum = z.enum(ROOM_TYPES_IDS);

export type RoomTypeId = z.infer<typeof RoomTypeIdEnum>;

export const defaultRoomId = '0';

export const RoomIdEnum = z.string().trim().min(1);

export type RoomId = string;

type RoomType = {
  type: RoomTypeId;
};

export type Room = {
  id: RoomId;
  type: RoomTypeId;
};

export const ROOM_TYPES: RoomType[] = [
  {
    type: 'SUITE',
  },
  {
    type: 'STANDARD',
  },
  {
    type: 'BERGSTEIGER',
  },
  {
    type: 'FAMILY',
  },
];
