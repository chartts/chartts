<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/arrow"><img src="https://img.shields.io/npm/v/@chartts/arrow?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/arrow

Apache Arrow adapter for Chartts. Import Arrow tables as chart data.

## Install

```bash
npm install @chartts/arrow @chartts/core
```

Uses [apache-arrow](https://arrow.apache.org/docs/js/) for Arrow serialization.

## Usage

```ts
import { fromArrow, toArrow, toArrowIPC } from "@chartts/arrow"

// From IPC buffer
const response = await fetch("/data/metrics.arrow")
const buffer = await response.arrayBuffer()
const data = fromArrow(buffer)

// From an existing Arrow Table
import { tableFromIPC } from "apache-arrow"
const table = tableFromIPC(buffer)
const data2 = fromArrow(table)

// Export ChartData to Arrow Table
const arrowTable = toArrow(chart.data)

// Export to IPC bytes
const ipcBytes = toArrowIPC(chart.data)
```

## API

### `fromArrow(input, options?)`

Converts an Arrow `Table`, `ArrayBuffer`, or `Uint8Array` into `ChartData`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `labelColumn` | `string` | first non-numeric | Column to use as labels |
| `seriesColumns` | `string[]` | all numeric | Columns to use as series |

### `toArrow(data, options?)`

Converts `ChartData` to an Arrow `Table`.

### `toArrowIPC(data, options?)`

Converts `ChartData` to Arrow IPC format (`Uint8Array`).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `labelColumnName` | `string` | `"label"` | Name for the label column |

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
