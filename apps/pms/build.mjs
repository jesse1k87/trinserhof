import * as esbuild from 'esbuild';
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';
import { execSync } from 'child_process';
import { copyFileSync, readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { WATCH_PATHS } from './watch.config.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pmsDir = resolve(dirname(fileURLToPath(import.meta.url)));
const watch = process.argv.includes('watch');

const buildVersion = execSync('git rev-parse --short HEAD', { cwd: rootDir }).toString().trim();
const buildTime = new Date().toISOString();

// GitHub Pages serves this file for any unmatched path (e.g. a hard refresh on
// /trinserhof/reservations) instead of its default 404 page, so the client-side
// router in App.tsx gets a chance to render the right page from the URL.
copyFileSync(resolve(pmsDir, 'public/index.html'), resolve(pmsDir, 'public/404.html'));

// Dev only: tell esbuild to also watch the files in watch.config.mjs, even if
// the bundle doesn't import them. We hang the extra watch list off the entry
// point's onLoad so it's recomputed on every rebuild (picking up new files),
// and because these go through esbuild's own watcher, changing any of them
// triggers the same rebuild -> live-reload path as an imported file.
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.turbo']);
// esbuild writes these into public/ on every build; watching them would make a
// rebuild retrigger itself, so they're always excluded even if public/ is listed.
const GENERATED_FILES = new Set([
  resolve(pmsDir, 'public/index.js'),
  resolve(pmsDir, 'public/index.css'),
  resolve(pmsDir, 'public/404.html'),
]);
const collectWatchTargets = () => {
  const files = new Set();
  const dirs = new Set();
  const walk = (dir) => {
    dirs.add(dir);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue;
      const child = join(dir, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (!GENERATED_FILES.has(child)) files.add(child);
    }
  };
  for (const path of WATCH_PATHS) {
    const abs = resolve(rootDir, path);
    if (!existsSync(abs) || GENERATED_FILES.has(abs)) continue;
    if (statSync(abs).isDirectory()) walk(abs);
    else files.add(abs);
  }
  return { files: [...files], dirs: [...dirs] };
};

const watchConfigPlugin = {
  name: 'watch-config-paths',
  setup(build) {
    build.onLoad({ filter: /[\\/]src[\\/]index\.tsx$/ }, (args) => {
      const { files, dirs } = collectWatchTargets();
      return {
        contents: readFileSync(args.path, 'utf8'),
        loader: 'tsx',
        watchFiles: files,
        watchDirs: dirs,
      };
    });
  },
};

const options = {
  entryPoints: ['./src/index.tsx'],
  outfile: 'public/index.js',
  bundle: true,
  minify: !watch,
  loader: {
    '.js': 'tsx',
  },
  plugins: watch ? [tailwindPlugin({}), watchConfigPlugin] : [tailwindPlugin({})],
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(buildVersion),
    'process.env.BUILD_TIME': JSON.stringify(buildTime),
    // Compiled to the string 'true' only in watch mode; the live-reload block in
    // src/index.tsx is dead-code-eliminated from production builds.
    'process.env.LIVE_RELOAD': JSON.stringify(String(watch)),
  },
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({
    servedir: resolve(pmsDir, 'public'),
    // Serve index.html for unmatched routes so a hard refresh on a client-side
    // route (e.g. /bookings/new) still loads the app (SPA fallback).
    fallback: resolve(pmsDir, 'public/index.html'),
    port: 8080,
  });
  console.log(`PMS dev server running at http://localhost:${port} (auto-refresh on file changes)`);
} else {
  await esbuild.build(options).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
