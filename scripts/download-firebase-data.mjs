import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, goOffline } from "firebase/database";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env.APP_ENV === "production" ? "production" : "staging";
config({
  path: resolve(rootDir, env === "production" ? ".env" : ".env.staging"),
});

const FIREBASE_ENV_VARS = [
  "FIREBASE_API_KEY",
  "FIREBASE_APP_ID",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
];

const missing = FIREBASE_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  console.error(
    `(loaded from ${env === "production" ? ".env" : ".env.staging"} at repo root)`,
  );
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  appId: process.env.FIREBASE_APP_ID,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const db = getDatabase(app);

try {
  console.log(`Downloading full database content (${env})...`);

  const timeoutMs = 30_000;
  const snapshot = await Promise.race([
    get(ref(db)),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timed out after ${timeoutMs / 1000}s waiting for a response — check FIREBASE_DATABASE_URL and your connection.`,
            ),
          ),
        timeoutMs,
      ),
    ),
  ]);
  const data = snapshot.val() ?? {};

  const outDir = resolve(rootDir, "data");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  const outFile = resolve(outDir, `firebase-export-${env}-${timestamp}.json`);

  writeFileSync(outFile, JSON.stringify(data, null, 2), "utf-8");

  console.log(`Saved database snapshot to ${outFile}`);
} catch (error) {
  console.error("Failed to download database content:", error);
  console.error(
    "If this is a permission error, check that your Realtime Database security rules allow this read.",
  );
  process.exitCode = 1;
} finally {
  goOffline(db);
}
