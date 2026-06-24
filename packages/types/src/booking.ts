import { z } from 'zod';
import { type Status, StatusEnum } from './status';
import { RoomId, RoomIdEnum } from './room';

export type Booking = {
  adults: number;
  babies: number;
  checkIn: string;
  checkOut: string;
  children: number;
  customers: string[];
  email: string;
  id: string;
  pets: number;
  phone?: string;
  roomId: RoomId;
  status: Status;
};

export const bookingSchema = z.object({
  adults: z.number(),
  babies: z.number(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  children: z.number(),
  customers: z.array(z.string().trim().min(1)),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  pets: z.number(),
  phone: z.string().trim().optional(),
  roomId: RoomIdEnum,
  status: StatusEnum,
});
