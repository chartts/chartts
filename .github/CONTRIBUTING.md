# Contributing to Chart.ts

Thank you for your interest in contributing to Chart.ts. This guide will help you get started.

## Getting Started

```bash
git clone https://github.com/chartts/chartts.git
cd chartts
pnpm install
pnpm build
```

## Project Structure

```
packages/
  core/       # Core charting library (SVG, Canvas renderers)
  gl/         # WebGL/3D chart types
  react/      # React bindings
  vue/        # Vue bindings
  svelte/     # Svelte bindings
  solid/      # Solid bindings
  angular/    # Angular bindings
  themes/     # Built-in themes
  csv/        # CSV data adapter
  json/       # JSON data adapter
  websocket/  # Real-time WebSocket data adapter
  statistics/ # Statistical utilities
  regression/ # Regression analysis
  finance/    # Financial chart utilities
  annotation/ # Chart annotations
  datalabels/ # Data label plugin
  ssr/        # Server-side rendering support
  cli/        # CLI tooling
  test-utils/ # Testing utilities
dev/          # Dev server and playground
```

## Development Workflow

Start the dev server in watch mode:

```bash
pnpm dev
```

The dev server runs on **port 4300**. Open `http://localhost:4300` to see the playground.

To build all packages:

```bash
pnpm build
```

To typecheck the entire project:

```bash
pnpm typecheck
```

## Code Style

- **TypeScript strict mode** is enabled across all packages.
- Do not use `any`. Use `unknown` with type guards or proper generics instead.
- All packages output **ESM + CJS** via `tsup` with full declaration files.
- Keep imports explicit. Prefer named exports over default exports.

## Adding a New Chart Type

1. Define the chart using `defineChartType()` in `packages/core/src/charts/`.
2. Register it in the `CHART_TYPES` map.
3. Export it from the package index (`packages/core/src/index.ts`).
4. Add a playground example in `dev/`.

```ts
import { defineChartType } from '../defineChartType'

export const myChart = defineChartType({
  type: 'my-chart',
  // ...configuration
})
```

## Adding a Framework Binding

Follow the pattern used in `packages/react/`:

1. Create a factory function that wraps the core chart.
2. Export typed component wrappers for each chart type.
3. Ensure the package has its own `tsup.config.ts` and `package.json`.

## Running Tests

```bash
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
```

## Submitting PRs

1. Fork the repository and create a branch from `main`.
2. Make your changes and ensure all checks pass.
3. Open a pull request against `main`.
4. Fill out the PR template completely.

All PRs must pass typechecking, linting, and build before merging.
