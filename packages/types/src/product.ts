import { z } from 'zod';

export type ProductVariant = {
  name: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  variants?: ProductVariant[];
};

export const productVariantSchema = z.object({
  name: z.string({ message: 'Invalid variant name' }).trim().min(1),
  price: z.number(),
});

export const productSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  price: z.number(),
  categoryId: z.string().trim(),
  variants: z.array(productVariantSchema).optional(),
});
