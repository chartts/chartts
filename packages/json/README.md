<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/json"><img src="https://img.shields.io/npm/v/@chartts/json?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/json

JSON adapter for Chartts. Convert between JSON and chart data.

## Install

```bash
npm install @chartts/json @chartts/core
```

Zero dependencies.

## Usage

```ts
import { fromJSON, toJSON } from "@chartts/json"

// Array of objects
const data = fromJSON([
  { month: "Jan", sales: 4200, costs: 3100 },
  { month: "Feb", sales: 5800, costs: 3900 },
  { month: "Mar", sales: 7100, costs: 4200 },
])

// Columnar format
const data2 = fromJSON({
  labels: ["Jan", "Feb", "Mar"],
  sales: [4200, 5800, 7100],
  costs: [3100, 3900, 4200],
})

// ChartData passthrough (already valid)
const data3 = fromJSON({ labels: [...], series: [...] })

// Export
const rows = toJSON(chart.data) // array of objects
const cols = toJSON(chart.data, { format: "columnar" })
```

## API

### `fromJSON(input, options?)`

Parses JSON into `ChartData`. Accepts a string or object. Auto-detects three shapes:

- **Array of objects** — `[{month: "Jan", sales: 10}, ...]`
- **Columnar** — `{labels: [...], sales: [...], costs: [...]}`
- **ChartData** — passed through as-is

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `labelKey` | `string` | auto-detect | Key to use as labels |
| `seriesKeys` | `string[]` | all numeric keys | Keys to use as series |

### `toJSON(data, options?)`

Converts `ChartData` to JSON.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `"rows" \| "columnar"` | `"rows"` | Output shape |

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
