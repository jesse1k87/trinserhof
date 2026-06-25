import { z } from 'zod';

export type TableReservation = {
  id: string;
  name: string;
  start: string;
  numberOfPeople: number;
  tableId: string;
  customerId?: string;
};

export const tableReservationSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  start: z.string({ message: 'Invalid start date/time' }).datetime(),
  numberOfPeople: z.number({ message: 'Invalid number of people' }).int().positive(),
  tableId: z.string({ message: 'Invalid table id' }).trim().min(1),
  customerId: z.string().trim().min(1).optional(),
});

export const TABLE_RESERVATION_DURATION_MS = 2 * 60 * 60 * 1000;

export const getTableReservationEnd = (start: string) =>
  new Date(new Date(start).getTime() + TABLE_RESERVATION_DURATION_MS);
