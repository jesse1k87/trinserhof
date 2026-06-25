import { type Booking, type Channel, type Status, CHANNELS, STATUSES } from '@trinserhof/types';
import { getBookingValidationErrors } from './getBookingValidationErrors';
import { getYYYYmmDD } from './getYYYYmmDD';
import { uuidv4 } from './uuidv4';

/**
 * One raw booking object as it appears in an uploaded JSON file. Fields can be
 * named anything and hold any type (numbers are often strings in SQL/CSV
 * exports), so everything is `unknown` until the mapping below normalises it.
 */
export type SourceRecord = Record<string, unknown>;

/**
 * The shape we write to Firebase under `bookings/<id>`. It is a superset of the
 * app's `Booking` type: it additionally carries the fields the database expects
 * but that aren't on the slim TS `Booking` type yet (`channel`, `price`,
 * `priceFixed`, `halbpension`, …). Because it includes every `Booking` field
 * with a compatible type, an `ImportedBooking` is assignable to `Booking`.
 */
export type ImportedBooking = {
  id: string;
  email: string;
  phone: string;
  name: string;
  checkIn: string;
  checkOut: string;
  status: Status;
  channel: Channel;
  roomId: string;
  customers: string[];
  adults: number;
  children: number;
  babies: number;
  pets: number;
  price: number;
  priceFixed: string;
  halbpension: boolean;
  notes: string;
  message: string;
  deleted: boolean;
};

// ---------------------------------------------------------------------------
// Value converters — small helpers the mapping uses to coerce a raw source
// value into the type each booking field needs. They are deliberately lenient
// (missing / wrong-typed values fall back to a sensible default) so that one
// odd record doesn't blow up the whole import.
// ---------------------------------------------------------------------------

/** Coerce to a trimmed string. `null`/`undefined` become `fallback`. */
export const toStr = (value: unknown, fallback = ''): string =>
  value === null || value === undefined ? fallback : String(value).trim();

/** Coerce to a finite number. Accepts numeric strings like "60.00"; otherwise `fallback`. */
export const toNum = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

/** Coerce common truthy/falsy representations (true/"true"/1/"yes"/…) to a boolean. */
export const toBool = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  }
  return fallback;
};

/**
 * Normalise a date into a `YYYY-MM-DD` string. An incoming string that already
 * starts with an ISO date keeps its date part verbatim (no `Date` round-trip,
 * so date-only values never shift across timezones); other formats and epoch
 * numbers fall back to `Date` parsing.
 */
export const toDateString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : getYYYYmmDD(value);
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  if (str === '') return '';
  const parsed = new Date(typeof value === 'number' ? value : str);
  return Number.isNaN(parsed.getTime()) ? '' : getYYYYmmDD(parsed);
};

const STATUS_IDS = STATUSES.map(({ id }) => id) as string[];

// Maps assorted spellings (legacy lowercase, common synonyms) onto a valid Status.
// Lookups happen after upper-casing, so add new keys in UPPER_CASE.
const STATUS_ALIASES: Record<string, Status> = {
  MAYBE: 'PENDING',
  CANCELED: 'CANCELLED',
  CHECKIN: 'CHECKED_IN',
  CHECKOUT: 'CHECKED_OUT',
};

/** Normalise a status value to one of the app's `Status` ids (defaults to `NO_STATUS`). */
export const toStatus = (value: unknown): Status => {
  const key = toStr(value).toUpperCase();
  if (STATUS_IDS.includes(key)) return key as Status;
  if (key in STATUS_ALIASES) return STATUS_ALIASES[key];
  return 'NO_STATUS';
};

const CHANNEL_IDS = CHANNELS.map(({ id }) => id) as string[];

// Maps assorted spellings onto a valid Channel. Lookups happen after upper-casing.
const CHANNEL_ALIASES: Record<string, Channel> = {
  'BOOKING.COM': 'BOOKING',
};

/** Normalise a channel value to one of the app's `Channel` ids (defaults to `UNKNOWN`). */
export const toChannel = (value: unknown): Channel => {
  const key = toStr(value).toUpperCase();
  if (CHANNEL_IDS.includes(key)) return key as Channel;
  if (key in CHANNEL_ALIASES) return CHANNEL_ALIASES[key];
  return 'UNKNOWN';
};

/** Coerce to an array of non-empty strings (anything else becomes `[]`). */
export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => toStr(item)).filter((item) => item !== '') : [];

/**
 * For each target booking field, a function that derives its value from one raw
 * source record.
 */
export type BookingImportFieldMapping = {
  [Field in keyof ImportedBooking]: (source: SourceRecord) => ImportedBooking[Field];
};

// ===========================================================================
//  FIELD MAPPING — EDIT THIS to match the field names in YOUR JSON file.
// ===========================================================================
//
//  Each entry below answers: "how do I build this booking field from one raw
//  record in the uploaded file?" The left-hand key is the field we write to
//  Firebase; the right-hand function reads from `source` (the raw record) and
//  returns the value.
//
//  The defaults assume a Firebase-style export, where the field names already
//  match the app (`checkIn`, `checkOut`, `roomId`, `status` = "CONFIRMED", …).
//  If your file uses different names, just point the function at the right key.
//
//  Example — adapting to a WordPress "Hotel Booking" SQL export whose fields
//  are `check_in`, `check_out`, `accom_id`, lowercase `status`, string prices:
//
//      checkIn:  (source) => toDateString(source.check_in),
//      checkOut: (source) => toDateString(source.check_out),
//      roomId:   (source) => toStr(source.accom_id),
//      status:   (source) => toStatus(source.status),   // "confirmed" -> "CONFIRMED"
//      price:    (source) => toNum(source.price),       // "60.00" -> 60
//
//  Use the `to*` converters above so the resulting types are always valid
//  (a booking only imports if it passes getBookingValidationErrors).
//
export const BOOKING_IMPORT_FIELD_MAPPING: BookingImportFieldMapping = {
  // Keep the source id if present, otherwise mint a fresh one.
  id: (source) => toStr(source.id) || uuidv4(),

  // Dates (stored as YYYY-MM-DD).
  checkIn: (source) => toDateString(source.checkIn),
  checkOut: (source) => toDateString(source.checkOut),

  // Guest / contact.
  email: (source) => toStr(source.email),
  phone: (source) => toStr(source.phone),
  name: (source) => toStr(source.name),

  // Room, status and channel (normalised to the app's enums).
  roomId: (source) => toStr(source.roomId),
  status: (source) => toStatus(source.status),
  channel: (source) => toChannel(source.channel),

  // Linked customer ids — usually empty for an external export.
  customers: (source) => toStringArray(source.customers),

  // Party size.
  adults: (source) => toNum(source.adults),
  children: (source) => toNum(source.children),
  babies: (source) => toNum(source.babies),
  pets: (source) => toNum(source.pets),

  // Pricing.
  price: (source) => toNum(source.price),
  priceFixed: (source) => toStr(source.priceFixed),
  halbpension: (source) => toBool(source.halbpension),

  // Free text.
  notes: (source) => toStr(source.notes),
  message: (source) => toStr(source.message),

  // Soft-delete flag (the calendar hides deleted bookings).
  deleted: (source) => toBool(source.deleted),
};

// ===========================================================================

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Pull the raw booking records out of a parsed upload, accepting the common
 * Firebase-like shapes:
 *   - `{ bookings: { <id>: {...} } }`  (a full database export)
 *   - `{ bookings: [ {...} ] }`
 *   - `{ <id>: {...} }`                 (just the bookings node)
 *   - `[ {...}, {...} ]`                (a plain array of bookings)
 */
export const extractSourceBookings = (parsed: unknown): SourceRecord[] => {
  let node: unknown = parsed;
  if (isPlainObject(parsed) && (isPlainObject(parsed.bookings) || Array.isArray(parsed.bookings))) {
    node = parsed.bookings;
  }

  if (Array.isArray(node)) return node.filter(isPlainObject);
  if (isPlainObject(node)) return Object.values(node).filter(isPlainObject);
  return [];
};

/** Apply BOOKING_IMPORT_FIELD_MAPPING to a single raw record. */
export const mapSourceToBooking = (source: SourceRecord): ImportedBooking =>
  Object.fromEntries(
    (Object.keys(BOOKING_IMPORT_FIELD_MAPPING) as Array<keyof ImportedBooking>).map((field) => [
      field,
      BOOKING_IMPORT_FIELD_MAPPING[field](source),
    ]),
  ) as ImportedBooking;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Collect the reasons a mapped booking can't be imported. On top of the app's
 * field-type validation, a booking needs the bare minimum to be placed on the
 * calendar: both dates and a room. (Email is intentionally not required — plenty
 * of legacy bookings don't have one.)
 */
export const getImportedBookingIssues = (booking: ImportedBooking): string[] => {
  const issues = getBookingValidationErrors(booking as Booking);
  if (!DATE_PATTERN.test(booking.checkIn)) issues.push('checkIn must be a date (YYYY-MM-DD)');
  if (!DATE_PATTERN.test(booking.checkOut)) issues.push('checkOut must be a date (YYYY-MM-DD)');
  if (booking.roomId === '') issues.push('roomId is missing');
  return issues;
};

export type PreparedBookingImport = {
  /** How many raw records were found in the file. */
  total: number;
  /** Mapped bookings that pass validation and are ready to write. */
  bookings: ImportedBooking[];
  /** Records that mapped to an invalid booking, with the reasons why. */
  invalid: Array<{ id: string; errors: string[] }>;
};

/**
 * Turn a parsed upload into ready-to-import bookings: extract the records, run
 * each through the field mapping, then split the results into valid bookings
 * and invalid ones (so the UI can preview both before anything is written).
 */
export const prepareBookingsForImport = (parsed: unknown): PreparedBookingImport => {
  const sources = extractSourceBookings(parsed);
  const bookings: ImportedBooking[] = [];
  const invalid: Array<{ id: string; errors: string[] }> = [];

  for (const source of sources) {
    const mapped = mapSourceToBooking(source);
    const errors = getImportedBookingIssues(mapped);
    if (errors.length > 0) {
      invalid.push({ id: mapped.id || '(no id)', errors });
    } else {
      bookings.push(mapped);
    }
  }

  return { total: sources.length, bookings, invalid };
};
