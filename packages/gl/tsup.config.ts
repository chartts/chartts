import { defineConfig } from 'tsup'

const chartEntries = [
  'bar3d', 'scatter3d', 'surface3d', 'globe3d', 'map3d',
  'lines3d', 'line3d', 'scatter-gl', 'lines-gl', 'flow-gl', 'graph-gl', 'torus3d',
]

const entry: Record<string, string> = {
  index: 'src/index.ts',
}
for (const name of chartEntries) {
  entry[name] = `src/entries/${name}.ts`
}

export default defineConfig({
  entry,
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  splitting: true,
  external: ['@chartts/core'],
})
