import { z } from 'zod';
import { type Status, StatusEnum } from './status';
import { RoomId, RoomIdEnum } from './room';
import { priceAmountSchema } from './price';

export type Booking = {
  adults: number;
  checkIn: string;
  checkOut: string;
  children: number;
  customers: string[];
  id: string;
  pets: number;
  // The agreed nightly price for this booking's room, captured when the
  // booking is created/edited - independent of the room type's base price
  // or per-night overrides, which can change after the fact.
  pricePerNight?: number;
  roomId: RoomId;
  status: Status;
};

export const bookingSchema = z.object({
  adults: z.number(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  children: z.number(),
  customers: z.array(z.string().trim().min(1)),
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  pets: z.number(),
  pricePerNight: priceAmountSchema.optional(),
  roomId: RoomIdEnum,
  status: StatusEnum,
});
