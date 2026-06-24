import * as esbuild from 'esbuild';
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';
import { execSync } from 'child_process';
import { copyFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pmsDir = resolve(dirname(fileURLToPath(import.meta.url)));

const buildVersion = execSync('git rev-parse --short HEAD', { cwd: rootDir }).toString().trim();
const buildTime = new Date().toISOString();

// GitHub Pages serves this file for any unmatched path (e.g. a hard refresh on
// /trinserhof/reservations) instead of its default 404 page, so the client-side
// router in App.tsx gets a chance to render the right page from the URL.
copyFileSync(resolve(pmsDir, 'public/index.html'), resolve(pmsDir, 'public/404.html'));

const options = {
  entryPoints: ['./src/index.tsx'],
  outfile: 'public/index.js',
  bundle: true,
  minify: !process.argv.includes('watch'),
  loader: {
    '.js': 'tsx',
  },
  plugins: [tailwindPlugin({})],
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(buildVersion),
    'process.env.BUILD_TIME': JSON.stringify(buildTime),
  },
};

if (process.argv.includes('watch')) {
  let ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching...');
} else {
  await esbuild.build(options).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
