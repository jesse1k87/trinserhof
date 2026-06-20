# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start all apps in watch/dev mode (via Turborepo)
npm run build        # Type-check then build all apps
npm run dev:test     # Same as dev, but loads .env.test instead of .env
npm run build:test   # Same as build, but loads .env.test instead of .env
npm run tsc          # Type-check all packages
npm run format       # Format all files with Prettier
npm run precommit    # sort-package-json + npm install + format (run before committing)
```

There are no automated tests in this repo.

### Test environment

All apps read Firebase credentials from the same 7 `FIREBASE_*` env vars (see `.env.example`). Setting `APP_ENV=test` (e.g. via `npm run dev:test` / `npm run build:test`) makes `apps/client`, `apps/form`, `apps/server`, and `apps/mews-sync` load `.env.test` instead of `.env`. `.env.test` is gitignored; copy `.env.test.example` to create it, using the same values as `.env` except `FIREBASE_DATABASE_URL`, which should point at a second Realtime Database instance created in the same Firebase project (Firebase console → Realtime Database → Create database). This isolates test data while reusing the same project, API keys, and Google Sign-In setup. For deployed test environments (Netlify branch deploy, Vercel preview), set `FIREBASE_DATABASE_URL` directly in that platform's env var UI instead.

## Architecture

This is a **Turborepo monorepo** (npm workspaces) for Hotel Trinserhof's booking system.

### Apps

- **`apps/client`** — Admin-facing SPA. Shows a `vis-timeline` calendar with one row per room. Clicking a booking opens `BookingDetails`. Requires Google sign-in; only `KNOWN_USERS` in `packages/database/src/index.ts` can log in, and only `ADMINS` can edit.
- **`apps/form`** — Guest-facing booking request form, embedded as an iframe on the hotel website. Submits directly to Firebase Realtime Database then sends a confirmation email.
- **`apps/server`** — Express API deployed on Vercel. Exposes `POST /submit` (create booking) and `POST /update` (update booking). The server uses env vars for Firebase credentials rather than the shared `FIREBASE_CONFIG` constant.

### Packages

- **`@bookings/types`** — Shared TypeScript types and Zod schemas. `Booking` intersects with `OldBooking` for backwards compatibility. Room IDs, room types, statuses, and channels are all defined here as `const` arrays and Zod enums.
- **`@bookings/database`** — Firebase Realtime Database helpers and Google Auth wrappers used by the client and form apps. Also exports `ADMINS` and `KNOWN_USERS` arrays that gate access.
- **`@bookings/helpers`** — Pure utility functions: price calculation, date formatting, `makeBookingBackwardsCompatible` (maps legacy `start`/`end`/`group` fields to `checkIn`/`checkOut`/`roomId`), `getNewBooking`, etc.
- **`@bookings/ui`** — Shared React components. `packages/ui/src/components/shadcn/` contains shadcn/ui primitives; domain components (NumberPicker, FormDatePicker, etc.) live alongside them.
- **`@bookings/constants`** — Firebase client config (non-secret, safe to commit).

### Data flow

- Bookings live in Firebase Realtime Database under `bookings/<id>`.
- The client subscribes to the entire `bookings` collection via `useCollection` (a real-time `onValue` listener) and filters out `deleted: true` entries.
- Saves from both the client and form go directly to Firebase; the server is only used by the form's email flow and future Stripe integration.

### Deployment

- **Client** → Netlify (`netlify.toml`; publishes `apps/client/public`)
- **Server** → Vercel (`apps/server/vercel.json`)
- **Form** → built output in `apps/form/public` (hosting not configured in this repo)

### Backwards compatibility

`OldBooking` fields (`start`, `end`, `group`, `className`, `contact`, `content`) still exist in Firebase. `makeBookingBackwardsCompatible` (`packages/helpers`) maps them to the current schema on read. When writing, `saveBooking` in `packages/database` strips the old fields.
