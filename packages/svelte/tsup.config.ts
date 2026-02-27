import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/exports.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['svelte', 'svelte/internal', '@chartts/core'],
})
