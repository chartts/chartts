/**
 * Convenience factories — one function per chart type.
 */

import type { GLChartData, GLChartOptions, GLChartInstance, GLSeries3D } from '../types'
import { createGLChart } from './create-gl'

import { createScatter3DPlugin } from '../charts/scatter3d/scatter3d-type'
import { createBar3DPlugin } from '../charts/bar3d/bar3d-type'
import { createSurface3DPlugin } from '../charts/surface3d/surface3d-type'
import { createGlobe3DPlugin } from '../charts/globe3d/globe3d-type'
import { createMap3DPlugin } from '../charts/map3d/map3d-type'
import { createLines3DPlugin } from '../charts/lines3d/lines3d-type'
import { createLine3DPlugin } from '../charts/line3d/line3d-type'
import { createScatterGLPlugin } from '../charts/scatter-gl/scatter-gl-type'
import { createLinesGLPlugin } from '../charts/lines-gl/lines-gl-type'
import { createFlowGLPlugin } from '../charts/flow-gl/flow-gl-type'
import { createGraphGLPlugin } from '../charts/graph-gl/graph-gl-type'

export function Scatter3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createScatter3DPlugin(), data, options)
}

export function Bar3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createBar3DPlugin(), data, options)
}

export function Surface3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createSurface3DPlugin(), data, options)
}

export function Globe3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  if (!options.orbit) options.orbit = { autoRotate: true, autoRotateSpeed: 0.5 }
  if (!options.camera) options.camera = { position: [0, 2, 9], target: [0, 0, 0] }
  return createGLChart(container, createGlobe3DPlugin(), data, options)
}

export function Map3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  // Map3D normalizes values to extrudeHeight, so auto-fit camera from x/z extent only
  if (!options.camera) {
    const series = data.series as GLSeries3D[]
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const s of series) {
      if (s.x) for (const v of s.x) { if (v < minX) minX = v; if (v > maxX) maxX = v }
      if (s.z) for (const v of s.z) { if (v < minZ) minZ = v; if (v > maxZ) maxZ = v }
    }
    if (minX === Infinity) { minX = 0; maxX = 10 }
    if (minZ === Infinity) { minZ = 0; maxZ = 10 }
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2
    const ext = Math.max(maxX - minX, maxZ - minZ, 1)
    const dist = Math.max(ext * 1.8, 5)
    options.camera = {
      position: [cx + dist * 0.6, dist * 0.5, cz + dist * 0.6],
      target: [cx, 0, cz],
    }
  }
  return createGLChart(container, createMap3DPlugin(), data, options)
}

export function Lines3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createLines3DPlugin(), data, options)
}

export function Line3D(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createLine3DPlugin(), data, options)
}

export function ScatterGL(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createScatterGLPlugin(), data, options)
}

export function LinesGL(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createLinesGLPlugin(), data, options)
}

export function FlowGL(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createFlowGLPlugin(), data, options)
}

export function GraphGL(container: HTMLElement | string, opts: GLChartOptions & { data: GLChartData }): GLChartInstance {
  const { data, ...options } = opts
  return createGLChart(container, createGraphGLPlugin(), data, options)
}
