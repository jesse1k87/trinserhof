import { Property } from '@trinserhof/types';

// The id every seeded room is attached to, and the id used to backfill the
// mandatory Room -> Property relation in the migration. Kept stable so re-seeding
// is idempotent (looked up by id).
export const DEFAULT_PROPERTY_ID = 'HOTEL_TRINSERHOF';

// The reference property every build must have. The owner can edit these values
// on the Properties page in the PMS app; this fixture only fills them in when the
// property is missing (see prisma/seed.ts), so app edits are never overwritten.
export const PROPERTIES: Property[] = [
  {
    id: DEFAULT_PROPERTY_ID,
    name: 'Hotel Trinserhof',
    legalName: 'Hotel Trinserhof GmbH',
    website: 'https://www.trinserhof.at',
    email: 'info@trinserhof.at',
    phone: '+43 5275 0000',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    address: 'Trins 1, 6152 Trins, Austria',
    cityTaxPerPersonPerNight: 2.6,
    taxRegistryNumber: 'ATU00000000',
    iban: 'AT00 0000 0000 0000 0000',
    bic: 'XXXXATWW',
  },
];
