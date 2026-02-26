/**
 * Type definitions for @chartts/gl.
 */

import type { GLRenderer } from './engine/renderer'
import type { CameraState, CameraOptions } from './engine/camera'
import type { OrbitState, OrbitConfig } from './engine/orbit-controls'
import type { LightConfig } from './engine/lighting'
import type { PickingSystem } from './engine/picking'

// ─── Data Types ──────────────────────────────────────────────────────

export interface GLSeries3D {
  name: string
  values: number[]
  x?: number[]
  y?: number[]
  z?: number[]
  color?: string
  size?: number
  opacity?: number
}

export interface GLSeries2D {
  name: string
  x: number[]
  y: number[]
  color?: string
  size?: number
  opacity?: number
}

export interface GLChartData {
  series: GLSeries3D[] | GLSeries2D[]
  categories?: string[]
  grid?: number[][]
}

// ─── Data Point (for hit testing) ────────────────────────────────────

export interface GLDataPoint {
  seriesIndex: number
  dataIndex: number
  value: number
  x?: number
  y?: number
  z?: number
  seriesName: string
}

// ─── Render Context ──────────────────────────────────────────────────

export interface GLRenderContext {
  renderer: GLRenderer
  camera: CameraState
  orbit: OrbitState | null
  picking: PickingSystem
  width: number
  height: number
  data: GLChartData
  options: GLChartOptions
  theme: GLTheme
  animationProgress: number
}

// ─── Theme ───────────────────────────────────────────────────────────

export interface GLTheme {
  background: [number, number, number]
  colors: string[]
  textColor: string
  gridColor: string
  fontFamily: string
  fontSize: number
}

export const DEFAULT_GL_THEME: GLTheme = {
  background: [0.08, 0.08, 0.12],
  colors: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666',
    '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
  ],
  textColor: '#ccc',
  gridColor: '#333',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
}

export const LIGHT_GL_THEME: GLTheme = {
  background: [0.97, 0.97, 0.97],
  colors: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666',
    '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
  ],
  textColor: '#333',
  gridColor: '#ddd',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 12,
}

// ─── Options ─────────────────────────────────────────────────────────

export interface GLChartOptions {
  camera?: CameraOptions
  orbit?: boolean | OrbitConfig
  light?: Partial<LightConfig>
  theme?: 'dark' | 'light' | GLTheme
  animate?: boolean
  animationDuration?: number
  tooltip?: boolean
  wireframe?: boolean
  opacity?: number
  pointSize?: number
  lineWidth?: number
  // Chart-specific options
  [key: string]: unknown
}

// ─── Plugin Interface ────────────────────────────────────────────────

export interface GLChartTypePlugin {
  readonly type: string
  prepare(ctx: GLRenderContext): void
  render(ctx: GLRenderContext): void
  renderPick?(ctx: GLRenderContext): void
  renderOverlay?(ctx: GLRenderContext, ctx2d: CanvasRenderingContext2D): void
  hitTest(ctx: GLRenderContext, x: number, y: number): GLDataPoint | null
  dispose(gl: WebGLRenderingContext): void
  needsLoop?(ctx: GLRenderContext): boolean
}

// ─── Chart Instance ──────────────────────────────────────────────────

export interface GLChartInstance {
  update(data: GLChartData): void
  setOption(opts: Partial<GLChartOptions>): void
  setCameraPosition(pos: [number, number, number]): void
  setCameraTarget(target: [number, number, number]): void
  resize(): void
  destroy(): void
  getDataAtPoint(x: number, y: number): GLDataPoint | null
}

// ─── Color Utilities ─────────────────────────────────────────────────

export function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

export function resolveTheme(theme?: 'dark' | 'light' | GLTheme): GLTheme {
  if (!theme || theme === 'dark') return DEFAULT_GL_THEME
  if (theme === 'light') return LIGHT_GL_THEME
  return theme
}
