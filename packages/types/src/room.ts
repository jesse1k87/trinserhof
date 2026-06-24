import { z } from 'zod';

export const ROOM_TYPES_IDS = ['SUITE', 'STANDARD', 'BERGSTEIGER', 'FAMILY'] as const;

export const RoomTypeIdEnum = z.enum(ROOM_TYPES_IDS);

export type RoomTypeId = z.infer<typeof RoomTypeIdEnum>;

export const defaultRoomId = '0';

export const RoomIdEnum = z.string().trim().min(1);

export type RoomId = string;

type RoomType = {
  type: RoomTypeId;
  label: string;
};

export type Room = {
  id: RoomId;
} & RoomType;

export const ROOM_TYPES: RoomType[] = [
  {
    type: 'SUITE',
    label: 'Suite',
  },
  {
    type: 'STANDARD',
    label: 'Standard',
  },
  {
    type: 'BERGSTEIGER',
    label: 'Bergsteigerzimmer',
  },
  {
    type: 'FAMILY',
    label: 'Family Room',
  },
];
