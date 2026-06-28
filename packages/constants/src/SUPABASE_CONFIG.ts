// The anon/public key is meant to ship in client-side bundles, like the Firebase
// config above — access is enforced by Postgres Row Level Security policies on
// the Supabase project, not by hiding this key.
// TODO: replace with the real values from Supabase Dashboard > Project Settings > API.
export const SUPABASE_CONFIG = {
  url: 'https://REPLACE_WITH_PROJECT_REF.supabase.co',
  anonKey: 'REPLACE_WITH_ANON_PUBLIC_KEY',
};
