<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/excel"><img src="https://img.shields.io/npm/v/@chartts/excel?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/excel

Excel adapter for Chartts. Import and export .xlsx spreadsheets as chart data.

## Install

```bash
npm install @chartts/excel @chartts/core
```

Uses [SheetJS](https://sheetjs.com/) for Excel parsing.

## Usage

```ts
import { fromExcel, toExcel } from "@chartts/excel"

// Read .xlsx file
const response = await fetch("/data/sales.xlsx")
const buffer = await response.arrayBuffer()
const data = fromExcel(buffer)

// Specific sheet and range
const data2 = fromExcel(buffer, {
  sheet: "Q1 Report",
  range: "A1:D10",
  labelColumn: "Month",
})

// Export to .xlsx
const xlsx = toExcel(chart.data)
```

## API

### `fromExcel(buffer, options?)`

Parses an Excel file (`ArrayBuffer` or `Uint8Array`) into `ChartData`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sheet` | `string \| number` | `0` | Sheet name or index |
| `headers` | `boolean` | `true` | First row contains column names |
| `range` | `string` | entire sheet | Cell range, e.g. `"A1:D10"` |
| `labelColumn` | `number \| string` | first non-numeric | Column to use as labels |
| `seriesColumns` | `(number \| string)[]` | all numeric | Columns to use as series |

### `toExcel(data, options?)`

Converts `ChartData` to an `ArrayBuffer` (.xlsx format).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sheetName` | `string` | `"Sheet1"` | Name of the worksheet |

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
