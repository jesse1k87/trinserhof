import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { uuidv4, isValidEmailAddress } from "@trinserhof/helpers";

/**
 * Extracts the customers embedded in the Firebase Realtime Database backup's
 * `bookings` node and upserts them into the Firebase export file under the
 * `customers` node, following the `Customer` type from `packages/types/src/customer.ts`.
 *
 * Every legacy booking carries its guest inline: the `name` (occasionally only present
 * in the legacy `content` field) and, rarely, an `email`/`phone`. There is no
 * first/last split, so the whole `name` string is kept as-is (a separate name-split
 * workflow handles that later). `created` is taken from the booking's own creation
 * timestamp when present, otherwise the backup's snapshot date.
 *
 * Matching is done by email (case-insensitive) and, for the many guests without an
 * email, by normalized name. Because this backup is the sparsest of the three customer
 * sources (Mews, hbook, Firebase backup), a match only ever *fills gaps* in the
 * existing record — it never overwrites the richer data already imported from the
 * others.
 *
 * Usage:
 *   tsx scripts/import-firebase-backup-customers.mjs [path/to/firebase-backup.json] [--dry-run]
 */

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const BACKUP_FILE = fileArg
  ? resolve(process.cwd(), fileArg)
  : resolve(
      rootDir,
      "data/backups_do_not_edit/raw_data_2026-06-14_firebase.json",
    );
const FIREBASE_FILE = resolve(
  rootDir,
  "data/firebase_exports/trinserhof-default-rtdb-export.json",
);

// `created` is required, but most bookings have no creation timestamp to derive it
// from. Fall back to the backup's snapshot date, taken from the filename (..._<date>_...).
const snapshotDate = BACKUP_FILE.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
const FALLBACK_CREATED = snapshotDate ?? new Date().toISOString().slice(0, 10);

// Order matches the alphabetically-sorted keys used elsewhere in the Firebase export.
const CUSTOMER_FIELDS = [
  "city",
  "country",
  "created",
  "dateOfBirth",
  "email",
  "id",
  "language",
  "name",
  "nationality",
  "phone",
  "postcode",
  "street",
  "streetNumber",
  "surname",
];

/** Trim a value, returning undefined for null/empty or junk ("undefined"/"null") strings. */
function norm(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return undefined;
  // Legacy bookings literally store the string "undefined"/"null" in name/contact.
  const lower = trimmed.toLowerCase();
  if (lower === "undefined" || lower === "null") return undefined;
  return trimmed;
}

/** Drop empty/undefined fields and return an object with alphabetically-sorted keys. */
function clean(customer) {
  const result = {};
  for (const field of CUSTOMER_FIELDS) {
    const value = customer[field];
    if (value != null && value !== "") result[field] = value;
  }
  return result;
}

/** The booking's creation date (YYYY-MM-DD), falling back to the snapshot date. */
function bookingCreatedDate(booking) {
  // Timestamps look like "2024-07-13 19:50:22.567Z"; keep just the date part.
  const date = norm(booking.created)?.slice(0, 10);
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : FALLBACK_CREATED;
}

/** Build a Customer (without id) from a booking, or null if it has no usable name. */
function customerFromBooking(booking) {
  // `name` is required; it lives in `name`, with the legacy `content` field as a fallback.
  const name = norm(booking.name) ?? norm(booking.content);
  if (!name) return null;

  const rawEmail = norm(booking.email);
  const email =
    rawEmail && isValidEmailAddress(rawEmail) ? rawEmail : undefined;

  return clean({
    name,
    email,
    phone: norm(booking.phone),
    created: bookingCreatedDate(booking),
  });
}

/** Dedup/match key: email when present, otherwise normalized name + surname. */
function customerKey(customer) {
  if (customer.email) return `email:${customer.email.toLowerCase()}`;
  const name = (customer.name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const surname = (customer.surname ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `name:${name}|${surname}`;
}

/**
 * Fill-gaps merge: add fields the existing record is missing, but never overwrite an
 * existing value (the Firebase export is richer than this backup). Keeps the existing
 * id and the earliest creation date. Returns a cleaned customer.
 */
function mergeCustomers(base, incoming) {
  const merged = { ...base };
  for (const field of CUSTOMER_FIELDS) {
    if (field === "id" || field === "created") continue;
    const value = incoming[field];
    if (
      (merged[field] == null || merged[field] === "") &&
      value != null &&
      value !== ""
    ) {
      merged[field] = value;
    }
  }
  if (base.id) merged.id = base.id;

  const dates = [base.created, incoming.created].filter(Boolean).sort();
  if (dates.length > 0) merged.created = dates[0];

  return clean(merged);
}

function equal(a, b) {
  return JSON.stringify(clean(a)) === JSON.stringify(clean(b));
}

try {
  console.log(`Reading Firebase backup: ${BACKUP_FILE}`);
  const backup = JSON.parse(readFileSync(BACKUP_FILE, "utf-8"));
  const bookings = backup.bookings ?? {};
  console.log(`Found ${Object.keys(bookings).length} booking(s).`);

  // Collapse bookings that resolve to the same customer into one record.
  const backupCustomers = new Map();
  let skippedNoName = 0;
  for (const booking of Object.values(bookings)) {
    const customer = customerFromBooking(booking);
    if (!customer) {
      skippedNoName++;
      continue;
    }
    const key = customerKey(customer);
    const existing = backupCustomers.get(key);
    backupCustomers.set(
      key,
      existing ? mergeCustomers(existing, customer) : customer,
    );
  }
  console.log(
    `Extracted ${backupCustomers.size} unique customer(s) (${skippedNoName} booking(s) skipped for having no name).`,
  );

  console.log(`Reading Firebase export: ${FIREBASE_FILE}`);
  const dbData = JSON.parse(readFileSync(FIREBASE_FILE, "utf-8"));
  dbData.customers = dbData.customers ?? {};

  // Index existing customers so we can match incoming backup customers to them.
  const keyToId = new Map();
  for (const [id, customer] of Object.entries(dbData.customers)) {
    keyToId.set(customerKey(customer), id);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of backupCustomers.values()) {
    const key = customerKey(incoming);
    const existingId = keyToId.get(key);

    if (existingId) {
      const existing = dbData.customers[existingId];
      const merged = mergeCustomers(existing, incoming);
      if (equal(existing, merged)) {
        skipped++;
      } else {
        dbData.customers[existingId] = merged;
        updated++;
      }
    } else {
      const id = uuidv4();
      dbData.customers[id] = clean({ id, ...incoming });
      keyToId.set(key, id);
      added++;
    }
  }

  // Re-key the customers node with sorted ids / sorted fields for a stable, clean diff.
  const sortedCustomers = {};
  for (const id of Object.keys(dbData.customers).sort()) {
    sortedCustomers[id] = clean(dbData.customers[id]);
  }
  dbData.customers = sortedCustomers;

  console.log(`\n--- Import Summary ---`);
  console.log(` - Added   ${added} new customer(s).`);
  console.log(` - Updated ${updated} existing customer(s).`);
  console.log(` - Skipped ${skipped} unchanged customer(s).`);
  console.log(
    ` - Total   ${Object.keys(dbData.customers).length} customer(s) in the export.`,
  );

  if (dryRun) {
    console.log(`\n[DRY RUN] Bypassed writing to ${FIREBASE_FILE}`);
  } else {
    writeFileSync(
      FIREBASE_FILE,
      `${JSON.stringify(dbData, null, 2)}\n`,
      "utf-8",
    );
    console.log(`\nWrote updated customers to ${FIREBASE_FILE}`);
  }
} catch (error) {
  console.error("Failed to import Firebase backup customers:", error);
  process.exitCode = 1;
}
