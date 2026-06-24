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

export const ROOM_IDS = [
  defaultRoomId,
  '101',
  '102',
  '103',
  '104',
  '106',
  '107',
  '108',
  '109',
  '110',
  '111',
  '112',
  '113',
  '114',
  '116',
  '117',
  '118',
  '120',
  '121',
  '124',
] as const;

// Rooms now live in Firebase (see @trinserhof/database's saveRoom/deleteRoom), so room ids
// are no longer restricted to this seed list — ROOM_IDS/ROOM_IDS-derived helpers below are
// kept for migrating/seeding the original hardcoded rooms, not for validating new ones.
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

const getRoomType = (type: RoomTypeId): RoomType => {
  const roomType = ROOM_TYPES.find((t) => t.type === type);
  if (!roomType) throw new Error(`Unknown room type: ${type}`);
  return roomType;
};

export const ROOMS: Room[] = [
  { id: '0', ...getRoomType('SINGLE') },
  { id: '101', ...getRoomType('STANDARD_DOUBLE') },
  { id: '102', ...getRoomType('SINGLE') },
  { id: '103', ...getRoomType('STANDARD_DOUBLE') },
  { id: '104', ...getRoomType('SUITE') },
  { id: '106', ...getRoomType('BASIC_DOUBLE') },
  { id: '107', ...getRoomType('BASIC_DOUBLE') },
  { id: '108', ...getRoomType('BASIC_DOUBLE') },
  { id: '109', ...getRoomType('STANDARD_DOUBLE') },
  { id: '110', ...getRoomType('SINGLE') },
  { id: '111', ...getRoomType('STANDARD_DOUBLE') },
  { id: '112', ...getRoomType('BASIC_DOUBLE') },
  { id: '113', ...getRoomType('STANDARD_DOUBLE') },
  { id: '114', ...getRoomType('SUITE') },
  { id: '116', ...getRoomType('BASIC_DOUBLE') },
  { id: '117', ...getRoomType('BASIC_DOUBLE') },
  { id: '118', ...getRoomType('BASIC_DOUBLE') },
  { id: '120', ...getRoomType('SUITE') },
  { id: '121', ...getRoomType('FAMILY') },
  { id: '124', ...getRoomType('FAMILY') },
];
