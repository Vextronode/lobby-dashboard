import { defineConfig } from 'tsup';

// Workspace packages export TypeScript source, so they are bundled into the output.
export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  clean: true,
  noExternal: [/^@lobby\//],
});
