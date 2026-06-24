import { z } from 'zod';

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  deleted?: boolean;
};

export const productSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  description: z.string().trim().optional(),
  price: z.number(),
  category: z.string().trim().optional(),
  deleted: z.boolean().optional(),
});
