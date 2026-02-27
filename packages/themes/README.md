<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/themes"><img src="https://img.shields.io/npm/v/@chartts/themes?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/themes

Extra theme presets for Chartts. Drop-in themes beyond the 5 built into core.

## Install

```bash
npm install @chartts/themes @chartts/core
```

## Usage

```ts
import { neonTheme, pastelTheme, luxuryTheme } from "@chartts/themes"
import { createChart, lineChartType } from "@chartts/core"

createChart(container, lineChartType, data, { theme: neonTheme })
```

With framework packages:

```tsx
import { LineChart } from "@chartts/react"
import { midnightTheme } from "@chartts/themes"

<LineChart data={data} theme={midnightTheme} />
```

## Available themes

| Theme | Vibe |
|-------|------|
| `neonTheme` | Dark background, vivid neon accents, cyberpunk |
| `pastelTheme` | Soft muted tones, gentle on the eyes |
| `monochromeTheme` | Grayscale only, maximum clarity |
| `luxuryTheme` | Rich darks, gold accents, premium feel |
| `retroTheme` | Warm vintage tones, hand-drawn feel |
| `minimalTheme` | Ultra-clean, barely-there UI |
| `midnightTheme` | Deep blue dark mode |
| `earthTheme` | Natural, organic tones |

Core also includes 5 built-in presets: `corporate`, `saas`, `startup`, `editorial`, `ocean`.

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
