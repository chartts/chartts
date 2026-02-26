/**
 * createGLChart — factory that wires up renderer, camera, orbit, picking, and chart plugin.
 */

import { createGLRenderer } from '../engine/renderer'
import { createCamera, updateCamera } from '../engine/camera'
import { createOrbitControls, updateOrbitControls, type OrbitState } from '../engine/orbit-controls'
import { defaultLightConfig, setLightUniforms, type LightConfig } from '../engine/lighting'
import { createPickingSystem } from '../engine/picking'
import { createGrid3D, type Grid3D } from '../engine/grid3d'
import type {
  GLChartTypePlugin, GLChartData, GLChartOptions, GLChartInstance,
  GLRenderContext, GLSeries3D,
} from '../types'
import { resolveTheme } from '../types'

/** Compute data bounds for auto-camera fitting */
function computeDataBounds(data: GLChartData): {
  center: [number, number, number]; maxExtent: number;
  minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number
} {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity

  // Check 3D grid data
  if (data.grid && data.grid.length > 0) {
    const rows = data.grid.length, cols = data.grid[0]!.length
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const y = data.grid[r]![c]!
      const x = c / (cols - 1 || 1) * 10 - 5
      const z = r / (rows - 1 || 1) * 10 - 5
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
    }
  }

  // Check series data
  for (const s of data.series) {
    const s3d = s as GLSeries3D
    if (s3d.x) for (const v of s3d.x) { if (v < minX) minX = v; if (v > maxX) maxX = v }
    if (s3d.y) for (const v of s3d.y) { if (v < minY) minY = v; if (v > maxY) maxY = v }
    if (s3d.z) for (const v of s3d.z) { if (v < minZ) minZ = v; if (v > maxZ) maxZ = v }
    if (s3d.values) for (const v of s3d.values) { if (v < minY) minY = v; if (v > maxY) maxY = v }
  }

  // Handle no-data or 2D fallback
  if (minX === Infinity) { minX = -5; maxX = 5 }
  if (minY === Infinity) { minY = 0; maxY = 5 }
  if (minZ === Infinity) { minZ = -5; maxZ = 5 }

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const extentX = maxX - minX || 1
  const extentY = maxY - minY || 1
  const extentZ = maxZ - minZ || 1
  const maxExtent = Math.max(extentX, extentY, extentZ)

  return { center: [cx, cy, cz], maxExtent, minX, maxX, minY, maxY, minZ, maxZ }
}

export function createGLChart(
  container: HTMLElement | string,
  plugin: GLChartTypePlugin,
  data: GLChartData,
  options: GLChartOptions = {},
): GLChartInstance {
  const el = typeof container === 'string'
    ? document.querySelector<HTMLElement>(container)!
    : container

  if (!el) throw new Error(`[chartts/gl] Container not found: ${container}`)

  const renderer = createGLRenderer(el)
  const { width, height } = renderer
  const theme = resolveTheme(options.theme)

  // Auto-fit camera if no explicit position given
  const is2D = plugin.type.endsWith('-gl') // scatter-gl, lines-gl, flow-gl, graph-gl
  let cameraOpts = options.camera
  if (!is2D && !cameraOpts?.position) {
    const bounds = computeDataBounds(data)
    const [cx, cy, cz] = bounds.center
    const dist = Math.max(bounds.maxExtent * 1.6, 5)
    cameraOpts = {
      ...cameraOpts,
      position: [cx + dist * 0.7, cy + dist * 0.5, cz + dist * 0.7],
      target: [cx, cy, cz],
    }
  }

  // Camera
  const camera = createCamera(width, height, cameraOpts)

  // Orbit controls
  let orbit: OrbitState | null = null
  if (options.orbit !== false) {
    const orbitConfig = typeof options.orbit === 'object' ? options.orbit : {}
    orbit = createOrbitControls(renderer.glCanvas, camera, width, height, orbitConfig)
  }

  // Lighting
  const lightConfig: LightConfig = {
    ...defaultLightConfig(),
    ...(options.light || {}),
  }

  // Picking
  const picking = createPickingSystem(renderer.gl, width, height, renderer.pixelRatio)

  // Build context
  const ctx: GLRenderContext = {
    renderer,
    camera,
    orbit,
    picking,
    width,
    height,
    data,
    options,
    theme,
    animationProgress: options.animate !== false ? 0 : 1,
  }

  // Prepare chart
  plugin.prepare(ctx)

  // 3D ground grid (only for 3D charts)
  let grid: Grid3D | null = null
  if (!is2D && options['grid'] !== false) {
    grid = createGrid3D(renderer)
    const bounds = computeDataBounds(data)
    grid.update({
      minX: bounds.minX, maxX: bounds.maxX,
      minZ: bounds.minZ, maxZ: bounds.maxZ,
      y: bounds.minY,
    })
  }

  // Animation state
  let animating = options.animate !== false
  const animDuration = options.animationDuration ?? 800
  let animStart = 0
  let rafId = 0
  let disposed = false
  let loopRunning = false
  let dirty = true  // force first frame

  // Tooltip element
  let tooltipEl: HTMLDivElement | null = null
  if (options.tooltip !== false) {
    tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = `
      position: absolute; pointer-events: none; display: none;
      background: rgba(0,0,0,0.85); color: #fff; padding: 6px 10px;
      border-radius: 4px; font-size: 12px; font-family: ${theme.fontFamily};
      z-index: 10; white-space: nowrap;
    `
    el.appendChild(tooltipEl)
  }

  function drawFrame() {
    const bg = theme.background
    renderer.beginFrame()
    renderer.clear(bg[0], bg[1], bg[2], 1)

    // Set light uniforms on any mesh program
    const meshProg = renderer.getProgram('mesh')
    if (meshProg) {
      meshProg.use()
      setLightUniforms(meshProg, lightConfig, camera.position)
    }

    // Render ground grid (before chart so it appears underneath)
    if (grid) grid.render(camera, ctx.animationProgress)

    // Render chart
    plugin.render(ctx)

    // Render 2D overlay
    if (plugin.renderOverlay) {
      plugin.renderOverlay(ctx, renderer.ctx2d)
    }

    renderer.endFrame()
  }

  function renderFrame(time: number) {
    if (disposed) { loopRunning = false; return }

    if (animating) {
      if (animStart === 0) animStart = time
      const elapsed = time - animStart
      ctx.animationProgress = Math.min(1, elapsed / animDuration)
      if (ctx.animationProgress >= 1) animating = false
      dirty = true
    }

    // Update orbit
    if (orbit) {
      const orbitChanged = updateOrbitControls(orbit, camera, ctx.width, ctx.height)
      if (orbitChanged) dirty = true
    }

    const needsLoop = plugin.needsLoop?.(ctx) ?? false
    if (needsLoop) dirty = true

    // Always draw when dirty
    if (dirty) {
      drawFrame()
      dirty = false
    }

    // Decide whether to keep looping
    const keepLooping = animating || needsLoop || (orbit != null && (
      orbit.dragging || orbit.panning ||
      Math.abs(orbit.velocityTheta) > 0.0001 || Math.abs(orbit.velocityPhi) > 0.0001 ||
      orbit.config.autoRotate
    ))

    if (keepLooping) {
      rafId = requestAnimationFrame(renderFrame)
    } else {
      loopRunning = false
    }
  }

  /** Ensure the rAF loop is running */
  function ensureLoop() {
    if (disposed) return
    dirty = true
    if (!loopRunning) {
      loopRunning = true
      rafId = requestAnimationFrame(renderFrame)
    }
  }

  // Input events restart the render loop
  const onInteraction = () => ensureLoop()

  renderer.glCanvas.addEventListener('mousedown', onInteraction)
  renderer.glCanvas.addEventListener('mousemove', onInteraction)
  renderer.glCanvas.addEventListener('wheel', onInteraction, { passive: true })
  renderer.glCanvas.addEventListener('touchstart', onInteraction, { passive: true })
  renderer.glCanvas.addEventListener('touchmove', onInteraction, { passive: true })

  // Mouse move for tooltip + picking
  const onMouseMove = (e: MouseEvent) => {
    const rect = renderer.glCanvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hit = plugin.hitTest(ctx, x, y)
    if (tooltipEl) {
      if (hit) {
        tooltipEl.style.display = 'block'
        tooltipEl.style.left = `${x + 12}px`
        tooltipEl.style.top = `${y - 12}px`
        tooltipEl.textContent = `${hit.seriesName}: ${hit.value.toFixed(2)}`
      } else {
        tooltipEl.style.display = 'none'
      }
    }
  }

  renderer.glCanvas.addEventListener('mousemove', onMouseMove)

  // Start the loop
  loopRunning = true
  rafId = requestAnimationFrame(renderFrame)

  // Resize observer
  const resizeObserver = new ResizeObserver(() => {
    if (disposed) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w === 0 || h === 0) return
    renderer.resize(w, h)
    ctx.width = w
    ctx.height = h
    updateCamera(camera, w, h)
    picking.resize(w, h)
    ensureLoop()
  })
  resizeObserver.observe(el)

  return {
    update(newData) {
      ctx.data = newData
      plugin.prepare(ctx)
      if (grid) {
        const bounds = computeDataBounds(newData)
        grid.update({ minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ, y: bounds.minY })
      }
      if (options.animate !== false) {
        animating = true
        animStart = 0
        ctx.animationProgress = 0
      }
      ensureLoop()
    },

    setOption(opts) {
      Object.assign(ctx.options, opts)
      if (opts.theme) {
        const newTheme = resolveTheme(opts.theme)
        Object.assign(ctx.theme, newTheme)
      }
      plugin.prepare(ctx)
      ensureLoop()
    },

    setCameraPosition(pos) {
      camera.position[0] = pos[0]
      camera.position[1] = pos[1]
      camera.position[2] = pos[2]
      updateCamera(camera, ctx.width, ctx.height)
      ensureLoop()
    },

    setCameraTarget(target) {
      camera.target[0] = target[0]
      camera.target[1] = target[1]
      camera.target[2] = target[2]
      if (orbit) {
        orbit.target[0] = target[0]
        orbit.target[1] = target[1]
        orbit.target[2] = target[2]
      }
      updateCamera(camera, ctx.width, ctx.height)
      ensureLoop()
    },

    resize() {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.resize(w, h)
      ctx.width = w
      ctx.height = h
      updateCamera(camera, w, h)
      picking.resize(w, h)
      ensureLoop()
    },

    getDataAtPoint(x, y) {
      return plugin.hitTest(ctx, x, y)
    },

    destroy() {
      disposed = true
      loopRunning = false
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      renderer.glCanvas.removeEventListener('mousedown', onInteraction)
      renderer.glCanvas.removeEventListener('mousemove', onInteraction)
      renderer.glCanvas.removeEventListener('wheel', onInteraction)
      renderer.glCanvas.removeEventListener('touchstart', onInteraction)
      renderer.glCanvas.removeEventListener('touchmove', onInteraction)
      renderer.glCanvas.removeEventListener('mousemove', onMouseMove)
      if (tooltipEl) tooltipEl.remove()
      grid?.destroy()
      orbit?.dispose()
      plugin.dispose(renderer.gl)
      picking.destroy()
      renderer.destroy()
    },
  }
}
