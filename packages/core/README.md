<p align="center">
  <a href="https://chartts.com">
    <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/og.png" alt="Chart.ts" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/core"><img src="https://img.shields.io/npm/v/@chartts/core?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@chartts/core"><img src="https://img.shields.io/npm/dm/@chartts/core?color=06B6D4" alt="npm downloads" /></a>
  <a href="https://img.shields.io/bundlephobia/minzip/@chartts/core"><img src="https://img.shields.io/bundlephobia/minzip/@chartts/core?color=06B6D4&label=size" alt="Bundle size" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-06B6D4" alt="TypeScript" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

<h1 align="center">@chartts/core</h1>

<p align="center">
  65+ chart types. SVG + Canvas + WebGL. Under 15kb gzipped. Zero dependencies.
</p>

<p align="center">
  <a href="https://github.com/chartts/chartts">
    <img src="https://img.shields.io/github/stars/chartts/chartts?style=social" alt="GitHub stars" />
  </a>
</p>
<p align="center">
  If Chart.ts helps your project, consider giving it a star — it helps others discover it too.
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/line-dark.png" alt="Line Chart" width="32%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/area-dark.png" alt="Area Chart" width="32%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/bar-dark.png" alt="Bar Chart" width="32%" />
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/candlestick-dark.png" alt="Candlestick Chart" width="32%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/treemap-dark.png" alt="Treemap" width="32%" />
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/demos/radar-dark.png" alt="Radar Chart" width="32%" />
</p>
<p align="center">
  <a href="https://chartts.com/demos">See all 65+ chart types →</a>
</p>

## Install

```bash
npm install @chartts/core
```

## Quick start

```ts
import { createChart, lineChartType } from "@chartts/core"

const chart = createChart("#chart", lineChartType, {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  series: [{ name: "Revenue", values: [4200, 5800, 7100, 6400, 8200, 9600] }],
})
```

### Server-side rendering

```ts
import { renderToString, lineChartType } from "@chartts/core"

const svg = renderToString(lineChartType, {
  labels: ["Jan", "Feb", "Mar"],
  series: [{ name: "Sales", values: [10, 20, 15] }],
}, { width: 600, height: 300 })
```

### Real-time streaming

```ts
import { createStreamingChart, lineChartType } from "@chartts/core"

const stream = createStreamingChart(el, lineChartType, { windowSize: 200 })
stream.push([42], "12:00:01")
stream.push([58], "12:00:02")
```

## Why Chart.ts?

- **65+ chart types** — line, bar, pie, candlestick, sankey, treemap, radar, heatmap, and 50+ more
- **Under 15kb gzipped** — the entire core, not per chart
- **Zero dependencies** — nothing to audit, nothing to break
- **Triple renderer** — SVG default, Canvas at 5k+ points, WebGL at 100k+. Auto-switching.
- **Real SVG** — actual DOM nodes. CSS works. Devtools work. Screen readers work.
- **TypeScript-first** — strict mode, zero `any`, full inference
- **Accessible** — WCAG 2.1 AA. Keyboard nav, ARIA roles, pattern fills.
- **Tree-shakeable** — import only the charts you use
- **SSR ready** — `renderToString()` for server-side. No `ssr: false` hacks.
- **Interactions** — tooltips, crosshair, zoom, pan, brush, linked charts
- **Financial indicators** — SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP
- **Streaming** — rolling buffers with pause/resume

## Framework support

| Framework | Package | |
|-----------|---------|---|
| **React** | `@chartts/react` | [![npm](https://img.shields.io/npm/v/@chartts/react?color=06B6D4&label=)](https://www.npmjs.com/package/@chartts/react) |
| **Vue** | `@chartts/vue` | [![npm](https://img.shields.io/npm/v/@chartts/vue?color=06B6D4&label=)](https://www.npmjs.com/package/@chartts/vue) |
| **Svelte** | `@chartts/svelte` | [![npm](https://img.shields.io/npm/v/@chartts/svelte?color=06B6D4&label=)](https://www.npmjs.com/package/@chartts/svelte) |
| **Solid** | `@chartts/solid` | [![npm](https://img.shields.io/npm/v/@chartts/solid?color=06B6D4&label=)](https://www.npmjs.com/package/@chartts/solid) |
| **Angular** | `@chartts/angular` | [![npm](https://img.shields.io/npm/v/@chartts/angular?color=06B6D4&label=)](https://www.npmjs.com/package/@chartts/angular) |

For WebGL/3D charts, add `@chartts/gl`.

## 65+ chart types

**Trending** — Line, Area, Step, Sparkline, Range, Baseline, Combo

**Comparison** — Bar, Stacked Bar, Horizontal Bar, Lollipop, Bullet, Dumbbell, Pillar, Pareto

**Composition** — Pie, Donut, Treemap, Sunburst, Pack, Funnel, Waterfall

**Distribution** — Scatter, Bubble, Histogram, Boxplot, Violin, Heatmap

**Radial** — Radar, Polar, Radial Bar, Gauge

**Financial** — Candlestick, OHLC, Volume, Kagi, Renko

**Relationship** — Sankey, Chord, Graph, Flow, Parallel, Lines

**Hierarchy** — Tree, Org, Gantt

**Specialty** — Calendar, Matrix, Geo, Word Cloud, Voronoi, Theme River, Pictorial Bar

**3D / WebGL** (via `@chartts/gl`) — Scatter 3D, Bar 3D, Surface 3D, Globe 3D, Map 3D, Lines 3D, Line 3D, Torus 3D, Scatter GL, Lines GL, Flow GL, Graph GL

Tree-shakeable imports:

```ts
import { lineChartType } from "@chartts/core/line"
import { barChartType } from "@chartts/core/bar"
import { candlestickChartType } from "@chartts/core/candlestick"
```

## Bundle size

| Library | Size (gzip) | Charts | Renderers | License |
|---------|-------------|--------|-----------|---------|
| **Chart.ts** | **~15kb** | **65+** | **SVG + Canvas + WebGL** | **MIT** |
| Chart.js | ~60kb | 8 | Canvas | MIT |
| Recharts | ~50kb | 12 | SVG | MIT |
| ECharts | ~300kb | 40+ | Canvas | Apache |
| Highcharts | ~80kb | 30+ | SVG | Commercial |
| ApexCharts | ~120kb | 20+ | SVG + Canvas | MIT |

## Links

- [Documentation](https://chartts.com/docs)
- [Live Demos](https://chartts.com/demos)
- [Examples](https://chartts.com/examples)
- [Capabilities](https://chartts.com/capabilities)
- [GitHub](https://github.com/chartts/chartts)

## License

MIT
