import { z } from 'zod';

// A property is a hotel. For now the system manages a single property
// (Hotel Trinserhof), but the model is multi-property ready: every `Room`
// references the property it belongs to by `Room.propertyId`. Properties live
// in the database (see the Property model in packages/supabase/prisma/schema.prisma)
// and are managed on the Properties page in the PMS app.
export type PropertyId = string;

export type Property = {
  id: PropertyId;
  name: string;
  legalName: string;
  website: string;
  phone: string;
  // Stored as a free-form "HH:MM" string (e.g. "15:00").
  checkInTime: string;
  checkOutTime: string;
  address: string;
  // The city/tourist tax charged per guest per night, in euros.
  cityTaxPerPersonPerNight: number;
  taxRegistryNumber: string;
  iban: string;
  bic: string;
};

export const propertySchema = z.object({
  id: z.string({ message: 'Invalid id' }).trim().min(1),
  name: z.string({ message: 'Invalid name' }).trim().min(1),
  legalName: z.string({ message: 'Invalid legal name' }).trim().min(1),
  website: z.string().trim(),
  phone: z.string().trim(),
  checkInTime: z.string().trim(),
  checkOutTime: z.string().trim(),
  address: z.string().trim(),
  cityTaxPerPersonPerNight: z
    .number({ message: 'Invalid city tax' })
    .nonnegative('Invalid city tax'),
  taxRegistryNumber: z.string().trim(),
  iban: z.string().trim(),
  bic: z.string().trim(),
});
