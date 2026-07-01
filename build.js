const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  target: 'es2020',
  minify: true,
  sourcemap: false,
  logLevel: 'info'
}).catch(() => process.exit(1));
