import { z } from 'zod';
import { type Channel, ChannelsEnum } from './channel';
import { type Status, StatusEnum } from './status';
import { type RoomType, RoomId, RoomIdEnum, RoomTypeEnum } from './room';

export type Booking = {
  id: string;
  email: string;
  checkIn: string;
  checkOut: string;
  status: Status;
  roomId: RoomId;
  channel: Channel;
  adults: number;
  children: number;
  pets: number;
  price: number;
  priceFixed: number;
  roomType?: RoomType;
  name?: string;
  notes?: string;
  message?: string;
};

export const bookingSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  status: StatusEnum,
  roomType: RoomTypeEnum.optional(),
  roomId: RoomIdEnum,
  channel: ChannelsEnum,
  adults: z.number(),
  children: z.number(),
  pets: z.number(),
  price: z.number(),
  priceFixed: z.number(),
  name: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export type OldBooking = {
  className: string;
  contact: string;
  content: string;
  deleted: boolean;
  end: string;
  group: string;
  id: string;
  name: string;
  price: string;
  start: string;
  status: string;
  updated: string;
};
