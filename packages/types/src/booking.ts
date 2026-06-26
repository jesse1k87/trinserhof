import { z } from 'zod';
import { RoomId, RoomIdEnum } from './room';
import { priceAmountSchema } from './price';

export const BOOKING_STATUSES = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'CHECKED_IN', label: 'Checked in' },
  { id: 'CHECKED_OUT', label: 'Checked out' },
  { id: 'CANCELLED', label: 'Cancelled' },
] as const;

export const DEFAULT_BOOKING_STATUS = 'PENDING';

export const BookingStatusEnum = z.enum(
  BOOKING_STATUSES.map(({ id }) => id) as [string, ...string[]],
);

export type BookingStatus = z.infer<typeof BookingStatusEnum>;

const BookingOriginEnum = z.enum([
  'IN_PERSON',
  'EMAIL',
  'PHONE',
  'WEBSITE_FORM',
  'WEBSITE_FORM_MEWS',
  'UNKNOWN',
]);

export const DEFAULT_BOOKING_ORIGIN = 'UNKNOWN';

type BookingOrigin = z.infer<typeof BookingOriginEnum>;

export type Booking = {
  id: string;
  created: string;
  origin: BookingOrigin;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  cancelled?: string;
  confirmed?: string;
  checkedIn?: string;
  checkedOut?: string;
  roomId: RoomId;
  customers: string[];
  adults: number;
  children: number;
  pets: number;
  pricePerNight?: number;
};

export const bookingSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  created: z.string(),
  origin: BookingOriginEnum,
  status: BookingStatusEnum,
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  cancelled: z.string().optional(),
  confirmed: z.string().optional(),
  checkedIn: z.string().optional(),
  checkedOut: z.string().optional(),
  roomId: RoomIdEnum,
  customers: z.array(z.string().trim().min(1)),
  adults: z.number(),
  children: z.number(),
  pets: z.number(),
  pricePerNight: priceAmountSchema.optional(),
});
