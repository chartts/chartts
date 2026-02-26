<p align="center">
  <a href="https://chartts.com">
    <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/og.png" alt="Chart.ts - Beautiful charts. Tiny bundle. Every framework." width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/core"><img src="https://img.shields.io/npm/v/@chartts/core?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

<p align="center">
  <a href="https://chartts.com">Website</a> · <a href="https://chartts.com/docs">Docs</a> · <a href="https://chartts.com/examples">Examples</a> · <a href="https://chartts.com/demos">Demos</a>
</p>

---

## What is Chart.ts?

A design-native charting library that renders real SVG, styles with Tailwind classes, and ships under 15kb gzipped. 40+ chart types. Native packages for React, Vue, Svelte, Solid, and Vanilla JS. Not wrappers - native implementations.

## Install

```bash
npm install @chartts/core
```

Framework packages:

```bash
npm install @chartts/react    # React
npm install @chartts/vue      # Vue
npm install @chartts/svelte   # Svelte
npm install @chartts/solid    # Solid
```

## Quick start

```tsx
import { LineChart } from "@chartts/react"

export default function Dashboard() {
  return (
    <LineChart
      data={[
        { month: "Jan", revenue: 4200 },
        { month: "Feb", revenue: 5800 },
        { month: "Mar", revenue: 7100 },
        { month: "Apr", revenue: 6400 },
        { month: "May", revenue: 8200 },
        { month: "Jun", revenue: 9600 },
      ]}
      x="month"
      y="revenue"
    />
  )
}
```

Labels, axes, tooltips, gradients, responsive scaling, dark mode, accessibility - all automatic.

### Vanilla JS / Server-side rendering

```ts
import { createChart, lineChartType } from "@chartts/core"

const chart = createChart(lineChartType, {
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    series: [{ name: "Revenue", values: [4200, 5800, 7100, 6400, 8200, 9600] }]
  },
  width: 600,
  height: 300,
})

// Client-side
document.getElementById("chart").innerHTML = chart.toSVG()

// Server-side
import { renderToString, lineChartType } from "@chartts/core"
const svg = renderToString(lineChartType, data, { width: 600, height: 300 })
```

## Why Chart.ts?

- **Beautiful by default** - zero config charts that look great out of the box
- **Under 15kb gzipped** - the entire core library, not per chart
- **Real SVG** - actual DOM nodes. CSS works. Devtools work. Screen readers work.
- **Tailwind native** - style with classes you already know. `dark:` variants just work.
- **TypeScript-first** - strict mode, full type inference, autocomplete everywhere
- **Accessible** - WCAG 2.1 AA compliant. Keyboard navigation, ARIA roles, pattern fills.
- **Tree-shakeable** - import only the chart types you use
- **SSR ready** - renders to string for server-side use. No `ssr: false` hacks.
- **Multi-renderer** - SVG default. Canvas at 10k+ points. WebGL at 100k+. Zero config.

## 40+ chart types

Line, bar, area, pie, donut, scatter, bubble, radar, sparkline, candlestick, OHLC, waterfall, funnel, gauge, heatmap, treemap, boxplot, histogram, polar, radial bar, lollipop, bullet, dumbbell, calendar, combo, sankey, sunburst, tree, graph, parallel coordinates, theme river, pictorial bar, chord, geo, matrix, step, volume, range, baseline, kagi, renko, stacked bar, horizontal bar.

Same flat API surface for all of them. Tree-shakeable - import only what you use:

```ts
import { lineChartType } from "@chartts/core/line"
import { barChartType } from "@chartts/core/bar"
import { candlestickChartType } from "@chartts/core/candlestick"
```

## Styling with Tailwind

```tsx
<LineChart
  data={data}
  x="month"
  y="revenue"
  lineClassName="stroke-cyan-500 dark:stroke-cyan-400"
  axisClassName="text-zinc-600 dark:text-zinc-400"
/>
```

Every chart element is a real SVG node styled with real CSS. Your design tokens, your classes, your charts.

Charts automatically adapt to light/dark mode via CSS custom properties:

```css
:root {
  --chartts-grid: rgba(0 0 0 / 0.06);
  --chartts-axis: rgba(0 0 0 / 0.15);
  --chartts-text-muted: #64748b;
  --chartts-bg: #ffffff;
}
```

## Bundle size

| Library | Size (gzipped) |
|---------|---------------|
| **Chart.ts** | **~15kb** |
| Chart.js | ~60kb |
| Recharts | ~50kb |
| Highcharts | ~80kb |
| ApexCharts | ~120kb |
| ECharts | ~300kb |

## Project structure

```
packages/
  core/     # Rendering engine, 40+ chart types, themes, utilities
```

## Development

```bash
cd packages/core
npm install
npm run build    # Production build
npm run dev      # Watch mode
```

## Links

- [Documentation](https://chartts.com/docs)
- [Examples](https://chartts.com/examples)
- [Live Demos](https://chartts.com/demos)
- [npm](https://www.npmjs.com/package/@chartts/core)

## License

MIT
