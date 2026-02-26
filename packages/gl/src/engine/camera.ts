/**
 * Camera system for 3D rendering.
 */

import {
  type Vec3, type Mat4,
  vec3, mat4, mat4Perspective, mat4Ortho, mat4LookAt, mat4Multiply, mat4Invert, toRad,
} from './math'

export interface CameraState {
  position: Vec3
  target: Vec3
  up: Vec3
  fov: number      // radians
  near: number
  far: number
  aspect: number
  ortho: boolean
  projectionMatrix: Mat4
  viewMatrix: Mat4
  projViewMatrix: Mat4
  invProjViewMatrix: Mat4
}

export interface CameraOptions {
  position?: [number, number, number]
  target?: [number, number, number]
  up?: [number, number, number]
  fov?: number       // degrees, default 45
  near?: number
  far?: number
  ortho?: boolean
}

export function createCamera(width: number, height: number, opts: CameraOptions = {}): CameraState {
  const state: CameraState = {
    position: vec3(...(opts.position ?? [5, 5, 5])),
    target: vec3(...(opts.target ?? [0, 0, 0])),
    up: vec3(...(opts.up ?? [0, 1, 0])),
    fov: toRad(opts.fov ?? 45),
    near: opts.near ?? 0.1,
    far: opts.far ?? 1000,
    aspect: width / height,
    ortho: opts.ortho ?? false,
    projectionMatrix: mat4(),
    viewMatrix: mat4(),
    projViewMatrix: mat4(),
    invProjViewMatrix: mat4(),
  }
  updateCamera(state, width, height)
  return state
}

export function updateCamera(state: CameraState, width: number, height: number): void {
  state.aspect = width / height

  if (state.ortho) {
    const halfH = 5
    const halfW = halfH * state.aspect
    mat4Ortho(state.projectionMatrix, -halfW, halfW, -halfH, halfH, state.near, state.far)
  } else {
    mat4Perspective(state.projectionMatrix, state.fov, state.aspect, state.near, state.far)
  }

  mat4LookAt(state.viewMatrix, state.position, state.target, state.up)
  mat4Multiply(state.projViewMatrix, state.projectionMatrix, state.viewMatrix)
  mat4Invert(state.invProjViewMatrix, state.projViewMatrix)
}

export function setCameraPosition(state: CameraState, pos: Vec3): void {
  state.position[0] = pos[0]!; state.position[1] = pos[1]!; state.position[2] = pos[2]!
}

export function setCameraTarget(state: CameraState, target: Vec3): void {
  state.target[0] = target[0]!; state.target[1] = target[1]!; state.target[2] = target[2]!
}

/** Project a 3D world point to 2D screen coordinates */
export function projectToScreen(
  worldPos: Vec3,
  projView: Mat4,
  width: number,
  height: number,
): { x: number; y: number; z: number } | null {
  const m = projView
  const x = worldPos[0]!, y = worldPos[1]!, z = worldPos[2]!
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!
  if (Math.abs(w) < 1e-10) return null
  const ndcX = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w
  const ndcY = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w
  const ndcZ = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
    z: ndcZ,
  }
}
