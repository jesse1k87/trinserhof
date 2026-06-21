import * as esbuild from 'esbuild';
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = process.env.APP_ENV === 'production' ? '.env' : '.env.staging';
config({ path: resolve(rootDir, envFile) });

const FIREBASE_ENV_VARS = ['FIREBASE_DATABASE_URL'];

const missing = FIREBASE_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const options = {
  entryPoints: ['./src/index.tsx'],
  outfile: 'public/index.js',
  bundle: true,
  minify: !process.argv.includes('watch'),
  loader: {
    '.js': 'tsx',
  },
  plugins: [tailwindPlugin({})],
  define: Object.fromEntries(
    FIREBASE_ENV_VARS.map((key) => [`process.env.${key}`, JSON.stringify(process.env[key])]),
  ),
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
