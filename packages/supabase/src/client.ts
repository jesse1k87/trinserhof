import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@trinserhof/constants';
import type {
  AuditEvent,
  BookingStatus,
  PermissionKey,
  RoomTypeId,
  Theme,
} from '@trinserhof/types';
import { getFirebaseIdToken } from './firebaseAuth';

// Not exported from @trinserhof/types (only DEFAULT_BOOKING_ORIGIN is) — kept in
// sync with the BookingOrigin enum in prisma/schema.prisma.
export type BookingOrigin =
  | 'IN_PERSON'
  | 'EMAIL'
  | 'PHONE'
  | 'WEBSITE_FORM'
  | 'WEBSITE_FORM_MEWS'
  | 'UNKNOWN';

let client: SupabaseClient | undefined;

export const getSupabaseClient = () => {
  if (!client) {
    client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      // Third-Party Auth: forward the signed-in Firebase user's ID token so
      // PostgREST/RLS authorize requests as that user. Returns null (anonymous)
      // when nobody is signed in.
      accessToken: getFirebaseIdToken,
    });
  }
  return client;
};

// Postgres timestamp columns without `@db.Date` come back from PostgREST without a
// trailing offset (e.g. "2024-01-01T10:00:00"). The rest of the app treats these as
// UTC instants (matching what Prisma's `Date.toISOString()` used to produce), so
// normalize to an explicit UTC ISO string.
export const toUtcIso = (value: string): string =>
  /[Zz]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;

// Row shapes returned by `select('*')` over PostgREST. Column names match the
// Prisma schema 1:1 (no `@map`/`@@map` directives), but unlike `@prisma/client`'s
// generated types, date/timestamp columns come back as plain strings, not `Date`.
export type Booking = {
  id: string;
  created: string;
  origin: BookingOrigin;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  cancelled: string | null;
  confirmed: string | null;
  checkedIn: string | null;
  checkedOut: string | null;
  roomId: string;
  customers: string[];
  adults: number;
  children: number;
  pets: number;
  pricePerNight: number | null;
};

export type Customer = {
  id: string;
  created: string;
  name: string;
  surname: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  language: string | null;
  street: string | null;
  streetNumber: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  created: string;
  customerId: string;
  bookingIds: string[];
  products: unknown;
  notes: string | null;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  accountingCategoryId: string;
  variants: unknown | null;
};

export type AccountingCategory = {
  id: string;
  name: string;
  taxRate: number;
  ledgerCode: number;
  color: string;
};

export type RestaurantTable = {
  id: string;
  number: number;
  areaName: string;
  maxGuests: number;
};

export type RestaurantReservation = {
  id: string;
  start: string;
  numberOfPeople: number;
  tableId: string | null;
  customerId: string | null;
};

export type Room = {
  id: string;
  type: RoomTypeId;
  propertyId: string;
  maxCustomers: number;
  floor: number;
  color: string;
  balcony: boolean | null;
  tv: boolean | null;
  shower: boolean | null;
  bathtub: boolean | null;
  toilet: boolean | null;
  phone: boolean | null;
  desk: boolean | null;
  mountainView: boolean | null;
  kingBed: number | null;
  queenBed: number | null;
  singleBed: number | null;
  sleepSofa: number | null;
  spaces: number | null;
};

export type RoomType = {
  id: RoomTypeId;
  label: string;
  description: string | null;
  basePrice: number;
};

export type Property = {
  id: string;
  name: string;
  legalName: string;
  website: string;
  email: string;
  phone: string;
  checkInTime: string;
  checkOutTime: string;
  address: string;
  cityTaxPerPersonPerNight: number;
  taxRegistryNumber: string;
  iban: string;
  bic: string;
};

export type Price = {
  id: string;
  roomTypeId: RoomTypeId;
  date: string | null;
  amount: number;
};

export type Role = {
  id: string;
  name: string;
  permissions: PermissionKey[];
};

export type User = {
  id: string;
  email: string;
  // References a Role by its id (e.g. "OWNER"); see the Role row above.
  role: string;
  image: string | null;
  theme: Theme | null;
  locale: string | null;
};

export type AuditLogEntry = {
  id: string;
  email: string;
  event: AuditEvent;
  timestamp: number;
};

export type { BookingStatus };
