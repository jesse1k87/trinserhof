# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps in watch/dev mode (via Turborepo) — defaults to staging Firebase DB
npm run build        # Type-check then build all apps — defaults to staging Firebase DB
npm run dev:prod     # Same as dev, but loads .env (production) instead of .env.staging
npm run build:prod   # Same as build, but loads .env (production) instead of .env.staging
npm run tsc          # Type-check all packages
npm run test         # Run vitest suites (only apps/form, apps/mews-sync, packages/helpers have tests)
npm run format       # Format all files with Prettier
npm run precommit    # sort-package-json + npm install + format (run before committing)
```

### Staging environment

6 of 7 Firebase config values (`apiKey`, `appId`, `authDomain`, `messagingSenderId`, `projectId`, `storageBucket`) are hardcoded in `packages/constants/src/FIREBASE_CONFIG.ts` (non-secret, ship in client bundles anyway). Only `databaseURL` differs by environment, read from `FIREBASE_DATABASE_URL` (see `.env.example`). `apps/client`, `apps/form`, `apps/server`, `apps/mews-sync` all load `.env.staging` by default; `.env` (production) only loads when `APP_ENV=production` (set via `dev:prod`/`build:prod`) — so plain `npm run dev`/`build` can't accidentally touch production data. `.env.staging` is gitignored; create it by copying `.env.staging.example` and pointing `FIREBASE_DATABASE_URL` at a second Realtime Database in the same Firebase project (same API keys/Google Sign-In, isolated data). Deployed staging (Netlify branch deploy, Vercel preview) sets `FIREBASE_DATABASE_URL` directly in the platform's dashboard instead — no `.env` file fallback there.

## Architecture

Turborepo monorepo (npm workspaces) for Hotel Trinserhof's booking system. Build tooling: esbuild everywhere (no Vite/webpack/CRA) — each app has a `build.mjs` calling esbuild directly.

### Apps

- **`apps/client`** — Admin-facing SPA. `src/index.tsx` mounts `src/components/App.tsx` — gates on Google sign-in, then renders `Calendar.tsx` (`vis-timeline`, one row per room, built from `ROOMS`) and `BookingDetails.tsx` (edit form for the selected booking). `src/hooks/useCollection.ts` is the real-time `onValue` listener on `bookings/`. Only `KNOWN_USERS` (`packages/database/src/index.ts`) can log in; only `ADMINS` can edit (`NoEditingAllowed` from `@trinserhof/ui` renders otherwise). Build: esbuild + `esbuild-plugin-tailwindcss`; `FIREBASE_DATABASE_URL` baked in via esbuild `define` (other Firebase config hardcoded in `@trinserhof/constants`). Dev = `watch` (esbuild watch) + `serve` (`http-server`) concurrently. Deploys to Netlify, publishing `apps/client/public`.
- **`apps/form`** — Guest-facing booking request form (iframe on the hotel website). `src/App.tsx` on submit: `saveBooking` (`@trinserhof/database`, writes straight to Firebase) then `sendEmail` (`src/email.ts`) POSTs directly to **EmailJS** (`api.emailjs.com`, service `service_3r80pvi`, template `template_nj4b7u7`) — never calls `apps/server`. Has a vitest suite (`src/email.test.ts`). Same esbuild+tailwind build as client. `apps/form/public` isn't deployed anywhere in this repo (hosting lives elsewhere).
- **`apps/server`** — Express API on Vercel (`vercel.json` rewrites everything to `apps/server/src`). Exposes `POST /submit`/`POST /update` (`apps/server/src/firebase.ts`) — currently unused by client/form (both write to Firebase directly; `apps/client/src/submit.ts` calls `/submit` but isn't imported/wired into the UI, and `apps/client/src/helpers/pushBooking.ts`'s `/update` call is fully commented out). Exists for a future integration (e.g. Stripe, referenced via `STRIPE_PRIVATE_KEY` but not wired up — `apps/server/src/stripe.ts` is one commented-out line). Uses the regular `firebase/app`+`firebase/database` client SDK (not `firebase-admin`), lazily initialized from `@trinserhof/constants`'s `FIREBASE_CONFIG`; `databaseURL` is read via `dotenv` at runtime (not esbuild `define`), so one built bundle can target different DBs depending on env vars present when it runs.
- **`apps/mews-sync`** — **Unfinished.** Meant to pull reservations from the Mews PMS Connector API and upsert them into Firebase (`upsertBooking` in `src/firebase.ts`, channel `MEWS`). `src/mews.ts`'s `fetchReservations()` is implemented (POSTs to the Mews Connector `reservations/getAll` endpoint with `MEWS_CLIENT_TOKEN`/`MEWS_ACCESS_TOKEN`/`MEWS_SERVICE_ID`, has tests in `mews.test.ts`) but per its own comment is unverified against a live sandbox. `src/index.ts`'s `main()` only fetches and logs the count — it does **not** yet map reservations to `Booking`s or call `upsertBooking` (see `TODO` there). Run manually via `npm run sync` (builds then `node dist/index.js`); no scheduler/cron/GitHub Action wired up yet.

### Packages

- **`@trinserhof/types`** (`packages/types/src/`) — Shared types/Zod schemas, split across `booking.ts`, `status.ts`, `channel.ts`, `room.ts`, `user.ts`, re-exported from `index.ts`.
  - `Status` / `STATUSES`: `PENDING | CONFIRMED | PAID | CANCELLED | BLOCKED | NO_STATUS`
  - `Channel` / `CHANNELS`: `UNKNOWN | AIRBNB | BOOKING | EMAIL | PHONE | MEWS` (each with a display `label`)
  - `RoomTypeId` / `ROOM_TYPES_IDS`: `SUITE | STANDARD_DOUBLE | BASIC_DOUBLE | SINGLE | FAMILY` — `ROOM_TYPES` gives each a `label`, `description`, `pricePerNight` (a flat number, except `BASIC_DOUBLE` which is `{0: 135, 3: 115}` — i.e. 135/night for stays under 3 nights, 115/night at 3+)
  - `RoomId` / `ROOM_IDS`: `'0', '101', '102', '103', '104', '106', '107', '108', '109', '110', '111', '112', '113', '114', '116', '117', '118', '119', '121', '124'` (`'0'` is `defaultRoomId`, a placeholder/unassigned room) — `ROOMS` maps each id to a `Room` (id + type + label + description + pricePerNight)
  - `Booking` = own fields (`id`, `email`, `phone?`, `checkIn`/`checkOut` as `YYYY-MM-DD`, `status`, `roomId`, `channel`, `adults`/`children`/`babies`/`pets`, `price`, `priceFixed`, `roomType?`, `name?`, `notes?`, `message?`) intersected with `OldBooking` (legacy `start`, `end`, `group`, `className`, `contact`, `content`, `deleted`, `updated` — still present in Firebase, see Backwards compatibility below)
  - `bookingSchema` — Zod validator for the current-schema fields, used by `apps/server`
  - `PRICE_PET_PER_NIGHT = 25`
- **`@trinserhof/database`** (`packages/database/src/index.ts`) — All exports: `getDb()` (returns the singleton `Database`, app initialized at module load from `@trinserhof/constants`'s `FIREBASE_CONFIG`), `saveBooking(booking)` (merges legacy `contact`/`content` into `notes`, strips legacy fields, generates a `uuidv4` id if missing, `set()`s to `bookings/{id}`), `logIn()` / `logOut(setUser)` (Google popup auth), `getSignedInUser(setUser, setAdmin, setError)` (`onAuthStateChanged` listener; returns the unsubscribe fn), `ADMINS = ['jesse1k87@gmail.com']` (exported). `KNOWN_USERS` (NOT exported, internal only) = `ADMINS` + `['hotel@trinserhof.com', 'jennifer.m.covi@gmail.com', 'jessica.covi@gmail.com', 'ipad@trinserhof.com']`.
- **`@trinserhof/helpers`** (`packages/helpers/src/`) — Pure functions: `calculatePrice({checkIn, checkOut, roomId, adults, children, pets})`, `bookingsAreDifferent(a, b)` (dirty-check across ~15 fields, used to decide whether to re-save), `makeBookingBackwardsCompatible(booking)` (maps `start`/`end`/`group`/`content` → `checkIn`/`checkOut`/`roomId`/`name`, and legacy lowercase statuses `confirmed`/`maybe`/`employee`/`deleted` → current `Status` enum), `getNewBooking()` (blank booking, check-in today, check-out today+2), `formatCurrency`, `formatDate` (de-DE locale), `dateToString`, `getYYYYmmDD`, `getAmountOfNightsFromDateRange`, `removeTimeFromDate`, `isValidEmailAddress`, `uuidv4`. Has a vitest suite for several of these (`getNewBooking.test.ts`, `isValidEmailAddress.test.ts`, `getYYYYmmDD.test.ts`, `formatCurrency.test.ts`, `getAmountOfNightsFromDateRange.test.ts`).
- **`@trinserhof/ui`** (`packages/ui/src/components/`) — `shadcn/` = shadcn/ui primitives (button, card, input, label, textarea, select, accordion, popover, calendar, dialog, sheet, menubar, command, badge, scroll-area, carousel, alert, form, table). Domain components alongside: `FormDatePicker` (range picker + night count), `NumberPicker` (+/- stepper with min/max), `Error`, `NoEditingAllowed`, `GutZuWissen` (hotel info accordion), `Footer`, `HorizontalLine`.
- **`@trinserhof/constants`** — `FIREBASE_CONFIG`: `apiKey`/`appId`/`authDomain`/`messagingSenderId`/`projectId`/`storageBucket` are hardcoded literals (non-secret, safe to commit); `databaseURL` is read from `process.env.FIREBASE_DATABASE_URL` since it differs by environment.

### Data flow

- Bookings live in Firebase Realtime Database under `bookings/<id>`.
- The client subscribes to the entire `bookings` collection via `useCollection` (a real-time `onValue` listener) and filters out `deleted: true` entries.
- Both client and form call `saveBooking` directly against Firebase — `apps/server`'s `/submit` and `/update` are not currently called by either app (see apps/server note above).

### Deployment

- **Client** → Netlify via its own Git integration (Continuous Deployment, no GitHub Action). Push to `main` builds with a Production-scoped `FIREBASE_DATABASE_URL` (`netlify.toml`'s `turbo run build`); push to any other branch gets its own branch deploy (`<branch>--<site>.netlify.app`) with a separate staging-scoped `FIREBASE_DATABASE_URL`. Both values live only in Netlify's dashboard (Site settings → Environment variables), not in this repo.
- **Server** → Vercel (`apps/server/vercel.json`; env vars set in Vercel's dashboard UI, not committed)
- **Form** → built output in `apps/form/public` (hosting not configured in this repo)
- **mews-sync** → not deployed; run manually (`npm run sync` in that workspace)

### Backwards compatibility

`OldBooking` fields (`start`, `end`, `group`, `className`, `contact`, `content`) still exist in Firebase. `makeBookingBackwardsCompatible` (`packages/helpers`) maps them to the current schema on read. When writing, `saveBooking` in `packages/database` strips the old fields.

### Known rough edges (don't "fix" without asking — may be intentional/in-progress)

- `apps/mews-sync`'s `src/index.ts` only fetches reservations and logs the count; it doesn't map them to `Booking`s or call `upsertBooking` yet (see `TODO` in that file) — the Mews integration isn't live yet.
- `apps/server`'s `/submit` and `/update` endpoints have no current caller; Stripe is referenced in env vars (`STRIPE_PRIVATE_KEY`) but not wired into any code path yet.
- Root `package.json`'s `repository.url` still points at `jesse-mtm/bookings`, not the actual repo.
