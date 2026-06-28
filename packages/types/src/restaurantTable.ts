import { z } from 'zod';

export type RestaurantTable = {
  id: string;
  number: number;
  areaName: string;
  maxGuests: number;
};

export const restaurantTableSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  number: z.number({ message: 'Invalid number' }).int().positive(),
  areaName: z.string({ message: 'Invalid area name' }).trim().min(1),
  maxGuests: z.number({ message: 'Invalid maximum number of guests' }).int().positive(),
});
