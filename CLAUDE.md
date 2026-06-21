# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps in watch/dev mode (via Turborepo) — defaults to staging Firebase DB
npm run build        # Type-check then build all apps — defaults to staging Firebase DB
npm run dev:prod     # Same as dev, but loads .env (production) instead of .env.staging
npm run build:prod   # Same as build, but loads .env (production) instead of .env.staging
npm run tsc          # Type-check all packages
npm run format       # Format all files with Prettier
npm run precommit    # sort-package-json + npm install + format (run before committing)
```

There are no automated tests in this repo.

### Staging environment

All apps read Firebase credentials from the same 7 `FIREBASE_*` env vars (see `.env.example`). `apps/client`, `apps/form`, `apps/server`, and `apps/mews-sync` all load `.env.staging` by **default** — production (`.env`) is only used when `APP_ENV=production` is set (e.g. via `npm run dev:prod` / `npm run build:prod`). This means plain `npm run dev` / `npm run build` on a laptop connect to staging by default, so you can't accidentally read/write production data locally. `.env.staging` is gitignored; copy `.env.staging.example` to create it, using the same values as `.env` except `FIREBASE_DATABASE_URL`, which should point at a second Realtime Database instance created in the same Firebase project (Firebase console → Realtime Database → Create database) — this requires the Blaze plan, since the free Spark plan only allows one Realtime Database instance per project.

Where a second database instance isn't available (e.g. Blaze isn't enabled yet), data can instead be isolated within the **same** database instance via `FIREBASE_DB_NAMESPACE`: `BOOKINGS_PATH` (`packages/constants/src/BOOKINGS_PATH.ts`) resolves to `bookings` when unset, or `<namespace>-bookings` when set — every read/write (`packages/database`, `apps/client`'s `useCollection`, `apps/server/src/firebase.ts`, `apps/mews-sync/src/firebase.ts`) goes through this constant. This is how Netlify branch-deploy previews are isolated today (see Deployment below): they reuse the production `FIREBASE_DATABASE_URL` but set `FIREBASE_DB_NAMESPACE=staging`, landing under `staging-bookings/` instead of `bookings/`. Note this only isolates *data*, not Firebase security rules — any rule scoped to the `bookings` path must be duplicated (or widened) to cover `staging-bookings` too, or branch-preview deploys will get permission-denied errors.

## Architecture

This is a **Turborepo monorepo** (npm workspaces) for Hotel Trinserhof's booking system. Build tooling is **esbuild everywhere — there is no Vite, no webpack, no CRA**. `apps/client`, `apps/form`, `apps/server`, `apps/mews-sync` each have a `build.mjs` that calls `esbuild` directly.

### Apps

- **`apps/client`** — Admin-facing SPA. `src/index.tsx` mounts `src/components/App.tsx`, which gates on Google sign-in then renders `Calendar.tsx` (a `vis-timeline` calendar, one row per room, built from `ROOMS`) and `BookingDetails.tsx` (edit form for the selected booking). `src/hooks/useCollection.ts` is the real-time `onValue` listener on `bookings/`. Only `KNOWN_USERS` (`packages/database/src/index.ts`) can log in; only `ADMINS` can edit (`NoEditingAllowed` from `@bookings/ui` renders for non-admins). Build: esbuild + `esbuild-plugin-tailwindcss`, FIREBASE_* vars baked in via esbuild `define` (see Commands section above re: `.env` vs `.env.staging`). Dev = `watch` (esbuild watch) + `serve` (`http-server`) run concurrently. Deploys to Netlify, publishing `apps/client/public`.
- **`apps/form`** — Guest-facing booking request form (iframe on the hotel website). `src/App.tsx`: on submit, calls `saveBooking` (`@bookings/database`, writes straight to Firebase) **then** `sendEmail` (`src/email.ts`), which POSTs directly to **EmailJS** (`api.emailjs.com`, service `service_3r80pvi`, template `template_nj4b7u7`) — it does **not** call `apps/server`. Has a real vitest suite (`npm run test` in this workspace; root `npm test` runs it too). Same esbuild+tailwind build as client. Output `apps/form/public` isn't deployed anywhere in this repo (hosting config lives elsewhere).
- **`apps/server`** — Express API, deployed on Vercel (`vercel.json` rewrites everything to `apps/server/src`). Exposes `POST /submit` and `POST /update` (`apps/server/src/firebase.ts`). **Currently unused by client/form** — both write to Firebase directly, so these endpoints exist for a future integration (e.g. Stripe, which is referenced but not wired up). It does **not** use `firebase-admin` — `apps/server/src/firebase.ts` uses the regular `firebase/app` + `firebase/database` client SDK, lazily initialized, reading the same 7 `FIREBASE_*` var names as everyone else but via `dotenv` at **runtime** (not esbuild `define` at build time), so the same built bundle can point at different databases depending on the env vars present when it runs.
- **`apps/mews-sync`** — **Unfinished.** Meant to pull reservations from the Mews PMS Connector API and upsert them into Firebase (`upsertBooking` in `src/firebase.ts`, channel `MEWS`). `src/mews.ts`'s `fetchReservations()` currently just throws "not implemented yet" — it's a stub waiting on real Mews sandbox credentials/response shape. Needs `MEWS_CLIENT_TOKEN` / `MEWS_ACCESS_TOKEN` in addition to the 7 `FIREBASE_*` vars (see `apps/mews-sync/.env.example`). Run manually via `npm run sync` (builds then `node dist/index.js`); no scheduler/cron/GitHub Action wired up yet.

### Packages

- **`@bookings/types`** (`packages/types/src/`) — Shared types/Zod schemas, split across `booking.ts`, `status.ts`, `channel.ts`, `room.ts`, `user.ts`, re-exported from `index.ts`.
  - `Status` / `STATUSES`: `PENDING | CONFIRMED | PAID | CANCELLED | BLOCKED | NO_STATUS`
  - `Channel` / `CHANNELS`: `UNKNOWN | AIRBNB | BOOKING | EMAIL | PHONE | MEWS` (each with a display `label`)
  - `RoomTypeId` / `ROOM_TYPES_IDS`: `SUITE | STANDARD_DOUBLE | BASIC_DOUBLE | SINGLE | FAMILY` — `ROOM_TYPES` gives each a `label`, `description`, `pricePerNight` (a flat number, except `BASIC_DOUBLE` which is `{0: 135, 3: 115}` — i.e. 135/night for stays under 3 nights, 115/night at 3+)
  - `RoomId` / `ROOM_IDS`: `'0', '101', '102', '103', '104', '106', '107', '108', '109', '110', '111', '112', '113', '114', '116', '117', '118', '119', '121', '124'` (`'0'` is `defaultRoomId`, a placeholder/unassigned room) — `ROOMS` maps each id to a `Room` (id + type + label + description + pricePerNight)
  - `Booking` = own fields (`id`, `email`, `phone?`, `checkIn`/`checkOut` as `YYYY-MM-DD`, `status`, `roomId`, `channel`, `adults`/`children`/`babies`/`pets`, `price`, `priceFixed`, `roomType?`, `name?`, `notes?`, `message?`) intersected with `OldBooking` (legacy `start`, `end`, `group`, `className`, `contact`, `content`, `deleted`, `updated` — still present in Firebase, see Backwards compatibility below)
  - `bookingSchema` — Zod validator for the current-schema fields, used by `apps/server`
  - `PRICE_PET_PER_NIGHT = 25`
- **`@bookings/database`** (`packages/database/src/index.ts`) — All exports: `getDb()` (returns the singleton `Database`, app initialized at module load from `@bookings/constants`'s `FIREBASE_CONFIG`), `saveBooking(booking)` (merges legacy `contact`/`content` into `notes`, strips legacy fields, generates a `uuidv4` id if missing, `set()`s to `bookings/{id}`), `logIn()` / `logOut(setUser)` (Google popup auth), `getSignedInUser(setUser, setAdmin, setError)` (`onAuthStateChanged` listener; returns the unsubscribe fn), `ADMINS = ['jesse1k87@gmail.com']` (exported). `KNOWN_USERS` (NOT exported, internal only) = `ADMINS` + `['hotel@trinserhof.com', 'jennifer.m.covi@gmail.com', 'jessica.covi@gmail.com', 'ipad@trinserhof.com']`.
- **`@bookings/helpers`** (`packages/helpers/src/`) — Pure functions: `calculatePrice({checkIn, checkOut, roomId, adults, children, pets})`, `bookingsAreDifferent(a, b)` (dirty-check across ~15 fields, used to decide whether to re-save), `makeBookingBackwardsCompatible(booking)` (maps `start`/`end`/`group`/`content` → `checkIn`/`checkOut`/`roomId`/`name`, and legacy lowercase statuses `confirmed`/`maybe`/`employee`/`deleted` → current `Status` enum), `getNewBooking()` (blank booking, check-in today, check-out today+2), `formatCurrency`, `formatDate` (de-DE locale), `dateToString`, `getYYYYmmDD`, `getAmountOfNightsFromDateRange`, `removeTimeFromDate`, `isValidEmailAddress`, `uuidv4`.
- **`@bookings/ui`** (`packages/ui/src/components/`) — `shadcn/` = shadcn/ui primitives (button, card, input, label, textarea, select, accordion, popover, calendar, dialog, sheet, menubar, command, badge, scroll-area, carousel, alert, form, table). Domain components alongside: `FormDatePicker` (range picker + night count), `NumberPicker` (+/- stepper with min/max), `Error`, `NoEditingAllowed`, `GutZuWissen` (hotel info accordion), `Footer`, `HorizontalLine`.
- **`@bookings/constants`** — `FIREBASE_CONFIG`, reading the 7 `FIREBASE_*` env vars from `process.env` (non-secret structure, safe to commit; the actual values come from env, never hardcoded here).

### Data flow

- Bookings live in Firebase Realtime Database under `bookings/<id>`.
- The client subscribes to the entire `bookings` collection via `useCollection` (a real-time `onValue` listener) and filters out `deleted: true` entries.
- Both client and form call `saveBooking` directly against Firebase — `apps/server`'s `/submit` and `/update` are not currently called by either app (see apps/server note above).

### Deployment

- **Client** → Netlify, via `.github/workflows/deploy-client.yml` (not Netlify's native git build — GitHub Actions runs `turbo run build --filter=client` then pushes `apps/client/public` with `netlify-cli`). Pushes to `main` deploy `--prod`. Pushes to any other branch deploy as a **branch deploy** (`--alias=<slugified-branch-name>`), reachable at `https://<slug>--<site-name>.netlify.app` on the same site. Branch deploys reuse the production `FIREBASE_DATABASE_URL` but set `FIREBASE_DB_NAMESPACE=staging`, so they read/write `staging-bookings/` instead of `bookings/` (see `BOOKINGS_PATH` under Staging environment above) — lets you test a feature branch on a real URL without touching production data, without needing a second Realtime Database instance.
- **Server** → Vercel (`apps/server/vercel.json`; env vars set in Vercel's dashboard UI, not committed)
- **Form** → built output in `apps/form/public` (hosting not configured in this repo)
- **mews-sync** → not deployed; run manually (`npm run sync` in that workspace)

### Backwards compatibility

`OldBooking` fields (`start`, `end`, `group`, `className`, `contact`, `content`) still exist in Firebase. `makeBookingBackwardsCompatible` (`packages/helpers`) maps them to the current schema on read. When writing, `saveBooking` in `packages/database` strips the old fields.

### Known rough edges (don't "fix" without asking — may be intentional/in-progress)

- `apps/mews-sync`'s `fetchReservations()` is a stub that throws; the Mews integration isn't live yet.
- `apps/server`'s `/submit` and `/update` endpoints have no current caller; Stripe is referenced in env vars (`STRIPE_PRIVATE_KEY`) but not wired into any code path yet.
- `apps/mews-sync/.env.example` is missing `MEWS_CLIENT_TOKEN`/`MEWS_ACCESS_TOKEN` even though `mews.ts` requires them.
- Root `package.json`'s `repository.url` still points at `jesse-mtm/bookings`, not the actual repo.
