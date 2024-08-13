import * as esbuild from 'esbuild';
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss';

const options = {
  entryPoints: ['./src/index.tsx'],
  outfile: 'public/index.js',
  bundle: true,
  minify: !process.argv.includes('watch'),
  loader: {
    '.js': 'tsx',
  },
  plugins: [tailwindPlugin({})],
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
