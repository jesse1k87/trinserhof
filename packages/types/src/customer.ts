import { z } from 'zod';

export type Customer = {
  id: string;
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  language?: string;
  street?: string;
  streetNumber?: string;
  postcode?: string;
  city?: string;
  country?: string;
};

export const customerSchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  surname: z.string().trim().optional(),
  email: z.string({ message: 'Invalid email address' }).trim().email().min(1),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().date().optional(),
  nationality: z.string().trim().optional(),
  language: z.string().trim().optional(),
  street: z.string().trim().optional(),
  streetNumber: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
});
