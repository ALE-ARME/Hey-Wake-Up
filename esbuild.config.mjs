import esbuild from 'esbuild';
import process from 'process';

const isProduction = process.env.NODE_ENV === 'production';

esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'], // Obsidian and Electron are external
  format: 'cjs', // CommonJS format for Obsidian plugins
  target: 'esnext',
  sourcemap: isProduction ? false : 'inline',
  outfile: 'main.js',
  logLevel: 'info',
  
}).catch(() => process.exit(1));
