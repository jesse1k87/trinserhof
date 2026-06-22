import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, goOffline } from "firebase/database";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { FIREBASE_CONFIG } from "@trinserhof/constants";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

try {
  console.log(`Downloading full database content...`);

  const timeoutMs = 30_000;
  const snapshot = await Promise.race([
    get(ref(db)),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timed out after ${timeoutMs / 1000}s waiting for a response — check your connection.`,
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
  const outFile = resolve(outDir, `firebase-export-${timestamp}.json`);

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
