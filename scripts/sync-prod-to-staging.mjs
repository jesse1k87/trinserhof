// Copies the entire production Realtime Database into staging, anonymizing
// any email addresses found anywhere in the data along the way. Staging is
// treated as fully disposable: its current contents are replaced wholesale.
//
// Requires FIREBASE_DATABASE_URL_PRODUCTION and FIREBASE_DATABASE_URL_STAGING
// env vars (set as GitHub Actions secrets for the manual workflow, or
// exported locally for a one-off run). Falls back to .env / .env.staging at
// the repo root for local convenience.
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, goOffline } from "firebase/database";
import { createHash } from "crypto";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { FIREBASE_CONFIG } from "@trinserhof/constants";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(rootDir, ".env") });
config({ path: resolve(rootDir, ".env.staging") });

const dryRun =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

const prodUrl = process.env.FIREBASE_DATABASE_URL_PRODUCTION;
const stagingUrl = process.env.FIREBASE_DATABASE_URL_STAGING;

if (!prodUrl || !stagingUrl) {
  console.error(
    "Missing required env vars: FIREBASE_DATABASE_URL_PRODUCTION and/or FIREBASE_DATABASE_URL_STAGING",
  );
  process.exit(1);
}

if (prodUrl === stagingUrl) {
  console.error(
    "FIREBASE_DATABASE_URL_PRODUCTION and FIREBASE_DATABASE_URL_STAGING are identical — refusing to run, this would overwrite production.",
  );
  process.exit(1);
}

const sourceApp = initializeApp(
  { ...FIREBASE_CONFIG, databaseURL: prodUrl },
  "source",
);
const targetApp = initializeApp(
  { ...FIREBASE_CONFIG, databaseURL: stagingUrl },
  "target",
);
const sourceDb = getDatabase(sourceApp);
const targetDb = getDatabase(targetApp);

// Matches a bare email address anywhere inside a string (field values like
// `notes`/`message`/legacy `contact`/`content` are freeform and may contain
// one inline rather than being one).
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

// Deterministic so the same address always anonymizes to the same fake one
// (preserves "same guest" relationships across bookings without keeping the
// real address around).
const anonymizeEmail = (email) => {
  const hash = createHash("sha256")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 12);
  return `anon-${hash}@example.invalid`;
};

let emailsAnonymized = 0;

const anonymizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(EMAIL_REGEX, (match) => {
      emailsAnonymized += 1;
      return anonymizeEmail(match);
    });
  }
  if (Array.isArray(value)) {
    return value.map(anonymizeValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, anonymizeValue(v)]),
    );
  }
  return value;
};

try {
  console.log("Reading production database...");
  const timeoutMs = 30_000;
  const withTimeout = (promise, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Timed out after ${timeoutMs / 1000}s waiting for ${label}`,
              ),
            ),
          timeoutMs,
        ),
      ),
    ]);

  const snapshot = await withTimeout(get(ref(sourceDb)), "production read");
  const data = snapshot.val() ?? {};

  console.log("Anonymizing emails...");
  const anonymized = anonymizeValue(data);
  console.log(`Anonymized ${emailsAnonymized} email occurrence(s).`);

  if (dryRun) {
    console.log("Dry run — skipping write to staging.");
  } else {
    console.log("Overwriting staging database...");
    await withTimeout(set(ref(targetDb), anonymized), "staging write");
    console.log(
      "Staging database now mirrors production (with emails anonymized).",
    );
  }
} catch (error) {
  console.error("Failed to sync production into staging:", error);
  process.exitCode = 1;
} finally {
  goOffline(sourceDb);
  goOffline(targetDb);
}
