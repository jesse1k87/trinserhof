import * as esbuild from 'esbuild';

const options = {
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  loader: {
    '.ts': 'ts',
  },
  minify: true,
};

if (process.argv.includes('watch')) {
  let ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching...');
} else {
  await esbuild.build(options);
}
