<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/csv"><img src="https://img.shields.io/npm/v/@chartts/csv?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/csv

CSV/TSV adapter for Chartts. Parse and export chart data as CSV.

## Install

```bash
npm install @chartts/csv @chartts/core
```

Zero dependencies.

## Usage

```ts
import { fromCSV, toCSV } from "@chartts/csv"

// CSV string -> ChartData
const data = fromCSV(`
Month,Sales,Costs
Jan,4200,3100
Feb,5800,3900
Mar,7100,4200
`)

chart.update(data)

// ChartData -> CSV string
const csv = toCSV(chart.data)
```

## API

### `fromCSV(text, options?)`

Parses a CSV or TSV string into `ChartData`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | `string` | auto-detect | Column delimiter (`,` or `\t`) |
| `headers` | `boolean` | `true` | First row contains column names |
| `labelColumn` | `number \| string` | first non-numeric | Column to use as labels |
| `seriesColumns` | `(number \| string)[]` | all numeric | Columns to use as series |

### `toCSV(data, options?)`

Converts `ChartData` to a CSV string.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | `string` | `,` | Column delimiter |
| `headers` | `boolean` | `true` | Include header row |

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
