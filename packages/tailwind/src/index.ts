/**
 * @chartts/tailwind — Tailwind CSS plugin for Chartts.
 *
 * Tailwind v4: Works automatically (exposes --color-* variables natively).
 * Tailwind v3: Use this plugin to bridge Tailwind color variables to CSS
 *              custom properties that Chartts reads.
 *
 * Usage (tailwind.config.js):
 * ```js
 * import chartts from '@chartts/tailwind'
 * export default {
 *   plugins: [chartts()],
 * }
 * ```
 */

import plugin from 'tailwindcss/plugin'

// ---------------------------------------------------------------------------
// Tailwind color name → CSS variable mapping
//
// Chartts palette uses var(--color-blue-500, #hex) etc.
// Tailwind v3 doesn't expose --color-* by default — this plugin does.
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, Record<string, string> | string> = {
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843', 950: '#500724',
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
    400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
    800: '#155e75', 900: '#164e63', 950: '#083344',
  },
  lime: {
    50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264',
    400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f',
    800: '#3f6212', 900: '#365314', 950: '#1a2e05',
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4e',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  white: '#ffffff',
}

// ---------------------------------------------------------------------------
// Theme preset CSS classes
// ---------------------------------------------------------------------------

const THEME_CLASSES: Record<string, Record<string, string>> = {
  '.chartts-theme-corporate': {
    '--chartts-text': '#1e293b',
    '--chartts-text-muted': '#64748b',
    '--chartts-axis': '#94a3b8',
    '--chartts-grid': '#e2e8f0',
    '--chartts-tooltip-bg': '#ffffff',
    '--chartts-tooltip-text': '#1e293b',
    '--chartts-tooltip-border': '#cbd5e1',
    '--chartts-radius': '4px',
    '--chartts-font-family': '"Inter", "Segoe UI", -apple-system, sans-serif',
  },
  '.chartts-theme-saas': {
    '--chartts-text': '#0f172a',
    '--chartts-text-muted': '#475569',
    '--chartts-axis': '#cbd5e1',
    '--chartts-grid': '#f1f5f9',
    '--chartts-tooltip-bg': '#0f172a',
    '--chartts-tooltip-text': '#f8fafc',
    '--chartts-tooltip-border': '#334155',
    '--chartts-radius': '8px',
  },
  '.chartts-theme-startup': {
    '--chartts-text': '#2d3436',
    '--chartts-text-muted': '#636e72',
    '--chartts-axis': '#b2bec3',
    '--chartts-grid': '#dfe6e9',
    '--chartts-tooltip-bg': '#2d3436',
    '--chartts-tooltip-text': '#dfe6e9',
    '--chartts-tooltip-border': '#636e72',
    '--chartts-radius': '10px',
    '--chartts-font-family': '"DM Sans", "Inter", -apple-system, sans-serif',
  },
  '.chartts-theme-editorial': {
    '--chartts-text': '#1a1a1a',
    '--chartts-text-muted': '#7f8c8d',
    '--chartts-axis': '#bdc3c7',
    '--chartts-grid': '#ecf0f1',
    '--chartts-tooltip-bg': '#1a1a1a',
    '--chartts-tooltip-text': '#ecf0f1',
    '--chartts-tooltip-border': '#34495e',
    '--chartts-radius': '0px',
    '--chartts-font-family': '"Georgia", "Times New Roman", serif',
  },
  '.chartts-theme-ocean': {
    '--chartts-text': '#dfe6e9',
    '--chartts-text-muted': '#636e72',
    '--chartts-axis': '#2d3436',
    '--chartts-grid': '#2d3436',
    '--chartts-tooltip-bg': '#0a0a23',
    '--chartts-tooltip-text': '#dfe6e9',
    '--chartts-tooltip-border': '#2d3436',
    '--chartts-radius': '6px',
  },
}

// Dark mode overrides
const DARK_OVERRIDES: Record<string, string> = {
  '--chartts-text': '#f3f4f6',
  '--chartts-text-muted': '#6b7280',
  '--chartts-axis': '#374151',
  '--chartts-grid': '#1f2937',
  '--chartts-tooltip-bg': '#111827',
  '--chartts-tooltip-text': '#f3f4f6',
  '--chartts-tooltip-border': '#374151',
}

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------

export interface CharttsPluginOptions {
  /** Include all Tailwind color variables (default: true) */
  colors?: boolean
  /** Include theme preset classes (default: true) */
  themes?: boolean
  /** Include dark mode overrides (default: true) */
  darkMode?: boolean
  /** Custom color palette to expose as --color-* variables */
  palette?: Record<string, Record<string, string> | string>
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const charttsPlugin: { (options?: CharttsPluginOptions): any; __isOptionsFunction: true } = plugin.withOptions<CharttsPluginOptions>(
  (options = {}) => {
    const {
      colors = true,
      themes = true,
      darkMode = true,
    } = options

    return ({ addBase, addUtilities }) => {
      // 1. Expose Tailwind color variables as --color-* CSS custom properties
      //    This bridges Tailwind v3 to the var(--color-*) format Chartts uses
      if (colors) {
        const colorVars: Record<string, string> = {}
        const colorSource = options.palette ?? COLOR_MAP

        for (const [name, shades] of Object.entries(colorSource)) {
          if (typeof shades === 'string') {
            colorVars[`--color-${name}`] = shades
          } else {
            for (const [shade, hex] of Object.entries(shades)) {
              colorVars[`--color-${name}-${shade}`] = hex
            }
          }
        }

        addBase({ ':root': colorVars })
      }

      // 2. Theme preset utility classes
      if (themes) {
        addUtilities(THEME_CLASSES)
      }

      // 3. Dark mode overrides
      if (darkMode) {
        addBase({
          '.dark .chartts, .chartts-dark': DARK_OVERRIDES,
          '@media (prefers-color-scheme: dark)': {
            '.chartts-auto': DARK_OVERRIDES,
          },
        })
      }
    }
  },
)

export default charttsPlugin
export { charttsPlugin }
