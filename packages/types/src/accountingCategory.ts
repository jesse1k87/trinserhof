import { z } from 'zod';

export const TAX_RATES = [0, 10, 20] as const;
export type TaxRate = (typeof TAX_RATES)[number];

export type AccountingCategory = {
  id: string;
  name: string;
  taxRate: TaxRate;
  ledgerCode: number;
};

export const accountingCategorySchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  ledgerCode: z.number({ message: 'Invalid ledger code' }),
  taxRate: z.union([z.literal(0), z.literal(10), z.literal(20)], {
    message: 'Invalid tax rate',
  }),
});
