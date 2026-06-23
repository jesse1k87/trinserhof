import { z } from 'zod';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  deleted?: boolean;
};

export const customerSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().date().optional(),
  deleted: z.boolean().optional(),
});
