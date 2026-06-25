import { z } from 'zod';

export const ROOM_TYPES_IDS = ['SUITE', 'STANDARD', 'BERGSTEIGER', 'FAMILY'] as const;

export const RoomTypeIdEnum = z.enum(ROOM_TYPES_IDS);

export type RoomTypeId = z.infer<typeof RoomTypeIdEnum>;

export const RoomIdEnum = z.string().trim().min(1);

export type RoomId = string;

type RoomType = {
  type: RoomTypeId;
};

export const ROOM_AMENITIES = [
  'balcony',
  'tv',
  'shower',
  'bathtub',
  'toilet',
  'phone',
  'desk',
  'mountainView',
] as const;

export type RoomAmenity = (typeof ROOM_AMENITIES)[number];

export const ROOM_BED_COUNTS = ['singleBed', 'doubleBed', 'sofa', 'sleepSofa', 'spaces'] as const;

export type RoomBedCount = (typeof ROOM_BED_COUNTS)[number];

export type Room = {
  id: RoomId;
  type: RoomTypeId;
  maxCustomers: number;
} & Partial<Record<RoomAmenity, boolean>> &
  Partial<Record<RoomBedCount, number>>;

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
