import type { ThemeConfig } from '@chartts/core'

// ---------------------------------------------------------------------------
// Neon — dark background, vivid neon accents, cyberpunk feel
// ---------------------------------------------------------------------------

export const neonTheme: ThemeConfig = {
  colors: [
    '#00fff5', '#ff00ff', '#39ff14', '#ff3131', '#ffff00',
    '#bf00ff', '#ff6600', '#00bfff', '#ff1493', '#7fff00',
  ],
  background: 'transparent',
  textColor: '#e0e0e0',
  textMuted: '#777777',
  axisColor: '#444444',
  gridColor: '#2a2a2a',
  tooltipBackground: '#1a1a2e',
  tooltipText: '#e0e0e0',
  tooltipBorder: '#444444',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 2,
  gridStyle: 'dotted',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Pastel — soft muted tones, gentle on the eyes
// ---------------------------------------------------------------------------

export const pastelTheme: ThemeConfig = {
  colors: [
    '#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5eaea',
    '#ffb6b9', '#fae3d9', '#bbded6', '#61c0bf', '#f6c6ea',
  ],
  background: 'transparent',
  textColor: '#4a4a4a',
  textMuted: '#8a8a8a',
  axisColor: '#c0c0c0',
  gridColor: '#f0f0f0',
  tooltipBackground: '#ffffff',
  tooltipText: '#4a4a4a',
  tooltipBorder: '#e0e0e0',
  fontFamily: '"Nunito", "Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 12,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 5,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Monochrome — grayscale only, maximum clarity
// ---------------------------------------------------------------------------

export const monochromeTheme: ThemeConfig = {
  colors: [
    '#111111', '#333333', '#555555', '#777777', '#999999',
    '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#444444',
  ],
  background: 'transparent',
  textColor: '#111111',
  textMuted: '#666666',
  axisColor: '#999999',
  gridColor: '#e5e5e5',
  tooltipBackground: '#111111',
  tooltipText: '#f5f5f5',
  tooltipBorder: '#333333',
  fontFamily: '"Helvetica Neue", "Arial", sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 0,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Luxury — rich darks, gold accents, premium feel
// ---------------------------------------------------------------------------

export const luxuryTheme: ThemeConfig = {
  colors: [
    '#d4af37', '#c9b037', '#bf9b30', '#a67c00', '#8b6914',
    '#e8d5b7', '#c0c0c0', '#b87333', '#e5c100', '#ffd700',
  ],
  background: 'transparent',
  textColor: '#f5f0e8',
  textMuted: '#a09080',
  axisColor: '#504030',
  gridColor: '#302820',
  tooltipBackground: '#1a1410',
  tooltipText: '#f5f0e8',
  tooltipBorder: '#504030',
  fontFamily: '"Playfair Display", "Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 2,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Retro — warm vintage tones, hand-drawn feel
// ---------------------------------------------------------------------------

export const retroTheme: ThemeConfig = {
  colors: [
    '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
    '#264653', '#a8dadc', '#606c38', '#dda15e', '#bc6c25',
  ],
  background: 'transparent',
  textColor: '#3d3d3d',
  textMuted: '#7a7a7a',
  axisColor: '#b0a090',
  gridColor: '#e8e0d8',
  tooltipBackground: '#3d3d3d',
  tooltipText: '#f5f0e8',
  tooltipBorder: '#7a7a7a',
  fontFamily: '"Courier New", "Courier", monospace',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 0,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 2,
  pointRadius: 4,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Minimal — ultra-clean, barely there UI
// ---------------------------------------------------------------------------

export const minimalTheme: ThemeConfig = {
  colors: [
    '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
    '#0891b2', '#4f46e5', '#c026d3', '#059669', '#d97706',
  ],
  background: 'transparent',
  textColor: '#374151',
  textMuted: '#9ca3af',
  axisColor: '#e5e7eb',
  gridColor: '#f9fafb',
  tooltipBackground: '#ffffff',
  tooltipText: '#374151',
  tooltipBorder: '#f3f4f6',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 0.5,
  pointRadius: 2.5,
  lineWidth: 1.5,
}

// ---------------------------------------------------------------------------
// Midnight — deep blue dark mode
// ---------------------------------------------------------------------------

export const midnightTheme: ThemeConfig = {
  colors: [
    '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa',
    '#fb923c', '#2dd4bf', '#f87171', '#818cf8', '#4ade80',
  ],
  background: 'transparent',
  textColor: '#e2e8f0',
  textMuted: '#64748b',
  axisColor: '#334155',
  gridColor: '#1e293b',
  tooltipBackground: '#0f172a',
  tooltipText: '#f1f5f9',
  tooltipBorder: '#334155',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Earth — natural, organic tones
// ---------------------------------------------------------------------------

export const earthTheme: ThemeConfig = {
  colors: [
    '#606c38', '#283618', '#dda15e', '#bc6c25', '#588157',
    '#a3b18a', '#dad7cd', '#344e41', '#3a5a40', '#6b705c',
  ],
  background: 'transparent',
  textColor: '#283618',
  textMuted: '#6b705c',
  axisColor: '#a3b18a',
  gridColor: '#dad7cd',
  tooltipBackground: '#283618',
  tooltipText: '#dad7cd',
  tooltipBorder: '#588157',
  fontFamily: '"Merriweather", "Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------

export const EXTRA_THEMES: Record<string, ThemeConfig> = {
  neon: neonTheme,
  pastel: pastelTheme,
  monochrome: monochromeTheme,
  luxury: luxuryTheme,
  retro: retroTheme,
  minimal: minimalTheme,
  midnight: midnightTheme,
  earth: earthTheme,
}
