# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps in watch/dev mode (via Turborepo)
npm run build        # Type-check then build all apps
npm run tsc          # Type-check all packages
npm run test         # Run vitest suites (only packages/helpers have tests)
npm run format       # Format all files with Prettier
npm run precommit    # sort-package-json + npm install + format (run before committing)
```

### Environment

**Trunk-based development for now:** all work happens directly on `main` (short-lived branches/PRs are fine, but there's no separate long-lived staging or test branch). There's also only one environment/database for the time being — no staging vs. production split — since this app has no production users yet and isn't handling real booking data.

All Firebase config values (`apiKey`, `appId`, `authDomain`, `databaseURL`, `messagingSenderId`, `projectId`, `storageBucket`, `measurementId`) are hardcoded in `packages/constants/src/FIREBASE_CONFIG.ts` (non-secret, ship in client bundles anyway) — no env vars involved, since there's only one Firebase project/database for now.

### Agent Skills

`package/firebase` uses Supabase (Postgres via Prisma) for the in-progress customer data migration. Supabase's [Agent Skills](https://github.com/supabase/agent-skills) give AI coding tools ready-made instructions and resources for working with Supabase more accurately and efficiently — install with:

```bash
npx skills add supabase/agent-skills
```

**Seeding:** `packages/supabase/prisma/seed.ts` (run via `npm run db:seed -w @trinserhof/supabase`, or `tsx prisma/seed.ts`) inserts the reference-data fixtures that must exist in every build — currently the hotel's rooms and the base nightly price per room type. It is idempotent: each record is only inserted when missing (looked up by `id`, or by the null `date` for base prices) and existing rows are left untouched, so re-running never overwrites edits made in the app. It runs automatically as the last step of `@trinserhof/supabase`'s `build` (after `db:push` + `db:generate`), and reads `DATABASE_URL` from `packages/supabase/.env` just like `prisma db push`. Edit the `ROOMS`/`BASE_PRICES` arrays in `seed.ts` to change what gets seeded.

## Architecture

Turborepo monorepo (npm workspaces) for Hotel Trinserhof's booking system. Build tooling: esbuild everywhere (no Vite/webpack/CRA) — each app has a `build.mjs` calling esbuild directly.

### Apps

- **`apps/pms`** — The PMS app (admin-facing SPA). `src/index.tsx` mounts `src/components/App.tsx` — gates on Google sign-in, then renders `Calendar.tsx` (`vis-timeline`, one row per room, built from the `useRooms` hook's real-time Firebase listener) and `BookingDetails.tsx` (edit form for the selected booking). `src/hooks/useBookings.ts` fetches bookings from the `Booking` table in Postgres (Supabase) via `getSupabaseClient`. Login and edit access come from the Firebase `users` collection (read by `getSignedInUser` in `packages/firebase/src/index.ts`): only accounts with a matching user record can log in, and only those with `isAdmin: true` can edit (`NoEditingAllowed` from `@trinserhof/ui` renders otherwise). Build: esbuild + `esbuild-plugin-tailwindcss` (Firebase config hardcoded in `@trinserhof/constants`, nothing baked in via esbuild `define`). Dev (`npm run pms`) runs a single `build.mjs watch` process: esbuild watch + esbuild's built-in dev server (serves `public/` on `localhost:8080` with an `index.html` SPA fallback) and live-reloads the browser on every rebuild (a dev-only `EventSource('/esbuild')` in `src/index.tsx`, compiled out of production via the `LIVE_RELOAD` `define`). esbuild already watches everything the bundle imports; `apps/pms/watch.config.mjs` is an easily-editable list of extra (non-imported) files/folders — in any package — to also watch for refresh. `apps/pms/public` isn't deployed anywhere in this repo (hosting lives elsewhere).

### Packages

- **`@trinserhof/types`** (`packages/types/src/`) — Shared types/Zod schemas, split across `booking.ts`, `status.ts`, `channel.ts`, `room.ts`, `user.ts`, re-exported from `index.ts`.
  - `Status` / `STATUSES`: `PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED` (`PENDING` is the default for new bookings and unrecognized/legacy statuses)
  - `RoomTypeId` is just `string` (`RoomTypeIdEnum` is a non-empty string, not a fixed enum). Room types are no longer hardcoded — they live in the database as `RoomType` rows (`id` + `label` + `description?`, see the `RoomType` model in `packages/supabase/prisma/schema.prisma`). `Room.type` and `Price.roomTypeId` reference a `RoomType.id` by value. They're read in the PMS app via the `useRoomTypes` hook and managed on the **Room types** page (`apps/pms/src/components/RoomTypesTable.tsx` / `RoomTypeDetails.tsx`, gated on the `ROOM_TYPE` entity permission); writes go through `@trinserhof/supabase`'s `saveRoomType`. Seed fixtures live in `packages/supabase/prisma/seed.ts`.
  - `RoomId` is just `string` (`RoomIdEnum` is a non-empty string, not a fixed enum) — a booking can have an empty `roomId` (no room assigned yet, e.g. a new booking before a room is picked). Actual rooms (id + type + label + description) live in Firebase under `rooms/<id>`, not hardcoded — see `apps/pms/src/hooks/useRooms.ts` (real-time listener) and `@trinserhof/firebase`'s `saveRoom` (rooms cannot be deleted once created)
  - `Booking` = own fields (`id`, `email`, `phone?`, `checkIn`/`checkOut` as `YYYY-MM-DD`, `status`, `roomId`, `channel`, `adults`/`children`/`pets`, `price`, `priceFixed`, `roomType?`, `name?`, `notes?`, `message?`) intersected with `OldBooking` (legacy `start`, `end`, `group`, `className`, `contact`, `content`, `deleted`, `updated` — still present in Firebase, see Backwards compatibility below)
  - `PRICE_PET_PER_NIGHT = 25`
- **`@trinserhof/firebase`** (`packages/firebase/src/index.ts`) — All exports: `getDb()` (returns the singleton `Database`, app initialized at module load from `@trinserhof/constants`'s `FIREBASE_CONFIG`), `saveBooking(booking)` (merges legacy `contact`/`content` into `notes`, strips legacy fields, generates a `uuidv4` id if missing, `set()`s to `bookings/{id}`), `logIn()` / `logOut(setUser)` (Google popup auth), `getSignedInUser(setUser, setAdmin, setError)` (`onAuthStateChanged` listener that resolves the account against the Firebase `users` collection — allowed only if its email matches a user record, admin only if that record's `isAdmin` is true; returns the unsubscribe fn). Allowed users/admins are stored in Firebase (`users/$userId`), not hardcoded in the code.
- **`@trinserhof/helpers`** (`packages/helpers/src/`) — Pure functions: `bookingsAreDifferent(a, b)` (dirty-check across ~15 fields, used to decide whether to re-save), `makeBookingBackwardsCompatible(booking)` (maps `start`/`end`/`group`/`content` → `checkIn`/`checkOut`/`roomId`/`name`, and legacy lowercase statuses `confirmed`/`maybe`/`employee`/`deleted` → current `Status` enum), `getNewBooking()` (blank booking, check-in today, check-out today+2), `formatCurrency`, `formatDate` (de-DE locale), `dateToString`, `getYYYYmmDD`, `getAmountOfNightsFromDateRange`, `removeTimeFromDate`, `isValidEmailAddress`, `uuidv4`. Has a vitest suite for several of these (`getNewBooking.test.ts`, `isValidEmailAddress.test.ts`, `getYYYYmmDD.test.ts`, `formatCurrency.test.ts`, `getAmountOfNightsFromDateRange.test.ts`).
- **`@trinserhof/ui`** (`packages/ui/src/components/`) — daisyUI-styled primitives (button, card, input, label, textarea, select, accordion, popover, calendar, dialog, command, badge, scroll-area, table, checkbox, dropdown-menu, sonner) live flat alongside the domain components: `FormDatePicker` (range picker + night count), `NumberPicker` (+/- stepper with min/max), `Error`, `NoEditingAllowed`, `GutZuWissen` (hotel info accordion), `Footer`, `HorizontalLine`. Styling is daisyUI (Tailwind plugin) — `cva` is still used for variant composition, but there's no `cn`/clsx/tailwind-merge (components merge default and passed-in classes with plain template literals) and no Radix UI; `src/lib/floating.ts` has small custom hooks (`useFloatingPosition`, `useOutsideInteraction`) backing popover/select/dropdown positioning.
- **`@trinserhof/constants`** — `FIREBASE_CONFIG`: every value (`apiKey`/`appId`/`authDomain`/`databaseURL`/`messagingSenderId`/`projectId`/`storageBucket`/`measurementId`) is a hardcoded literal (non-secret, safe to commit). Also `OWNER_EMAIL` (the single account allowed to overwrite the raw database, mirroring the `.write` rule in `database.rules.json`).
- **`@trinserhof/theme`** (`packages/theme/theme.css`) — The shared DaisyUI theme, extracted so it can be reused across apps. Contains the `@plugin "daisyui"` theme registration, the `light`/`dark` `@plugin "daisyui/theme"` definitions, the `--brand` custom properties (light + dark), the `@theme` token mapping (semantic `--color-*` aliases like `background`/`foreground`/`destructive`/`brand`), and the `@layer base` defaults. Owns the `daisyui` dependency and peer-depends on `tailwindcss`. Consumed via a bare CSS import — `apps/pms/src/index.css` does `@import '@trinserhof/theme';` (after `@import 'tailwindcss';`) and keeps only its own `@source` directive and the app-specific `vis-timeline` calendar styling.

### Data flow

- Bookings live in the Postgres (Supabase) `Booking` table.
- The PMS app reads bookings via the `useBookings` hook (a `select('*')` query against the Supabase `Booking` table).
- The PMS app calls `@trinserhof/supabase`'s `saveBooking` to write back to Postgres

### Pricing

- Nightly prices are keyed by room **type** (not by individual room), stored under a single `prices` node: `prices/base/<roomTypeId>` (the default nightly price for a room type) and `prices/overrides/<YYYY-MM-DD>/<roomTypeId>` (a per-night override that wins over the base). Types/schema live in `@trinserhof/types`'s `price.ts` (`Prices`, `EMPTY_PRICES`); writes go through `@trinserhof/firebase`'s `saveBasePrice` / `savePriceOverride` / `deletePriceOverride`.
- The PMS app reads prices via the `usePrices` hook (real-time `onValue` on `prices`). The **Prices** page (`apps/pms/src/components/PricesTable.tsx`, gated on the `PRICE` entity permission) edits base prices and per-night overrides in a month grid.
- `@trinserhof/helpers`'s `getStayPriceBreakdown` / `getNightsInDateRange` resolve the effective price per night (override ?? base) across a stay (check-in inclusive, check-out exclusive); `BookingDetails` uses them to show the computed total for the selected room + date range. The total is display-only — it is not persisted on the booking.

### Deployment

- **Client** → hosting not configured in this repo. Google Sign-In (Firebase Auth) only allows redirects to domains on its "Authorized domains" allowlist in the Firebase console, so any deploy domain in use needs to be added there or sign-in will fail even though the build succeeds.

### Backwards compatibility

`OldBooking` fields (`start`, `end`, `group`, `className`, `contact`, `content`) still exist in Firebase. `makeBookingBackwardsCompatible` (`packages/helpers`) maps them to the current schema on read. When writing, `saveBooking` in `packages/firebase` strips the old fields.

### Known rough edges (don't "fix" without asking — may be intentional/in-progress)

- Root `package.json`'s `repository.url` still points at `jesse-mtm/bookings`, not the actual repo.
