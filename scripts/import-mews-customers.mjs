import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { uuidv4 } from "@trinserhof/helpers";

/**
 * Extracts the customers from a Mews "Reservation report" JSON export and upserts
 * them into the Firebase Realtime Database export file under the `customers` node,
 * following the `Customer` type from `packages/types/src/customer.ts`.
 *
 * Matching is done by email (case-insensitive) and, for customers without an email,
 * by normalized first + last name. When a match is found, the existing record is
 * updated only if the Mews data adds/changes something; otherwise it is left as-is.
 *
 * Usage:
 *   tsx scripts/import-mews-customers.mjs [path/to/mews-export.json] [--dry-run]
 */

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const MEWS_FILE = fileArg
  ? resolve(process.cwd(), fileArg)
  : resolve(
      rootDir,
      "data/mews_exports/Reservation report 01.01.2026 00-00-00 - 01.01.2027 00-00-00.json",
    );
const FIREBASE_FILE = resolve(
  rootDir,
  "data/firebase_exports/trinserhof-default-rtdb-export.json",
);

// Column indices in the "Reservations" report (row 0 holds the header).
const COL = {
  number: 0,
  groupName: 1,
  lastName: 2,
  firstName: 3,
  email: 4,
  phone: 5,
  address: 6,
  nationality: 7,
  created: 12,
};

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

/** Matches things that look like a postal code (DE/AT/IT numeric, NL "1234 AB", CZ "123 45"). */
function isPostcode(part) {
  const compact = part.replace(/\s+/g, "");
  return /^\d{3,5}$/.test(compact) || /^\d{4}[A-Za-z]{2}$/.test(compact);
}

/** Split a street line like "Karl-Pfaff-Siedlung 37" into street + streetNumber. */
function splitStreet(line) {
  // Trailing house number (most common: "Bebelstraße 54A", "Ellernweg 1a").
  const trailing = line.match(/^(.*\S)\s+(\d+\s*[a-zA-Z]?)$/);
  if (trailing) {
    return {
      street: trailing[1].trim(),
      streetNumber: trailing[2].replace(/\s+/g, ""),
    };
  }
  // Leading house number (e.g. French "4 Avenue Henri Pauwels").
  const leading = line.match(/^(\d+\s*[a-zA-Z]?)\s+(\S.*)$/);
  if (leading) {
    return {
      street: leading[2].trim(),
      streetNumber: leading[1].replace(/\s+/g, ""),
    };
  }
  return { street: line };
}

/**
 * Parse a Mews address string into address parts. The report formats addresses as
 * "<street + number>, <city>, <postcode>, [<region>,] <country>", but the number of
 * comma-separated parts varies, so the postcode is located by pattern.
 */
function parseAddress(raw) {
  const value = norm(raw);
  if (!value) return {};

  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return {};

  const result = {};
  Object.assign(result, splitStreet(parts[0]));

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
    // No recognizable postcode: fall back to the second part as the city.
    result.city = parts[1];
  }

  return result;
}

/** Build a Customer (without id) from a reservation row, or null if it has no usable name. */
function customerFromRow(row) {
  const firstName = norm(row[COL.firstName]);
  const lastName = norm(row[COL.lastName]);

  // `name` is required; prefer first name, fall back to last name, then group name.
  let name;
  let surname;
  if (firstName) {
    name = firstName;
    surname = lastName;
  } else if (lastName) {
    name = lastName;
  } else {
    name = norm(row[COL.groupName]);
  }
  if (!name) return null;

  const created = norm(row[COL.created]);

  const customer = {
    name,
    surname,
    email: norm(row[COL.email]),
    phone: norm(row[COL.phone]),
    nationality: norm(row[COL.nationality]),
    // The report has no customer-creation date, so use the reservation's creation date.
    created: created ? created.slice(0, 10) : undefined,
    ...parseAddress(row[COL.address]),
  };

  return clean(customer);
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
 * Merge `incoming` into `base`, preferring non-empty incoming values but keeping the
 * existing id and the earliest creation date. Returns a cleaned customer.
 */
function mergeCustomers(base, incoming) {
  const merged = { ...base };
  for (const field of CUSTOMER_FIELDS) {
    if (field === "id" || field === "created") continue;
    const value = incoming[field];
    if (value != null && value !== "") merged[field] = value;
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
  console.log(`Reading Mews export: ${MEWS_FILE}`);
  const mews = JSON.parse(readFileSync(MEWS_FILE, "utf-8"));

  const reservationsDoc = (mews.Documents ?? []).find(
    (d) => d.Name === "Reservations",
  );
  if (!reservationsDoc)
    throw new Error('No "Reservations" document found in the Mews export.');

  // Skip the header (row 0) and any non-reservation rows (e.g. the trailing "Total" row).
  const rows = reservationsDoc.Data.slice(1).filter(
    (row) => Array.isArray(row) && /^[0-9]+$/.test(String(row[COL.number])),
  );
  console.log(`Found ${rows.length} reservation row(s).`);

  // Collapse reservations that belong to the same customer into one record.
  const mewsCustomers = new Map();
  for (const row of rows) {
    const customer = customerFromRow(row);
    if (!customer) continue;

    const key = customerKey(customer);
    const existing = mewsCustomers.get(key);
    mewsCustomers.set(
      key,
      existing ? mergeCustomers(existing, customer) : customer,
    );
  }
  console.log(`Extracted ${mewsCustomers.size} unique customer(s) from Mews.`);

  console.log(`Reading Firebase export: ${FIREBASE_FILE}`);
  const dbData = JSON.parse(readFileSync(FIREBASE_FILE, "utf-8"));
  dbData.customers = dbData.customers ?? {};

  // Index existing customers so we can match incoming Mews customers to them.
  const keyToId = new Map();
  for (const [id, customer] of Object.entries(dbData.customers)) {
    keyToId.set(customerKey(customer), id);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of mewsCustomers.values()) {
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
      const created = { id, ...incoming };
      dbData.customers[id] = clean(created);
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
  console.error("Failed to import Mews customers:", error);
  process.exitCode = 1;
}
