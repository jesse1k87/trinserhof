// The publishable key is Supabase's modern, client-safe API key
// (`sb_publishable_…`) — it replaces the legacy `anon` JWT key, which Supabase
// now considers a legacy feature (see
// https://github.com/orgs/supabase/discussions/29260). Like the Firebase config
// above it's meant to ship in client-side bundles — access is enforced by
// Postgres Row Level Security policies on the Supabase project, not by hiding
// this key.
// TODO: replace with the real values from Supabase Dashboard > Project Settings >
// API Keys (use the "Publishable key", not a "Secret key" — secret keys bypass
// RLS and must never ship to the client).
export const SUPABASE_CONFIG = {
  url: 'https://REPLACE_WITH_PROJECT_REF.supabase.co',
  publishableKey: 'REPLACE_WITH_PUBLISHABLE_KEY',
};
