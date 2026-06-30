import { z } from 'zod';
import { type PropertyId } from './property';

// Room types used to be a hardcoded enum (SUITE | STANDARD | …). They now live in
// the database as `RoomType` rows (see @trinserhof/supabase), so a room type id is
// just a non-empty string referencing one of those rows — analogous to `RoomId`.
export const RoomTypeIdEnum = z.string().trim().min(1);

export type RoomTypeId = string;

export const RoomIdEnum = z.string().trim().min(1);

export type RoomId = string;

// A room type as stored in the database: a stable id (the code referenced by
// `Room.type` and `Price.roomTypeId`) plus a human-readable label, an optional
// description, and the default nightly price for the type. Edited on the Room
// types page in the PMS app.
export type RoomType = {
  id: RoomTypeId;
  label: string;
  description?: string;
  basePrice: number;
};

export const roomTypeSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  label: z.string({ message: 'Invalid label' }).trim().min(1),
  description: z.string().trim().optional(),
  basePrice: z.number({ message: 'Invalid base price' }).nonnegative('Invalid base price'),
});

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

export const ROOM_BED_COUNTS = ['kingBed', 'queenBed', 'singleBed', 'sleepSofa', 'spaces'] as const;

export type RoomBedCount = (typeof ROOM_BED_COUNTS)[number];

export type Room = {
  id: RoomId;
  type: RoomTypeId;
  // Every room belongs to exactly one property (hotel) — this is a mandatory
  // reference to a Property.id (see property.ts).
  propertyId: PropertyId;
  maxCustomers: number;
  floor: number;
  color: string;
} & Partial<Record<RoomAmenity, boolean>> &
  Partial<Record<RoomBedCount, number>>;
