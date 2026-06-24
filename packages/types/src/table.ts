import { z } from 'zod';

export type RestaurantTable = {
  id: string;
  name: string;
  nickname: string;
  areaName: string;
  maxGuests: number;
};

export const tableSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  nickname: z.string({ message: 'Invalid nickname' }).trim().min(1),
  areaName: z.string({ message: 'Invalid area name' }).trim().min(1),
  maxGuests: z.number({ message: 'Invalid maximum number of guests' }).int().positive(),
});
