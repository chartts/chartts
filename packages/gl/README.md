<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/gl"><img src="https://img.shields.io/npm/v/@chartts/gl?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/gl

WebGL chart types for Chartts. GPU-accelerated 3D and high-performance 2D charts.

## Install

```bash
npm install @chartts/gl @chartts/core
```

## Chart types

| Type | Import |
|------|--------|
| 3D Bar | `@chartts/gl/bar3d` |
| 3D Line | `@chartts/gl/line3d` |
| 3D Scatter | `@chartts/gl/scatter3d` |
| 3D Surface | `@chartts/gl/surface3d` |
| 3D Globe | `@chartts/gl/globe3d` |
| GL Scatter (2D, 100k+ points) | `@chartts/gl/scatter-gl` |
| GL Lines (2D, high-perf) | `@chartts/gl/lines-gl` |
| GL Flow (particle animation) | `@chartts/gl/flow-gl` |
| GL Graph (force layout) | `@chartts/gl/graph-gl` |
| 3D Lines | `@chartts/gl/lines3d` |
| 3D Map | `@chartts/gl/map3d` |

## Usage

```ts
import { createGLChart } from "@chartts/gl"
import { bar3dChartType } from "@chartts/gl/bar3d"

const chart = createGLChart(container, bar3dChartType, data, {
  width: 800,
  height: 600,
})
```

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
