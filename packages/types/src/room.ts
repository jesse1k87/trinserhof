import { z } from 'zod';

export const ROOM_TYPES_IDS = [
  'SUITE',
  'STANDARD_DOUBLE',
  'BASIC_DOUBLE',
  'SINGLE',
  'FAMILY',
] as const;

export const RoomTypeIdEnum = z.enum(ROOM_TYPES_IDS);

export type RoomTypeId = z.infer<typeof RoomTypeIdEnum>;

export const defaultRoomId = '0';

// Rooms (and their ids) live in Firebase (see @trinserhof/database's saveRoom/deleteRoom,
// and apps/pms's useRooms hook), so room ids aren't restricted to a fixed list here.
export const RoomIdEnum = z.string().trim().min(1);

export type RoomId = string;

type RoomType = {
  type: RoomTypeId;
  label: string;
  description: string;
};

export type Room = {
  id: RoomId;
} & RoomType;

export const ROOM_TYPES: RoomType[] = [
  {
    type: 'SUITE',
    label: 'Suite',
    description: 'Double room for 2 guests with 1 or 2 bathrooms.',
  },
  {
    type: 'STANDARD_DOUBLE',
    label: 'Standard Room',
    description: 'Double room for 2 guests with bathroom.',
  },
  {
    type: 'BASIC_DOUBLE',
    label: 'Standard Room (2)',
    description: 'Single room for 2 guests with bathroom.',
  },
  {
    type: 'SINGLE',
    label: 'Bergsteigerzimmer',
    description: 'Single room for 1 guest.',
  },
  {
    type: 'FAMILY',
    label: 'Family Room',
    description: 'Double room for 4 guests (2 or 3 beds).',
  },
];

