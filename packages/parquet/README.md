<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/parquet"><img src="https://img.shields.io/npm/v/@chartts/parquet?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/parquet

Parquet adapter for Chartts. Import Parquet files as chart data.

## Install

```bash
npm install @chartts/parquet @chartts/core
```

Uses [hyparquet](https://github.com/hyparam/hyparquet) for Parquet parsing.

## Usage

```ts
import { fromParquet } from "@chartts/parquet"

const response = await fetch("/data/metrics.parquet")
const buffer = await response.arrayBuffer()
const data = await fromParquet(buffer)

// With column selection and row limit
const data2 = await fromParquet(buffer, {
  labelColumn: "timestamp",
  seriesColumns: ["cpu", "memory", "disk"],
  rowLimit: 1000,
})
```

## API

### `fromParquet(buffer, options?)`

Parses a Parquet file (`ArrayBuffer` or `Uint8Array`) into `ChartData`. Returns a `Promise`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `labelColumn` | `string` | auto-detect | Column to use as labels |
| `seriesColumns` | `string[]` | all numeric | Columns to use as series |
| `rowLimit` | `number` | all rows | Maximum rows to read |

> Export is not supported. Parquet writing is complex and out of scope for a charting adapter.

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
