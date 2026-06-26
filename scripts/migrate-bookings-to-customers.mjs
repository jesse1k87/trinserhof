import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { uuidv4 } from "@trinserhof/helpers";

const dryRun = process.argv.includes("--dry-run");

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Define input and output paths
const INPUT_FILE = resolve(
  rootDir,
  "data/backups_do_not_edit/raw_data_2026-06-14_firebase.json",
);
const OUTPUT_FILE = resolve(
  rootDir,
  "data/backups_do_not_edit/raw_data_2026-06-14_firebase_migrated.json",
);
const SUGGESTIONS_FILE = resolve(
  rootDir,
  "data/backups_do_not_edit/raw_data_2026-06-14_firebase_customer_suggestions.json",
);

try {
  console.log("Reading local data...");
  const rawData = readFileSync(INPUT_FILE, "utf-8");
  const dbData = JSON.parse(rawData);

  const bookings = dbData.bookings ?? {};
  dbData.customers = dbData.customers ?? {};

  // Build an index of existing customers by email
  const emailToCustomerId = new Map();
  for (const [id, customer] of Object.entries(dbData.customers)) {
    if (customer.email) {
      emailToCustomerId.set(customer.email.toLowerCase().trim(), id);
    }
  }

  let migratedCount = 0;
  let newCustomersCount = 0;
  let mergedCustomersCount = 0;

  for (const [bookingId, booking] of Object.entries(bookings)) {
    if (Array.isArray(booking.customers) && booking.customers.length > 0) {
      continue;
    }

    const rawEmail = booking.email ?? booking.contact;
    if (!rawEmail) continue;

    const normalizedEmail = rawEmail.toLowerCase().trim();
    let customerId;

    // Fallback logic: check name, then content, then group
    const extractedName =
      booking.name || booking.content || booking.group || "";
    const newName = extractedName ? String(extractedName).trim() : "";

    if (emailToCustomerId.has(normalizedEmail)) {
      // Customer exists: Merge data
      customerId = emailToCustomerId.get(normalizedEmail);
      const existingCustomer = dbData.customers[customerId];

      if (newName) {
        // Prevent duplicate names in the comma-separated string
        const currentNames = existingCustomer.name
          ? existingCustomer.name.split(",").map((n) => n.trim())
          : [];

        if (!currentNames.includes(newName)) {
          existingCustomer.name = existingCustomer.name
            ? `${existingCustomer.name}, ${newName}`
            : newName;
        }
      }

      // Optionally grab the phone number if the existing customer record lacks one
      if (!existingCustomer.phone && booking.phone) {
        existingCustomer.phone = booking.phone;
      }

      mergedCustomersCount++;
    } else {
      // Customer does not exist: Create new
      customerId = uuidv4();

      dbData.customers[customerId] = {
        id: customerId,
        name: newName,
        email: rawEmail, // Preserve original casing for the record
        ...(booking.phone ? { phone: booking.phone } : {}),
      };

      // Add to our index so future bookings in this loop find it
      emailToCustomerId.set(normalizedEmail, customerId);
      newCustomersCount++;
    }

    // Update the booking directly in the data tree
    dbData.bookings[bookingId].customers = [customerId];

    migratedCount++;
  }

  // --- POST-PROCESSING: Find fuzzy duplicate suggestions ---
  const suggestions = [];

  // 1. Build rich profiles for all customers to check across text fields
  const profiles = Object.values(dbData.customers).map((c) => {
    // Find all bookings for this customer to build a text corpus
    const relatedBookings = Object.values(bookings).filter((b) =>
      b.customers?.includes(c.id),
    );

    const corpusParts = [];
    for (const b of relatedBookings) {
      if (b.notes) corpusParts.push(b.notes);
      if (b.message) corpusParts.push(b.message);
      if (b.content) corpusParts.push(b.content);
      if (b.group) corpusParts.push(b.group);
    }

    return {
      id: c.id,
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      normName: c.name ? c.name.toLowerCase().replace(/\s+/g, " ").trim() : "",
      normPhone: c.phone ? c.phone.replace(/[^0-9+]/g, "") : "",
      textCorpus: corpusParts.join(" ").toLowerCase(),
    };
  });

  // Helper for identifying shared significant words (e.g., Last Names)
  const getSharedWords = (str1, str2) => {
    const words1 = str1.split(" ").filter((w) => w.length > 4);
    const words2 = str2.split(" ").filter((w) => w.length > 4);
    return words1.filter((w) => words2.includes(w));
  };

  // 2. Pairwise comparison to find fuzzy matches
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const c1 = profiles[i];
      const c2 = profiles[j];

      let matchReason = null;

      // A: Phone matching (Exact or Substring if long enough)
      if (c1.normPhone && c2.normPhone) {
        if (c1.normPhone === c2.normPhone) {
          matchReason = `Exact phone match: ${c1.phone}`;
        } else if (
          c1.normPhone.length > 7 &&
          c2.normPhone.length > 7 &&
          (c1.normPhone.includes(c2.normPhone) ||
            c2.normPhone.includes(c1.normPhone))
        ) {
          matchReason = `Partial phone match: ${c1.phone} / ${c2.phone}`;
        }
      }

      // B: Name matching (Substring or Shared Words)
      if (!matchReason && c1.normName && c2.normName) {
        if (c1.normName === c2.normName) {
          matchReason = `Exact name match: "${c1.name}"`;
        } else if (
          c1.normName.length > 5 &&
          c2.normName.includes(c1.normName)
        ) {
          matchReason = `Partial name match: "${c1.name}" is inside "${c2.name}"`;
        } else if (
          c2.normName.length > 5 &&
          c1.normName.includes(c2.normName)
        ) {
          matchReason = `Partial name match: "${c2.name}" is inside "${c1.name}"`;
        } else {
          const sharedWords = getSharedWords(c1.normName, c2.normName);
          if (sharedWords.length > 0) {
            matchReason = `Shared name part(s): "${sharedWords.join(", ")}"`;
          }
        }
      }

      // C: Cross-referencing in Text Fields (notes, messages, group, content)
      if (!matchReason) {
        if (c1.email && c2.textCorpus.includes(c1.email.toLowerCase())) {
          matchReason = `Email "${c1.email}" found in other customer's booking notes/text`;
        } else if (c2.email && c1.textCorpus.includes(c2.email.toLowerCase())) {
          matchReason = `Email "${c2.email}" found in other customer's booking notes/text`;
        } else if (
          c1.normName &&
          c1.normName.length > 5 &&
          c2.textCorpus.includes(c1.normName)
        ) {
          matchReason = `Name "${c1.name}" found in other customer's booking notes/text`;
        } else if (
          c2.normName &&
          c2.normName.length > 5 &&
          c1.textCorpus.includes(c2.normName)
        ) {
          matchReason = `Name "${c2.name}" found in other customer's booking notes/text`;
        }
      }

      if (matchReason) {
        suggestions.push({
          reason: matchReason,
          customers: [
            { id: c1.id, name: c1.name, email: c1.email, phone: c1.phone },
            { id: c2.id, name: c2.name, email: c2.email, phone: c2.phone },
          ],
        });
      }
    }
  }

  // --- REPORTING & WRITING ---

  // ALWAYS log the findings
  console.log(`\n--- Migration Summary ---`);
  console.log(`Processed ${migratedCount} booking(s).`);
  console.log(` - Created ${newCustomersCount} new customer record(s).`);
  console.log(
    ` - Merged into existing customers ${mergedCustomersCount} time(s).`,
  );
  console.log(
    ` - Found ${suggestions.length} potential customer duplicate pair(s).`,
  );

  if (dryRun) {
    console.log(`\n[DRY RUN] Bypassed writing to ${OUTPUT_FILE}`);
    if (suggestions.length > 0) {
      console.log(
        `[DRY RUN] Bypassed writing suggestions to ${SUGGESTIONS_FILE}`,
      );
    }
  } else {
    const outDir = dirname(OUTPUT_FILE);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    if (migratedCount > 0) {
      writeFileSync(OUTPUT_FILE, JSON.stringify(dbData, null, 2), "utf-8");
      console.log(`\nWrote migrated data to ${OUTPUT_FILE}`);
    } else {
      console.log(
        `\nNo bookings to migrate. Bypassed writing to ${OUTPUT_FILE}`,
      );
    }

    if (suggestions.length > 0) {
      writeFileSync(
        SUGGESTIONS_FILE,
        JSON.stringify(suggestions, null, 2),
        "utf-8",
      );
      console.log(`Wrote duplicate suggestions to ${SUGGESTIONS_FILE}`);
    }
  }
} catch (error) {
  console.error("Failed to migrate local bookings to customers:", error);
  process.exitCode = 1;
}
