import type { ThemeConfig } from '../types'
import { FONT_FAMILY } from '../constants'

/**
 * Named theme presets for different use cases.
 *
 * Each preset defines a complete ThemeConfig with a curated color palette,
 * typography, and styling tuned for a specific aesthetic.
 */

// ---------------------------------------------------------------------------
// Corporate / Finance — muted blues and grays, solid grid, conservative
// ---------------------------------------------------------------------------

export const CORPORATE_THEME: ThemeConfig = {
  colors: [
    '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
    '#1e3a5f', '#0f766e', '#4f46e5', '#7c3aed', '#be185d',
  ],
  background: 'transparent',
  textColor: '#1e293b',
  textMuted: '#64748b',
  axisColor: '#94a3b8',
  gridColor: '#e2e8f0',
  tooltipBackground: '#ffffff',
  tooltipText: '#1e293b',
  tooltipBorder: '#cbd5e1',
  fontFamily: '"Inter", "Segoe UI", -apple-system, sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// SaaS / Dashboard — vibrant, modern, slightly rounded
// ---------------------------------------------------------------------------

export const SAAS_THEME: ThemeConfig = {
  colors: [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#06b6d4', '#0ea5e9', '#a855f7',
  ],
  background: 'transparent',
  textColor: '#0f172a',
  textMuted: '#475569',
  axisColor: '#cbd5e1',
  gridColor: '#f1f5f9',
  tooltipBackground: '#0f172a',
  tooltipText: '#f8fafc',
  tooltipBorder: '#334155',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Startup / Bold — high contrast, energetic palette
// ---------------------------------------------------------------------------

export const STARTUP_THEME: ThemeConfig = {
  colors: [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#01a3a4', '#f368e0', '#ff6348', '#2ed573',
  ],
  background: 'transparent',
  textColor: '#2d3436',
  textMuted: '#636e72',
  axisColor: '#b2bec3',
  gridColor: '#dfe6e9',
  tooltipBackground: '#2d3436',
  tooltipText: '#dfe6e9',
  tooltipBorder: '#636e72',
  fontFamily: '"DM Sans", "Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 15,
  borderRadius: 10,
  gridStyle: 'dotted',
  gridWidth: 1,
  axisWidth: 2,
  pointRadius: 5,
  lineWidth: 3,
}

// ---------------------------------------------------------------------------
// Editorial / Minimal — newspaper-inspired, serif accents, restrained palette
// ---------------------------------------------------------------------------

export const EDITORIAL_THEME: ThemeConfig = {
  colors: [
    '#1a1a1a', '#c0392b', '#2980b9', '#8e44ad', '#27ae60',
    '#d35400', '#2c3e50', '#16a085', '#f39c12', '#7f8c8d',
  ],
  background: 'transparent',
  textColor: '#1a1a1a',
  textMuted: '#7f8c8d',
  axisColor: '#bdc3c7',
  gridColor: '#ecf0f1',
  tooltipBackground: '#1a1a1a',
  tooltipText: '#ecf0f1',
  tooltipBorder: '#34495e',
  fontFamily: '"Georgia", "Times New Roman", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 0,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 1.5,
  pointRadius: 3,
  lineWidth: 1.5,
}

// ---------------------------------------------------------------------------
// Ocean / Dark — rich dark mode with ocean-inspired gradients
// ---------------------------------------------------------------------------

export const OCEAN_THEME: ThemeConfig = {
  colors: [
    '#00d2ff', '#3a7bd5', '#00b894', '#fdcb6e', '#e17055',
    '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff', '#ffeaa7',
  ],
  background: 'transparent',
  textColor: '#dfe6e9',
  textMuted: '#636e72',
  axisColor: '#2d3436',
  gridColor: '#2d3436',
  tooltipBackground: '#0a0a23',
  tooltipText: '#dfe6e9',
  tooltipBorder: '#2d3436',
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 6,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

/** All named presets keyed by name */
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  corporate: CORPORATE_THEME,
  saas: SAAS_THEME,
  startup: STARTUP_THEME,
  editorial: EDITORIAL_THEME,
  ocean: OCEAN_THEME,
}
