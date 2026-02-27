import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['solid-js', '@chartts/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'solid-js'
  },
})
