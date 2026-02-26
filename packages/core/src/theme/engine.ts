import type { ThemeConfig } from '../types'
import { CSS_PREFIX, LIGHT_THEME, DARK_THEME } from '../constants'
import { THEME_PRESETS } from './presets'

export function resolveTheme(theme: string | ThemeConfig): ThemeConfig {
  if (typeof theme === 'object') return { ...LIGHT_THEME, ...theme }

  switch (theme) {
    case 'dark': return DARK_THEME
    case 'light': return LIGHT_THEME
    case 'auto': return detectScheme() === 'dark' ? DARK_THEME : LIGHT_THEME
    default: {
      const preset = THEME_PRESETS[theme]
      if (preset) return preset
      return LIGHT_THEME
    }
  }
}

/**
 * Apply theme as CSS custom properties on a DOM element.
 * Every token becomes --chartts-* so users can override via CSS or Tailwind.
 */
export function applyTheme(el: HTMLElement | SVGElement, theme: ThemeConfig): void {
  const s = el.style

  theme.colors.forEach((c, i) => s.setProperty(`${CSS_PREFIX}-color-${i + 1}`, c))

  s.setProperty(`${CSS_PREFIX}-bg`, theme.background)
  s.setProperty(`${CSS_PREFIX}-text`, theme.textColor)
  s.setProperty(`${CSS_PREFIX}-text-muted`, theme.textMuted)
  s.setProperty(`${CSS_PREFIX}-axis`, theme.axisColor)
  s.setProperty(`${CSS_PREFIX}-grid`, theme.gridColor)
  s.setProperty(`${CSS_PREFIX}-tooltip-bg`, theme.tooltipBackground)
  s.setProperty(`${CSS_PREFIX}-tooltip-text`, theme.tooltipText)
  s.setProperty(`${CSS_PREFIX}-tooltip-border`, theme.tooltipBorder)
  s.setProperty(`${CSS_PREFIX}-font-family`, theme.fontFamily)
  s.setProperty(`${CSS_PREFIX}-font-size`, `${theme.fontSize}px`)
  s.setProperty(`${CSS_PREFIX}-font-size-sm`, `${theme.fontSizeSmall}px`)
  s.setProperty(`${CSS_PREFIX}-font-size-lg`, `${theme.fontSizeLarge}px`)
  s.setProperty(`${CSS_PREFIX}-radius`, `${theme.borderRadius}px`)
  s.setProperty(`${CSS_PREFIX}-grid-width`, String(theme.gridWidth))
  s.setProperty(`${CSS_PREFIX}-axis-width`, String(theme.axisWidth))
  s.setProperty(`${CSS_PREFIX}-point-r`, String(theme.pointRadius))
  s.setProperty(`${CSS_PREFIX}-line-w`, String(theme.lineWidth))
}

/** Watch for system color scheme changes. Returns unsubscribe function. */
export function watchScheme(cb: (scheme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e: MediaQueryListEvent): void => cb(e.matches ? 'dark' : 'light')
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}

function detectScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
