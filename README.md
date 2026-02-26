<p align="center">
  <img src="https://raw.githubusercontent.com/chartts/chartts.com/main/public/logo-icon.svg" alt="Chart.ts" width="80" height="80" />
</p>

<h1 align="center">chart.ts</h1>

<p align="center">
  <strong>Beautiful charts. Tiny bundle. Every framework.</strong>
</p>

<p align="center">
  <a href="https://chartts.com">Website</a> · <a href="https://chartts.com/docs">Docs</a> · <a href="https://chartts.com/examples">Examples</a> · <a href="https://chartts.com/demos">Demos</a>
</p>

---

## What is Chart.ts?

A design-native charting library that renders real SVG, styles with Tailwind classes, and ships at under 15kb gzipped. Native packages for React, Vue, Svelte, Solid, and Vanilla JS. Not wrappers. Native implementations.

## Install

```bash
# React
npm install @chartts/react

# Vue
npm install @chartts/vue

# Svelte
npm install @chartts/svelte

# Solid
npm install @chartts/solid

# Vanilla JS
npm install @chartts/core
```

## Quick start

```tsx
import { LineChart } from "@chartts/react"

const data = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 7100 },
];

export default function App() {
  return <LineChart data={data} x="month" y="revenue" />
}
```

That's it. Labels, axes, tooltips, gradients, responsive scaling, dark mode, accessibility - all automatic.

## Why Chart.ts?

- **Beautiful by default** - zero config charts that look good out of the box
- **15kb gzipped** - the entire core library, not per chart
- **SVG by default** - real DOM nodes. CSS works. Devtools work. Screen readers work.
- **Tailwind native** - every element exposes `className`. Use `dark:` variants. Use your design tokens.
- **TypeScript-first** - built in strict mode with full type inference
- **Accessible** - WCAG 2.1 AA compliant. Keyboard navigation, ARIA roles, pattern fills for colorblind users.
- **Multi-renderer** - SVG for most charts. Canvas at 10k+ points. WebGL at 100k+. Zero config.

## Chart types

Line, bar, area, pie, donut, scatter, bubble, radar, candlestick, waterfall, funnel, gauge, sparkline, heatmap, treemap, boxplot, histogram, polar, radial bar, lollipop, bullet, dumbbell, calendar, combo, sankey, stacked bar, horizontal bar.

27 chart types. Same flat API surface for all of them.

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

## Bundle size comparison

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
  core/          # Rendering engine, chart types, themes
```

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT
