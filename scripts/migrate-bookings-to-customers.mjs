import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update, goOffline } from "firebase/database";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { FIREBASE_CONFIG } from "@trinserhof/constants";
import { uuidv4 } from "@trinserhof/helpers";

const dryRun = process.argv.includes("--dry-run");

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

try {
  console.log("Fetching bookings...");
  const snapshot = await get(ref(db, "bookings"));
  const bookings = snapshot.val() ?? {};

  const customerUpdates = {};
  const bookingUpdates = {};

  for (const [bookingId, booking] of Object.entries(bookings)) {
    if (Array.isArray(booking.customers) && booking.customers.length > 0) {
      continue;
    }

    const email = booking.email ?? booking.contact;
    if (!email) {
      console.warn(`Skipping booking ${bookingId}: no email to migrate.`);
      continue;
    }

    const customerId = uuidv4();
    customerUpdates[customerId] = {
      id: customerId,
      name: booking.name ?? "",
      email,
      ...(booking.phone ? { phone: booking.phone } : {}),
    };

    bookingUpdates[`bookings/${bookingId}/customers`] = [customerId];
  }

  const customerCount = Object.keys(customerUpdates).length;
  console.log(`Creating ${customerCount} customer record(s)...`);

  const allUpdates = {
    ...Object.fromEntries(
      Object.entries(customerUpdates).map(([id, customer]) => [
        `customers/${id}`,
        customer,
      ]),
    ),
    ...bookingUpdates,
  };

  if (Object.keys(allUpdates).length === 0) {
    console.log("Nothing to migrate.");
  } else if (dryRun) {
    const outDir = resolve(rootDir, "data");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const outFile = resolve(
      outDir,
      `migrate-bookings-to-customers-${timestamp}.json`,
    );

    writeFileSync(outFile, JSON.stringify(allUpdates, null, 2), "utf-8");

    console.log(
      `Dry run: would migrate ${Object.keys(bookingUpdates).length} booking(s) to reference ${customerCount} customer(s).`,
    );
    console.log(`Wrote proposed updates to ${outFile}`);
  } else {
    await update(ref(db), allUpdates);
    console.log(
      `Migrated ${Object.keys(bookingUpdates).length} booking(s) to reference ${customerCount} customer(s).`,
    );
  }
} catch (error) {
  console.error("Failed to migrate bookings to customers:", error);
  process.exitCode = 1;
} finally {
  goOffline(db);
}
