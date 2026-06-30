/**
 * One-off data migration: import customers and bookings from a Mews
 * "Reservation report" JSON export into the Supabase (Postgres) database.
 *
 * The report is a list of "Documents"; we only read:
 *   - "Reservations"  – one row per reservation (the bookings + their guest)
 *   - "Age categories" – the adults/children breakdown, joined by reservation number
 * Invoices/bills ("Bills" column, "Stay Totals" document) are ignored.
 *
 * For every reservation we build a `Customer` (guest details: name, email, phone,
 * address, …) and a `Booking`, and relate the booking to its customer via
 * `booking.customers = [customer.id]`. Customers that appear on several
 * reservations (matched by email, or by name when there is no email) are
 * collapsed into a single record so a returning guest is stored once.
 *
 * Before writing, the script wipes the existing `Booking` and `Customer` tables
 * (via `wipeBookings` / `wipeCustomers`) so the import always starts from a clean
 * slate — it is not run with `--dry-run`, since dry runs perform no writes.
 *
 * The database connection is established through the `@trinserhof/supabase`
 * package: `saveCustomer` / `saveBooking` upsert through `getSupabaseClient()`.
 * Ids are derived deterministically (customer: a hash of the match key, booking:
 * the Mews reservation identifier), so the import is idempotent — re-running it
 * upserts the same rows instead of creating duplicates.
 *
 * Usage:
 *   npm run import-mews -- [path/to/export.json] [--dry-run]
 *   tsx scripts/import-mews.ts [path/to/export.json] [--dry-run]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OWNER_ROLE, type Booking, type Customer } from '@trinserhof/types';
import { saveBooking, saveCustomer, wipeBookings, wipeCustomers } from '@trinserhof/supabase';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const MEWS_FILE = resolve(rootDir, '../../data/mews/mews.json');

type Row = unknown[];

/** Trim a value, returning undefined for null/empty strings. */
function norm(value: unknown): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** A deterministic UUID-shaped id derived from a stable key (so reruns upsert). */
function deterministicId(key: string): string {
  const h = createHash('sha1').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Normalize a Mews datetime ("2026-05-28T16:10:04.3130522", no offset) to a UTC ISO string. */
function toIsoDateTime(raw: unknown): string | undefined {
  const v = norm(raw);
  if (!v) return undefined;
  // JS `Date` only parses up to millisecond precision; Mews emits 7 fractional digits.
  const trimmed = v.replace(/(\.\d{3})\d+/, '$1');
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Take the calendar date (YYYY-MM-DD) from a Mews datetime, ignoring the time/zone. */
function toDateOnly(raw: unknown): string | undefined {
  const v = norm(raw);
  if (!v) return undefined;
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined;
}

// --- Address parsing -------------------------------------------------------
// Mews formats addresses as "<street + number>, <city>, <postcode>, [<region>,] <country>",
// but the number of comma-separated parts varies, so the postcode is located by pattern.

/** Matches things that look like a postal code (DE/AT/IT numeric, NL "1234 AB", CZ "123 45"). */
function isPostcode(part: string): boolean {
  const compact = part.replace(/\s+/g, '');
  return /^\d{3,5}$/.test(compact) || /^\d{4}[A-Za-z]{2}$/.test(compact);
}

/** Split a street line like "Karl-Pfaff-Siedlung 37" into street + streetNumber. */
function splitStreet(line: string): { street?: string; streetNumber?: string } {
  const trailing = line.match(/^(.*\S)\s+(\d+\s*[a-zA-Z]?)$/);
  if (trailing) {
    return {
      street: trailing[1].trim(),
      streetNumber: trailing[2].replace(/\s+/g, ''),
    };
  }
  const leading = line.match(/^(\d+\s*[a-zA-Z]?)\s+(\S.*)$/);
  if (leading) {
    return {
      street: leading[2].trim(),
      streetNumber: leading[1].replace(/\s+/g, ''),
    };
  }
  return { street: line };
}

type AddressParts = Pick<Customer, 'street' | 'streetNumber' | 'postcode' | 'city' | 'country'>;

function parseAddress(raw: unknown): AddressParts {
  const value = norm(raw);
  if (!value) return {};

  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return {};

  const result: AddressParts = { ...splitStreet(parts[0]) };

  if (parts.length >= 2) {
    result.country = parts[parts.length - 1];
  }

  // Find the postcode among the middle parts, preferring the one closest to the country.
  let postcodeIndex = -1;
  for (let i = parts.length - 2; i >= 1; i--) {
    if (isPostcode(parts[i])) {
      postcodeIndex = i;
      break;
    }
  }

  if (postcodeIndex !== -1) {
    result.postcode = parts[postcodeIndex];
    if (postcodeIndex - 1 >= 1) result.city = parts[postcodeIndex - 1];
  } else if (parts.length >= 3) {
    result.city = parts[1];
  }

  return result;
}

// --- Field mapping ---------------------------------------------------------

function mapStatus(raw: unknown): Booking['status'] {
  switch (norm(raw)?.toLowerCase()) {
    case 'confirmed':
      return 'CONFIRMED';
    case 'checked in':
      return 'CHECKED_IN';
    case 'checked out':
      return 'CHECKED_OUT';
    case 'canceled':
    case 'cancelled':
      return 'CANCELLED';
    // "Optional", blank, and anything unrecognized fall back to the default.
    default:
      return 'PENDING';
  }
}

function mapOrigin(source: unknown): Booking['origin'] {
  switch (norm(source)?.toLowerCase()) {
    case 'website':
    case 'online booking form':
      return 'WEBSITE_FORM_MEWS';
    case 'email':
    case 'message':
      return 'EMAIL';
    case 'in person':
      return 'IN_PERSON';
    case 'telephone':
      return 'PHONE';
    default:
      return 'UNKNOWN';
  }
}

/** Resolve a column index by header name; throws if the report changed shape. */
function indexer(header: Row): (name: string) => number {
  return (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`Column "${name}" not found in the Mews export.`);
    return i;
  };
}

/** Dedup key: email when present, otherwise normalized name + surname. */
function customerKey(name: string, surname: string | undefined, email: string | undefined): string {
  if (email) return `email:${email.toLowerCase()}`;
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  const s = (surname ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `name:${n}|${s}`;
}

/** Fill empty fields of `base` from `incoming`, keeping the earliest creation date. */
function mergeCustomer(base: Customer, incoming: Customer): Customer {
  const merged: Customer = { ...base };
  for (const [field, value] of Object.entries(incoming) as [keyof Customer, string][]) {
    if (field === 'id' || field === 'created') continue;
    if (value != null && value !== '' && (merged[field] == null || merged[field] === '')) {
      (merged as Record<string, unknown>)[field] = value;
    }
  }
  const dates = [base.created, incoming.created].filter(Boolean).sort();
  if (dates.length > 0) merged.created = dates[0];
  return merged;
}

/** Drop undefined/empty optional fields so we never write blank strings. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === '') delete obj[key];
  }
  return obj;
}

async function main() {
  if (!dryRun) {
    console.log('Wiping existing bookings...');
    const { bookingsDeleted } = await wipeBookings(OWNER_ROLE);
    console.log('Wiping existing customers...');
    const { customersDeleted } = await wipeCustomers(OWNER_ROLE);
    console.log(` - Deleted ${bookingsDeleted} booking(s), ${customersDeleted} customer(s).`);
  }

  console.log(`Reading Mews export: ${MEWS_FILE}`);
  const mews = JSON.parse(readFileSync(MEWS_FILE, 'utf-8')) as {
    Documents?: { Name: string; Data: Row[] }[];
  };

  const reservationsDoc = (mews.Documents ?? []).find((d) => d.Name === 'Reservations');
  if (!reservationsDoc) throw new Error('No "Reservations" document found in the Mews export.');

  const resHeader = reservationsDoc.Data[0];
  const resCol = indexer(resHeader);
  const C = {
    number: resCol('Number'),
    lastName: resCol('Last name'),
    firstName: resCol('First name'),
    groupName: resCol('Group name'),
    email: resCol('Email'),
    phone: resCol('Telephone'),
    address: resCol('Address'),
    nationality: resCol('Customer nationality'),
    status: resCol('Status'),
    created: resCol('Created'),
    confirmed: resCol('Confirmed'),
    canceled: resCol('Canceled'),
    arrival: resCol('Arrival'),
    departure: resCol('Departure'),
    personCount: resCol('Person count'),
    spaceNumber: resCol('Space number'),
    source: resCol('Reservation source'),
    avgRate: resCol('Average rate (nightly)'),
    notes: resCol('Notes'),
    identifier: resCol('Identifier'),
  };

  // Skip the header (row 0) and any non-reservation rows (e.g. the trailing "Total" row).
  const rows = reservationsDoc.Data.slice(1).filter(
    (row) => Array.isArray(row) && /^\d+$/.test(String(row[C.number])),
  );
  console.log(`Found ${rows.length} reservation row(s).`);

  // Age breakdown, joined to a reservation by its number.
  const ageByNumber = new Map<string, { adults: number; children: number }>();
  const ageDoc = (mews.Documents ?? []).find((d) => d.Name === 'Age categories');
  if (ageDoc) {
    const ageHeader = ageDoc.Data[0];
    const ageCol = indexer(ageHeader);
    const aNum = ageCol('Number');
    const aAdults = ageCol('Adults');
    const aBaby = ageCol('Baby');
    const aChildren = ageCol('Children');
    for (const row of ageDoc.Data.slice(1)) {
      const number = norm(row[aNum]);
      if (!number || !/^\d+$/.test(number)) continue;
      ageByNumber.set(number, {
        adults: Number(row[aAdults]) || 0,
        children: (Number(row[aBaby]) || 0) + (Number(row[aChildren]) || 0),
      });
    }
  }

  // First pass: collapse reservations into unique customers (keyed by email/name).
  const customersByKey = new Map<string, Customer>();
  // Map each reservation number → the key of its (deduped) customer.
  const customerKeyByReservation = new Map<string, string>();

  for (const row of rows) {
    const number = String(row[C.number]);
    const firstName = norm(row[C.firstName]);
    const lastName = norm(row[C.lastName]);

    // `name` is required; prefer first name, fall back to last name, then group name.
    let name: string | undefined;
    let surname: string | undefined;
    if (firstName) {
      name = firstName;
      surname = lastName;
    } else if (lastName) {
      name = lastName;
    } else {
      name = norm(row[C.groupName]);
    }
    if (!name) {
      console.warn(`  ! reservation ${number} has no usable customer name – skipping.`);
      continue;
    }

    const email = norm(row[C.email]);
    const key = customerKey(name, surname, email);
    customerKeyByReservation.set(number, key);

    const incoming: Customer = clean({
      id: deterministicId(key),
      // The report has no customer-creation date; use the reservation's.
      created: toDateOnly(row[C.created]) ?? toDateOnly(row[C.arrival]) ?? '1970-01-01',
      name,
      surname,
      email,
      phone: norm(row[C.phone]),
      nationality: norm(row[C.nationality]),
      ...parseAddress(row[C.address]),
    } as Customer);

    const existing = customersByKey.get(key);
    customersByKey.set(key, existing ? mergeCustomer(existing, incoming) : incoming);
  }
  console.log(`Extracted ${customersByKey.size} unique customer(s).`);

  // Second pass: build the bookings, each related to its customer.
  const bookings: Booking[] = [];
  for (const row of rows) {
    const number = String(row[C.number]);
    const key = customerKeyByReservation.get(number);
    if (!key) continue; // reservation had no customer (already warned)
    const customer = customersByKey.get(key);
    if (!customer) continue;

    const checkIn = toDateOnly(row[C.arrival]);
    const checkOut = toDateOnly(row[C.departure]);
    if (!checkIn || !checkOut) {
      console.warn(`  ! reservation ${number} has no arrival/departure – skipping booking.`);
      continue;
    }

    const status = mapStatus(row[C.status]);
    const age = ageByNumber.get(number);
    const adults = age ? age.adults : Number(row[C.personCount]) || 0;
    const children = age ? age.children : 0;
    const avgRate = Number(row[C.avgRate]);

    const identifier = norm(row[C.identifier]);
    const booking: Booking = clean({
      id: identifier ?? deterministicId(`reservation:${number}`),
      created: toIsoDateTime(row[C.created]) ?? `${checkIn}T00:00:00.000Z`,
      origin: mapOrigin(row[C.source]),
      status,
      checkIn,
      checkOut,
      confirmed: toIsoDateTime(row[C.confirmed]),
      cancelled: toIsoDateTime(row[C.canceled]),
      // The export has no separate check-in/out timestamps; derive from the
      // stay dates for guests whose status says it happened.
      checkedIn:
        status === 'CHECKED_IN' || status === 'CHECKED_OUT'
          ? toIsoDateTime(row[C.arrival])
          : undefined,
      checkedOut: status === 'CHECKED_OUT' ? toIsoDateTime(row[C.departure]) : undefined,
      roomId: norm(row[C.spaceNumber]) ?? '',
      customers: [customer.id],
      adults,
      children,
      pets: 0,
      pricePerNight:
        Number.isFinite(avgRate) && avgRate > 0 ? Number((avgRate * 1.1).toFixed(2)) : undefined,
      note: norm(row[C.notes]),
    } as Booking);
    // `clean()` strips empty strings, but an unassigned room is a valid empty
    // `roomId` (see CLAUDE.md), so restore it after cleaning.
    booking.roomId = norm(row[C.spaceNumber]) ?? '';

    bookings.push(booking);
  }
  console.log(`Built ${bookings.length} booking(s).`);

  if (dryRun) {
    console.log('\n[DRY RUN] No writes performed. Sample customer + booking:');
    console.log(JSON.stringify([...customersByKey.values()][0], null, 2));
    console.log(JSON.stringify(bookings[0], null, 2));
    return;
  }

  // Write customers first so the bookings' customer references already exist.
  let customersWritten = 0;
  const customerErrors: { id: string; error: string }[] = [];
  for (const customer of customersByKey.values()) {
    try {
      await saveCustomer(customer);
      customersWritten += 1;
    } catch (error) {
      customerErrors.push({ id: customer.id, error: (error as Error).message });
    }
  }

  let bookingsWritten = 0;
  const bookingErrors: { id: string; error: string }[] = [];
  for (const booking of bookings) {
    try {
      await saveBooking(booking);
      bookingsWritten += 1;
    } catch (error) {
      bookingErrors.push({ id: booking.id, error: (error as Error).message });
    }
  }

  console.log('\n--- Import summary ---');
  console.log(` - Customers written: ${customersWritten}/${customersByKey.size}`);
  console.log(` - Bookings written:  ${bookingsWritten}/${bookings.length}`);
  if (customerErrors.length > 0) {
    console.log(`\n${customerErrors.length} customer(s) failed:`);
    for (const e of customerErrors) console.log(`   ${e.id}: ${e.error}`);
  }
  if (bookingErrors.length > 0) {
    console.log(`\n${bookingErrors.length} booking(s) failed:`);
    for (const e of bookingErrors) console.log(`   ${e.id}: ${e.error}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to import Mews data:', error);
    process.exit(1);
  });
