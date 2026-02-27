<p align="center">
  <a href="https://www.npmjs.com/package/@chartts/tailwind"><img src="https://img.shields.io/npm/v/@chartts/tailwind?color=06B6D4&label=npm" alt="npm version" /></a>
  <a href="https://github.com/chartts/chartts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-06B6D4" alt="MIT License" /></a>
  <a href="https://chartts.com"><img src="https://img.shields.io/badge/docs-chartts.com-06B6D4" alt="Documentation" /></a>
</p>

# @chartts/tailwind

Tailwind CSS plugin for Chartts. Bridges Tailwind v3 color variables to the CSS custom properties Chartts reads, and adds theme preset utility classes.

> **Tailwind v4:** This plugin is optional. Tailwind v4 exposes `--color-*` variables natively, which Chartts reads automatically.

## Install

```bash
npm install @chartts/tailwind
```

## Setup (Tailwind v3)

```js
// tailwind.config.js
import chartts from "@chartts/tailwind"

export default {
  plugins: [chartts()],
}
```

## What it does

1. **Color variables** — Exposes all Tailwind colors as `--color-*` CSS custom properties on `:root`
2. **Theme classes** — Adds utility classes like `.chartts-theme-corporate`, `.chartts-theme-saas`, etc.
3. **Dark mode** — Adds `.dark .chartts` overrides and `prefers-color-scheme` support

## Options

```js
chartts({
  colors: true,    // Expose --color-* variables (default: true)
  themes: true,    // Add theme utility classes (default: true)
  darkMode: true,  // Add dark mode overrides (default: true)
  palette: {},     // Custom color palette to expose
})
```

## Part of Chartts

Beautiful charts. Tiny bundle. Every framework.

- [Documentation](https://chartts.com/docs)
- [GitHub](https://github.com/chartts/chartts)
- [All packages](https://www.npmjs.com/org/chartts)

## License

MIT
