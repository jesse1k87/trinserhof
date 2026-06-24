import { z } from 'zod';

export type TableReservation = {
  id: string;
  name: string;
  start: string;
  end: string;
  numberOfPeople: number;
  tableId: string;
};

export const tableReservationSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  start: z.string({ message: 'Invalid start date/time' }).datetime(),
  end: z.string({ message: 'Invalid end date/time' }).datetime(),
  numberOfPeople: z.number({ message: 'Invalid number of people' }).int().positive(),
  tableId: z.string({ message: 'Invalid table id' }).trim().min(1),
});
