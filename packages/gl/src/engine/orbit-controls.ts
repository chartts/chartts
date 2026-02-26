/**
 * Orbit controls — mouse/touch orbit, zoom, pan with inertia damping.
 */

import { type Vec3, vec3, vec3Add, vec3Scale, vec3Cross, vec3Normalize } from './math'
import { type CameraState, updateCamera, setCameraPosition, setCameraTarget } from './camera'

export interface OrbitConfig {
  enableRotate?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  damping?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
}

export interface OrbitState {
  theta: number
  phi: number
  radius: number
  target: Vec3
  dragging: boolean
  panning: boolean
  lastX: number
  lastY: number
  velocityTheta: number
  velocityPhi: number
  config: Required<OrbitConfig>
  dispose: () => void
}

function cartesianToSpherical(pos: Vec3, target: Vec3): { theta: number; phi: number; radius: number } {
  const dx = pos[0]! - target[0]!
  const dy = pos[1]! - target[1]!
  const dz = pos[2]! - target[2]!
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const theta = Math.atan2(dx, dz)
  const phi = Math.acos(Math.max(-1, Math.min(1, dy / (radius || 1))))
  return { theta, phi, radius }
}

function sphericalToCartesian(theta: number, phi: number, radius: number, target: Vec3, out: Vec3): void {
  out[0] = target[0]! + radius * Math.sin(phi) * Math.sin(theta)
  out[1] = target[1]! + radius * Math.cos(phi)
  out[2] = target[2]! + radius * Math.sin(phi) * Math.cos(theta)
}

export function createOrbitControls(
  canvas: HTMLCanvasElement,
  camera: CameraState,
  _width: number,
  _height: number,
  config: OrbitConfig = {},
): OrbitState {
  const cfg: Required<OrbitConfig> = {
    enableRotate: config.enableRotate ?? true,
    enableZoom: config.enableZoom ?? true,
    enablePan: config.enablePan ?? true,
    damping: config.damping ?? 0.1,
    autoRotate: config.autoRotate ?? false,
    autoRotateSpeed: config.autoRotateSpeed ?? 1.0,
    minDistance: config.minDistance ?? 0.5,
    maxDistance: config.maxDistance ?? 500,
    minPolarAngle: config.minPolarAngle ?? 0.01,
    maxPolarAngle: config.maxPolarAngle ?? Math.PI - 0.01,
  }

  const { theta, phi, radius } = cartesianToSpherical(camera.position, camera.target)

  const state: OrbitState = {
    theta,
    phi,
    radius,
    target: vec3(camera.target[0]!, camera.target[1]!, camera.target[2]!),
    dragging: false,
    panning: false,
    lastX: 0,
    lastY: 0,
    velocityTheta: 0,
    velocityPhi: 0,
    config: cfg,
    dispose: () => {},
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0 && cfg.enableRotate) {
      state.dragging = true
      state.lastX = e.clientX
      state.lastY = e.clientY
      state.velocityTheta = 0
      state.velocityPhi = 0
    } else if (e.button === 2 && cfg.enablePan) {
      state.panning = true
      state.lastX = e.clientX
      state.lastY = e.clientY
      e.preventDefault()
    }
  }

  const onMouseMove = (e: MouseEvent) => {
    if (state.dragging) {
      const dx = e.clientX - state.lastX
      const dy = e.clientY - state.lastY
      state.velocityTheta = -dx * 0.005
      state.velocityPhi = -dy * 0.005
      state.theta += state.velocityTheta
      state.phi = Math.max(cfg.minPolarAngle, Math.min(cfg.maxPolarAngle, state.phi + state.velocityPhi))
      state.lastX = e.clientX
      state.lastY = e.clientY
    } else if (state.panning) {
      const dx = e.clientX - state.lastX
      const dy = e.clientY - state.lastY
      const panSpeed = state.radius * 0.002
      // Get right and up vectors from camera
      const forward = vec3(
        camera.target[0]! - camera.position[0]!,
        camera.target[1]! - camera.position[1]!,
        camera.target[2]! - camera.position[2]!,
      )
      const right = vec3(0, 0, 0)
      vec3Cross(right, forward, camera.up)
      vec3Normalize(right, right)
      const up = vec3(0, 0, 0)
      vec3Cross(up, right, forward)
      vec3Normalize(up, up)

      const panX = vec3Scale(vec3(0, 0, 0), right, -dx * panSpeed)
      const panY = vec3Scale(vec3(0, 0, 0), up, dy * panSpeed)
      vec3Add(state.target, state.target, panX)
      vec3Add(state.target, state.target, panY)

      state.lastX = e.clientX
      state.lastY = e.clientY
    }
  }

  const onMouseUp = () => {
    state.dragging = false
    state.panning = false
  }

  const onWheel = (e: WheelEvent) => {
    if (!cfg.enableZoom) return
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1.1 : 0.9
    state.radius = Math.max(cfg.minDistance, Math.min(cfg.maxDistance, state.radius * factor))
  }

  const onContextMenu = (e: Event) => e.preventDefault()

  // Touch support
  let touchStartDist = 0
  let touchStartRadius = 0

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1 && cfg.enableRotate) {
      state.dragging = true
      state.lastX = e.touches[0]!.clientX
      state.lastY = e.touches[0]!.clientY
      state.velocityTheta = 0
      state.velocityPhi = 0
    } else if (e.touches.length === 2 && cfg.enableZoom) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
      touchStartDist = Math.sqrt(dx * dx + dy * dy)
      touchStartRadius = state.radius
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && state.dragging) {
      const dx = e.touches[0]!.clientX - state.lastX
      const dy = e.touches[0]!.clientY - state.lastY
      state.velocityTheta = -dx * 0.005
      state.velocityPhi = -dy * 0.005
      state.theta += state.velocityTheta
      state.phi = Math.max(cfg.minPolarAngle, Math.min(cfg.maxPolarAngle, state.phi + state.velocityPhi))
      state.lastX = e.touches[0]!.clientX
      state.lastY = e.touches[0]!.clientY
    } else if (e.touches.length === 2 && cfg.enableZoom) {
      const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
      const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      state.radius = Math.max(cfg.minDistance, Math.min(cfg.maxDistance, touchStartRadius * (touchStartDist / dist)))
    }
  }

  const onTouchEnd = () => {
    state.dragging = false
  }

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseleave', onMouseUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContextMenu)
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)

  state.dispose = () => {
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('mouseleave', onMouseUp)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('contextmenu', onContextMenu)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
  }

  return state
}

export function updateOrbitControls(
  orbit: OrbitState,
  camera: CameraState,
  width: number,
  height: number,
): boolean {
  let changed = false
  const cfg = orbit.config

  // Auto-rotate
  if (cfg.autoRotate && !orbit.dragging) {
    orbit.theta += cfg.autoRotateSpeed * 0.001
    changed = true
  }

  // Apply damping to velocity
  if (!orbit.dragging) {
    if (Math.abs(orbit.velocityTheta) > 0.0001 || Math.abs(orbit.velocityPhi) > 0.0001) {
      orbit.theta += orbit.velocityTheta * cfg.damping
      orbit.phi += orbit.velocityPhi * cfg.damping
      orbit.phi = Math.max(cfg.minPolarAngle, Math.min(cfg.maxPolarAngle, orbit.phi))
      orbit.velocityTheta *= (1 - cfg.damping)
      orbit.velocityPhi *= (1 - cfg.damping)
      changed = true
    } else {
      orbit.velocityTheta = 0
      orbit.velocityPhi = 0
    }
  } else {
    changed = true
  }

  if (orbit.panning) changed = true

  // Update camera position from spherical coordinates
  const newPos = vec3(0, 0, 0)
  sphericalToCartesian(orbit.theta, orbit.phi, orbit.radius, orbit.target, newPos)
  setCameraPosition(camera, newPos)
  setCameraTarget(camera, orbit.target)
  updateCamera(camera, width, height)

  return changed
}
