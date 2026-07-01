// Which files the dev server watches for auto-refresh.
// -----------------------------------------------------
// While `npm run pms` (or `npm -w pms run dev`) is running, saving any file
// listed here rebuilds the app and refreshes the browser automatically.
//
// esbuild already watches everything the app *imports* (including files in
// other packages, since they're linked as workspaces), so you only need to add
// a path here to watch something that ISN'T imported by the bundle — a JSON
// data file, an asset, or a package you're editing but haven't imported yet.
// Listing already-imported folders is harmless and makes the intent explicit.
//
// Paths are relative to the repo root. A folder is watched recursively; a file
// is watched on its own. Paths may live in any package. Add or remove entries
// freely — the change takes effect next time you start the dev server.
export const WATCH_PATHS = [
  'apps/pms/src',
  'apps/pms/public',
  'packages/ui/src',
  'packages/helpers/src',
  'packages/types/src',
  'packages/firebase/src',
  'packages/supabase/src',
  'packages/constants/src',
  'packages/theme',
];
