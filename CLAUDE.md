# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps in watch/dev mode (via Turborepo)
npm run build        # Type-check then build all apps
npm run tsc          # Type-check all packages
npm run test         # Run vitest suites (only apps/form, apps/mews-sync, packages/helpers have tests)
npm run format       # Format all files with Prettier
npm run precommit    # sort-package-json + npm install + format (run before committing)
```

### Environment

**Trunk-based development for now:** all work happens directly on `main` (short-lived branches/PRs are fine, but there's no separate long-lived staging or test branch). There's also only one environment/database for the time being — no staging vs. production split — since this app has no production users yet and isn't handling real booking data.

All Firebase config values (`apiKey`, `appId`, `authDomain`, `databaseURL`, `messagingSenderId`, `projectId`, `storageBucket`, `measurementId`) are hardcoded in `packages/constants/src/FIREBASE_CONFIG.ts` (non-secret, ship in client bundles anyway) — no env vars involved, since there's only one Firebase project/database for now.

## Architecture

Turborepo monorepo (npm workspaces) for Hotel Trinserhof's booking system. Build tooling: esbuild everywhere (no Vite/webpack/CRA) — each app has a `build.mjs` calling esbuild directly.

### Apps

- **`apps/pms`** — The PMS app (admin-facing SPA). `src/index.tsx` mounts `src/components/App.tsx` — gates on Google sign-in, then renders `Calendar.tsx` (`vis-timeline`, one row per room, built from the `useRooms` hook's real-time Firebase listener) and `BookingDetails.tsx` (edit form for the selected booking). `src/hooks/useCollection.ts` is the real-time `onValue` listener on `bookings/`. Login and edit access come from the Firebase `users` collection (read by `getSignedInUser` in `packages/database/src/index.ts`): only accounts with a matching user record can log in, and only those with `isAdmin: true` can edit (`NoEditingAllowed` from `@trinserhof/ui` renders otherwise). Build: esbuild + `esbuild-plugin-tailwindcss` (Firebase config hardcoded in `@trinserhof/constants`, nothing baked in via esbuild `define`). Dev = `watch` (esbuild watch) + `serve` (`http-server`) concurrently. `apps/pms/public` isn't deployed anywhere in this repo (hosting lives elsewhere).
- **`apps/form`** — Guest-facing booking request form (iframe on the hotel website). `src/App.tsx` on submit: `saveBooking` (`@trinserhof/database`, writes straight to Firebase) then `sendEmail` (`src/email.ts`) POSTs directly to **EmailJS** (`api.emailjs.com`, service `service_3r80pvi`, template `template_nj4b7u7`) — never calls `apps/server`. Has a vitest suite (`src/email.test.ts`). Same esbuild+tailwind build as the PMS app. `apps/form/public` isn't deployed anywhere in this repo (hosting lives elsewhere).
- **`apps/server`** — Express API on Vercel (`vercel.json` rewrites everything to `apps/server/src`). Exposes `POST /submit`/`POST /update` (`apps/server/src/firebase.ts`) — currently unused by the PMS app/form (both write to Firebase directly; `apps/pms/src/submit.ts` calls `/submit` but isn't imported/wired into the UI, and `apps/pms/src/helpers/pushBooking.ts`'s `/update` call is fully commented out). Exists for a future integration (e.g. Stripe, referenced via `STRIPE_PRIVATE_KEY` but not wired up — `apps/server/src/stripe.ts` is one commented-out line). Uses the regular `firebase/app`+`firebase/database` client SDK (not `firebase-admin`), lazily initialized from `@trinserhof/constants`'s `FIREBASE_CONFIG` (fully hardcoded, including `databaseURL`).
- **`apps/mews-sync`** — **Unfinished.** Meant to pull reservations from the Mews PMS Connector API and upsert them into Firebase (`upsertBooking` in `src/firebase.ts`, channel `MEWS`). `src/mews.ts`'s `fetchReservations()` is implemented (POSTs to the Mews Connector `reservations/getAll` endpoint with `MEWS_CLIENT_TOKEN`/`MEWS_ACCESS_TOKEN`/`MEWS_SERVICE_ID`, has tests in `mews.test.ts`) but per its own comment is unverified against a live sandbox. `src/index.ts`'s `main()` only fetches and logs the count — it does **not** yet map reservations to `Booking`s or call `upsertBooking` (see `TODO` there). Run manually via `npm run sync` (builds then `node dist/index.js`); no scheduler/cron/GitHub Action wired up yet.

### Packages

- **`@trinserhof/types`** (`packages/types/src/`) — Shared types/Zod schemas, split across `booking.ts`, `status.ts`, `channel.ts`, `room.ts`, `user.ts`, re-exported from `index.ts`.
  - `Status` / `STATUSES`: `PENDING | CONFIRMED | PAID | CANCELLED | BLOCKED | NO_STATUS`
  - `Channel` / `CHANNELS`: `UNKNOWN | AIRBNB | BOOKING | EMAIL | PHONE | MEWS` (each with a display `label`)
  - `RoomTypeId` / `ROOM_TYPES_IDS`: `SUITE | STANDARD_DOUBLE | BASIC_DOUBLE | SINGLE | FAMILY` — `ROOM_TYPES` gives each a `label`, `description`
  - `RoomId` is just `string` (`RoomIdEnum` is a non-empty string, not a fixed enum) — `defaultRoomId` (`'0'`) is a placeholder/unassigned room id. Actual rooms (id + type + label + description) live in Firebase under `rooms/<id>`, not hardcoded — see `apps/pms/src/hooks/useRooms.ts` (real-time listener) and `@trinserhof/database`'s `saveRoom`/`deleteRoom`
  - `Booking` = own fields (`id`, `email`, `phone?`, `checkIn`/`checkOut` as `YYYY-MM-DD`, `status`, `roomId`, `channel`, `adults`/`children`/`babies`/`pets`, `price`, `priceFixed`, `roomType?`, `name?`, `notes?`, `message?`) intersected with `OldBooking` (legacy `start`, `end`, `group`, `className`, `contact`, `content`, `deleted`, `updated` — still present in Firebase, see Backwards compatibility below)
  - `bookingSchema` — Zod validator for the current-schema fields, used by `apps/server`
  - `PRICE_PET_PER_NIGHT = 25`
- **`@trinserhof/database`** (`packages/database/src/index.ts`) — All exports: `getDb()` (returns the singleton `Database`, app initialized at module load from `@trinserhof/constants`'s `FIREBASE_CONFIG`), `saveBooking(booking)` (merges legacy `contact`/`content` into `notes`, strips legacy fields, generates a `uuidv4` id if missing, `set()`s to `bookings/{id}`), `logIn()` / `logOut(setUser)` (Google popup auth), `getSignedInUser(setUser, setAdmin, setError)` (`onAuthStateChanged` listener that resolves the account against the Firebase `users` collection — allowed only if its email matches a user record, admin only if that record's `isAdmin` is true; returns the unsubscribe fn). Allowed users/admins are stored in Firebase (`users/$userId`), not hardcoded in the code.
- **`@trinserhof/helpers`** (`packages/helpers/src/`) — Pure functions: `bookingsAreDifferent(a, b)` (dirty-check across ~15 fields, used to decide whether to re-save), `makeBookingBackwardsCompatible(booking)` (maps `start`/`end`/`group`/`content` → `checkIn`/`checkOut`/`roomId`/`name`, and legacy lowercase statuses `confirmed`/`maybe`/`employee`/`deleted` → current `Status` enum), `getNewBooking()` (blank booking, check-in today, check-out today+2), `formatCurrency`, `formatDate` (de-DE locale), `dateToString`, `getYYYYmmDD`, `getAmountOfNightsFromDateRange`, `removeTimeFromDate`, `isValidEmailAddress`, `uuidv4`. Has a vitest suite for several of these (`getNewBooking.test.ts`, `isValidEmailAddress.test.ts`, `getYYYYmmDD.test.ts`, `formatCurrency.test.ts`, `getAmountOfNightsFromDateRange.test.ts`).
- **`@trinserhof/ui`** (`packages/ui/src/components/`) — daisyUI-styled primitives (button, card, input, label, textarea, select, accordion, popover, calendar, dialog, sheet, command, badge, scroll-area, table, checkbox, dropdown-menu, sonner) live flat alongside the domain components: `FormDatePicker` (range picker + night count), `NumberPicker` (+/- stepper with min/max), `Error`, `NoEditingAllowed`, `GutZuWissen` (hotel info accordion), `Footer`, `HorizontalLine`. Styling is daisyUI (Tailwind plugin) — `cn` (`clsx`+`tailwind-merge`) and `cva` are still used for variant composition, but there's no Radix UI; `src/lib/floating.ts` has small custom hooks (`useFloatingPosition`, `useOutsideInteraction`) backing popover/select/dropdown positioning.
- **`@trinserhof/constants`** — `FIREBASE_CONFIG`: every value (`apiKey`/`appId`/`authDomain`/`databaseURL`/`messagingSenderId`/`projectId`/`storageBucket`/`measurementId`) is a hardcoded literal (non-secret, safe to commit). Also `OWNER_EMAIL` (the single account allowed to overwrite the raw database, mirroring the `.write` rule in `database.rules.json`).

### Data flow

- Bookings live in Firebase Realtime Database under `bookings/<id>`.
- The PMS app subscribes to the entire `bookings` collection via `useCollection` (a real-time `onValue` listener) and filters out `deleted: true` entries.
- Both the PMS app and form call `saveBooking` directly against Firebase — `apps/server`'s `/submit` and `/update` are not currently called by either app (see apps/server note above).

### Pricing

- Nightly prices are keyed by room **type** (not by individual room), stored under a single `prices` node: `prices/base/<roomTypeId>` (the default nightly price for a room type) and `prices/overrides/<YYYY-MM-DD>/<roomTypeId>` (a per-night override that wins over the base). Types/schema live in `@trinserhof/types`'s `price.ts` (`Prices`, `EMPTY_PRICES`); writes go through `@trinserhof/database`'s `saveBasePrice` / `savePriceOverride` / `deletePriceOverride`.
- The PMS app reads prices via the `usePrices` hook (real-time `onValue` on `prices`). The **Prices** page (`apps/pms/src/components/PricesTable.tsx`, gated on the `PRICE` entity permission) edits base prices and per-night overrides in a month grid.
- `@trinserhof/helpers`'s `getStayPriceBreakdown` / `getNightsInDateRange` resolve the effective price per night (override ?? base) across a stay (check-in inclusive, check-out exclusive); `BookingDetails` uses them to show the computed total for the selected room + date range. The total is display-only — it is not persisted on the booking.

### Deployment

- **Client** → hosting not configured in this repo. Google Sign-In (Firebase Auth) only allows redirects to domains on its "Authorized domains" allowlist in the Firebase console, so any deploy domain in use needs to be added there or sign-in will fail even though the build succeeds.
- **Server** → Vercel (`apps/server/vercel.json`; env vars set in Vercel's dashboard UI, not committed)
- **Form** → built output in `apps/form/public` (hosting not configured in this repo)
- **mews-sync** → not deployed; run manually (`npm run sync` in that workspace)

### Backwards compatibility

`OldBooking` fields (`start`, `end`, `group`, `className`, `contact`, `content`) still exist in Firebase. `makeBookingBackwardsCompatible` (`packages/helpers`) maps them to the current schema on read. When writing, `saveBooking` in `packages/database` strips the old fields.

### Known rough edges (don't "fix" without asking — may be intentional/in-progress)

- `apps/mews-sync`'s `src/index.ts` only fetches reservations and logs the count; it doesn't map them to `Booking`s or call `upsertBooking` yet (see `TODO` in that file) — the Mews integration isn't live yet.
- `apps/server`'s `/submit` and `/update` endpoints have no current caller; Stripe is referenced in env vars (`STRIPE_PRIVATE_KEY`) but not wired into any code path yet.
- Root `package.json`'s `repository.url` still points at `jesse-mtm/bookings`, not the actual repo.
