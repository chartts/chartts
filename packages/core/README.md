<p align="center">
  <a href="https://chartts.com">
    <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/og.png" alt="Chart.ts" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/core"><img src="https://img.shields.io/npm/v/@chartts/core?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/core

Beautiful charts. Tiny bundle. Every framework.

SVG-first charting library with Tailwind support, under 15kb gzipped. 40+ chart types with a flat, declarative API.

<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/line-dark.png" alt="Line Chart" width="48%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/bar-dark.png" alt="Bar Chart" width="48%" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/area-dark.png" alt="Area Chart" width="48%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/pie-dark.png" alt="Pie Chart" width="23%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/donut-dark.png" alt="Donut Chart" width="23%" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/candlestick-dark.png" alt="Candlestick Chart" width="48%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/radar-dark.png" alt="Radar Chart" width="23%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/gauge-dark.png" alt="Gauge Chart" width="23%" />
</p>

## Install

```bash
npm install @chartts/core
```

## Quick start

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

document.getElementById("chart").innerHTML = chart.toSVG()
```

## Server-side rendering

```ts
import { renderToString, lineChartType } from "@chartts/core"

const svg = renderToString(lineChartType, {
  labels: ["Jan", "Feb", "Mar"],
  series: [{ name: "Sales", values: [10, 20, 15] }],
}, { width: 600, height: 300 })

// Returns a full <svg> string - embed anywhere, no DOM needed
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

Tree-shakeable. Import only what you use:

```ts
import { lineChartType } from "@chartts/core/line"
import { barChartType } from "@chartts/core/bar"
import { candlestickChartType } from "@chartts/core/candlestick"
```

## Tailwind integration

Charts render as real SVG DOM elements. Style with CSS variables:

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

## Framework packages

For React, Vue, Svelte, and Solid, use the dedicated packages:

```bash
npm install @chartts/react   # React
npm install @chartts/vue     # Vue
npm install @chartts/svelte  # Svelte
npm install @chartts/solid   # Solid
```

## Links

- [Documentation](https://chartts.com/docs)
- [Examples](https://chartts.com/examples)
- [Live Demos](https://chartts.com/demos)
- [GitHub](https://github.com/chartts/chartts)

## License

MIT
