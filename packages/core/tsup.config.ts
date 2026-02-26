import { defineConfig } from 'tsup'

const chartEntries = [
  'line', 'bar', 'stacked-bar', 'horizontal-bar',
  'pie', 'donut', 'scatter', 'sparkline', 'area',
  'radar', 'bubble', 'candlestick', 'gauge', 'waterfall',
  'funnel', 'heatmap', 'boxplot', 'histogram', 'treemap',
  'polar', 'radialbar', 'lollipop', 'bullet', 'dumbbell',
  'calendar', 'combo', 'sankey',
  'sunburst', 'tree', 'graph', 'parallel', 'themeriver',
  'pictorialbar', 'chord',
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
  external: [],
})
