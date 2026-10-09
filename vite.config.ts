import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const shim = (name: string) =>
  fileURLToPath(new URL(`./src/shims/${name}.ts`, import.meta.url));

// Ink targets Node. In the browser build these Node built-ins and Node-only
// packages are replaced with small shims. Under Vitest (which runs on Node)
// the real modules are used, so no aliases are applied.
const browserAliases: Record<string, string> = process.env.VITEST
  ? {}
  : {
      'node:process': shim('process'),
      'node:events': 'events',
      'node:stream': shim('stream'),
      'node:util': shim('util'),
      'node:fs': shim('empty'),
      'node:path': shim('empty'),
      'node:url': shim('empty'),
      'node:os': shim('empty'),
      module: shim('empty'),
      'react-devtools-core': shim('empty'),
      'signal-exit': shim('signal-exit'),
      'terminal-size': shim('terminal-size'),
    };

// JSX is compiled by Vite itself (tsconfig "jsx": "react-jsx"). @vitejs/plugin-react
// is not used: it only adds DOM Fast Refresh and pre-bundles react-dom, and this
// app renders with Ink, not react-dom.
export default defineConfig({
  base: './',
  resolve: { alias: browserAliases },
  build: { target: 'es2022' },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
