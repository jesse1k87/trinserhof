import * as esbuild from 'esbuild';
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';
import http from 'node:http';

const options = {
  entryPoints: ['./src/index.tsx'],
  outfile: 'public/index.js',
  bundle: true,
  loader: {
    '.js': 'tsx',
  },
  minify: true,
  plugins: [tailwindPlugin({})],
};

if (process.argv.includes('watch')) {
  let ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching...');
} else {
  await esbuild.build(options).catch(() => {
    console.error(error);
    process.exit(1);
  });
}
