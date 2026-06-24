import { z } from 'zod';

export const TAX_RATES = [0, 10, 20] as const;
export type TaxRate = (typeof TAX_RATES)[number];

export type ProductCategory = {
  id: string;
  name: string;
  taxRate: TaxRate;
  deleted?: boolean;
};

export const productCategorySchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  taxRate: z.union([z.literal(0), z.literal(10), z.literal(20)], {
    message: 'Invalid tax rate',
  }),
  deleted: z.boolean().optional(),
});
