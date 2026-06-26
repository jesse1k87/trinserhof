import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { uuidv4, isValidEmailAddress } from "@trinserhof/helpers";

/**
 * Extracts the customers from an hbook (WordPress "Hotel Booking" plugin) database
 * dump and upserts them into the Firebase Realtime Database export file under the
 * `customers` node, following the `Customer` type from `packages/types/src/customer.ts`.
 *
 * The customers live in the `wp_hb_customers` table (id, email, info JSON with the
 * name). That table has no dates and almost no contact details, so each customer is
 * enriched from its reservations in `wp_hb_resa`: the earliest `received_on` becomes
 * `created`, and the reservation `lang` becomes `language`.
 *
 * Matching is done by email (case-insensitive). Most legacy customers have no valid
 * email and are only identified by a single, often noisy name field, so matching them
 * by name would wrongly merge distinct people. Instead, customers without a valid email
 * get a deterministic id derived from their hbook customer id: distinct hbook customers
 * stay distinct and re-runs remain idempotent. A match is only updated when the hbook
 * data fills in something missing (it never overwrites existing values).
 *
 * Usage:
 *   tsx scripts/import-hbook-customers.mjs [path/to/hbook-export.json] [--dry-run]
 */

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const HBOOK_FILE = fileArg
  ? resolve(process.cwd(), fileArg)
  : resolve(rootDir, "data/hbook_exports/hbook_2026-06-14.json");
const FIREBASE_FILE = resolve(
  rootDir,
  "data/firebase_exports/trinserhof-default-rtdb-export.json",
);

// `created` is required, but customers without a reservation have no date to derive it
// from. Fall back to the export's snapshot date, taken from the filename (hbook_<date>).
const exportDate = HBOOK_FILE.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
const FALLBACK_CREATED = exportDate ?? new Date().toISOString().slice(0, 10);

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

/** Trim a value, returning undefined for null/empty strings. */
function norm(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** JSON.parse that tolerates the occasional malformed `info` blob. */
function safeParse(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** Map an hbook reservation language (e.g. "en_US", "wp-dev-de") to a short code. */
function mapLanguage(lang) {
  if (!lang) return undefined;
  if (/^en/i.test(lang)) return "en";
  if (/de/i.test(lang)) return "de";
  return undefined;
}

/** Deterministic, UUIDv5-shaped id from a seed (SHA-1 based name UUID). */
function deterministicId(seed) {
  const h = createHash("sha1").update(seed).digest("hex");
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
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

/**
 * Fill-gaps merge: add fields the existing record is missing, but never overwrite an
 * existing value (the Firebase data is richer than hbook). Keeps the existing id and
 * the earliest creation date. Returns a cleaned customer.
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

/** Build a Customer (without id) from an hbook customer row, or null if it has no name. */
function customerFromRow(row, resaInfo) {
  const info = safeParse(row.info);

  const firstName = norm(info.first_name);
  const lastName = norm(info.last_name);

  // `name` is required; hbook usually has a single name field, so don't split it.
  let name;
  let surname;
  if (firstName) {
    name = firstName;
    surname = lastName;
  } else if (lastName) {
    name = lastName;
  }
  if (!name) return null;

  const rawEmail = norm(row.email) ?? norm(info.email);
  const email =
    rawEmail && isValidEmailAddress(rawEmail) ? rawEmail : undefined;

  const reservation = resaInfo.get(row.id);

  return clean({
    name,
    surname,
    email,
    created: reservation?.created ?? FALLBACK_CREATED,
    language: reservation?.language,
  });
}

try {
  console.log(`Reading hbook export: ${HBOOK_FILE}`);
  const dump = JSON.parse(readFileSync(HBOOK_FILE, "utf-8"));

  const table = (name) =>
    (dump ?? []).find((el) => el.type === "table" && el.name === name);
  const customersTable = table("wp_hb_customers");
  const reservationsTable = table("wp_hb_resa");
  if (!customersTable)
    throw new Error('No "wp_hb_customers" table found in the hbook export.');

  // Aggregate each customer's reservations: earliest created date + a language (taken
  // from the most recent reservation that has one).
  const resaInfo = new Map();
  for (const r of reservationsTable?.data ?? []) {
    const customerId = norm(r.customer_id);
    if (!customerId) continue;

    const date = (r.received_on ?? "").slice(0, 10);
    const created = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
    const language = mapLanguage(r.lang);

    const entry = resaInfo.get(customerId) ?? {};
    if (created && (!entry.created || created < entry.created))
      entry.created = created;
    if (language && (!entry.languageOn || r.received_on >= entry.languageOn)) {
      entry.language = language;
      entry.languageOn = r.received_on ?? "";
    }
    resaInfo.set(customerId, entry);
  }

  // Convert the customer rows, keeping the hbook id alongside each record.
  const hbookCustomers = [];
  let skippedNoName = 0;
  for (const row of customersTable.data) {
    const customer = customerFromRow(row, resaInfo);
    if (!customer) {
      skippedNoName++;
      continue;
    }
    hbookCustomers.push({ hbookId: row.id, customer });
  }
  console.log(
    `Extracted ${hbookCustomers.length} customer(s) (${skippedNoName} skipped for having no name).`,
  );

  console.log(`Reading Firebase export: ${FIREBASE_FILE}`);
  const dbData = JSON.parse(readFileSync(FIREBASE_FILE, "utf-8"));
  dbData.customers = dbData.customers ?? {};

  // Index existing customers by email so incoming hbook customers can match them.
  const emailToId = new Map();
  for (const [id, customer] of Object.entries(dbData.customers)) {
    if (customer.email) emailToId.set(customer.email.toLowerCase(), id);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const { hbookId, customer } of hbookCustomers) {
    // Customers with a valid email match on email; the rest get a stable id from hbook.
    const targetId = customer.email
      ? emailToId.get(customer.email.toLowerCase())
      : deterministicId(`hbook-customer:${hbookId}`);

    if (targetId && dbData.customers[targetId]) {
      const existing = dbData.customers[targetId];
      const merged = mergeCustomers(existing, customer);
      if (equal(existing, merged)) {
        skipped++;
      } else {
        dbData.customers[targetId] = merged;
        updated++;
      }
    } else {
      const id = targetId ?? uuidv4();
      dbData.customers[id] = clean({ id, ...customer });
      if (customer.email) emailToId.set(customer.email.toLowerCase(), id);
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
  console.error("Failed to import hbook customers:", error);
  process.exitCode = 1;
}
