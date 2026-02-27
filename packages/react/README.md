<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/react"><img src="https://img.shields.io/npm/v/@chartts/react?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/react

Chartts for React. 40+ chart types, beautiful defaults, Tailwind ready.

## Install

```bash
npm install @chartts/react @chartts/core
```

## Quick start

```tsx
import { LineChart } from "@chartts/react"

function Dashboard() {
  return (
    <LineChart
      data={{
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [{ name: "Revenue", values: [4200, 5800, 7100, 6400, 8200, 9600] }]
      }}
    />
  )
}
```

## Available components

Every chart type has a dedicated component: `LineChart`, `BarChart`, `AreaChart`, `PieChart`, `DonutChart`, `ScatterChart`, `CandlestickChart`, `RadarChart`, `HeatmapChart`, `TreemapChart`, `GaugeChart`, `WaterfallChart`, `FunnelChart`, `SankeyChart`, and 25+ more.

All components accept the same `data` prop and all `ChartOptions` as props.

## Theming

```ts
// Built-in presets
<LineChart data={data} theme="corporate" />
<LineChart data={data} theme="ocean" />

// Auto light/dark
<LineChart data={data} theme="auto" />

// Extra themes from @chartts/themes
import { neonTheme } from "@chartts/themes"
<LineChart data={data} theme={neonTheme} />
```

## Why Chartts?

- **Beautiful by default** — zero config charts that look great
- **Under 15kb gzipped** — the entire core library
- **Real SVG** — CSS works. Devtools work. Screen readers work.
- **Tailwind ready** — style with classes you already know
- **TypeScript-first** — strict types, autocomplete everywhere

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
