/**
 * Linear algebra primitives for WebGL 3D rendering.
 *
 * All types backed by Float32Array for direct GPU upload.
 * Column-major matrices (OpenGL convention).
 * Zero allocations on hot path — all ops write to `out` param.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Vec2 = Float32Array  // length 2
export type Vec3 = Float32Array  // length 3
export type Vec4 = Float32Array  // length 4
export type Mat4 = Float32Array  // length 16, column-major

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export function vec2(x = 0, y = 0): Vec2 {
  return new Float32Array([x, y])
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return new Float32Array([x, y, z])
}

export function vec4(x = 0, y = 0, z = 0, w = 1): Vec4 {
  return new Float32Array([x, y, z, w])
}

export function mat4(): Mat4 {
  const m = new Float32Array(16)
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1
  return m
}

// ---------------------------------------------------------------------------
// Vec3 operations
// ---------------------------------------------------------------------------

export function vec3Set(out: Vec3, x: number, y: number, z: number): Vec3 {
  out[0] = x; out[1] = y; out[2] = z
  return out
}

export function vec3Copy(out: Vec3, a: Vec3): Vec3 {
  out[0] = a[0]!; out[1] = a[1]!; out[2] = a[2]!
  return out
}

export function vec3Add(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! + b[0]!; out[1] = a[1]! + b[1]!; out[2] = a[2]! + b[2]!
  return out
}

export function vec3Sub(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  out[0] = a[0]! - b[0]!; out[1] = a[1]! - b[1]!; out[2] = a[2]! - b[2]!
  return out
}

export function vec3Scale(out: Vec3, a: Vec3, s: number): Vec3 {
  out[0] = a[0]! * s; out[1] = a[1]! * s; out[2] = a[2]! * s
  return out
}

export function vec3Length(a: Vec3): number {
  return Math.sqrt(a[0]! * a[0]! + a[1]! * a[1]! + a[2]! * a[2]!)
}

export function vec3Normalize(out: Vec3, a: Vec3): Vec3 {
  const len = vec3Length(a)
  if (len > 0) {
    const inv = 1 / len
    out[0] = a[0]! * inv; out[1] = a[1]! * inv; out[2] = a[2]! * inv
  }
  return out
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
}

export function vec3Cross(out: Vec3, a: Vec3, b: Vec3): Vec3 {
  const ax = a[0]!, ay = a[1]!, az = a[2]!
  const bx = b[0]!, by = b[1]!, bz = b[2]!
  out[0] = ay * bz - az * by
  out[1] = az * bx - ax * bz
  out[2] = ax * by - ay * bx
  return out
}

export function vec3Lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out[0] = a[0]! + t * (b[0]! - a[0]!)
  out[1] = a[1]! + t * (b[1]! - a[1]!)
  out[2] = a[2]! + t * (b[2]! - a[2]!)
  return out
}

export function vec3TransformMat4(out: Vec3, a: Vec3, m: Mat4): Vec3 {
  const x = a[0]!, y = a[1]!, z = a[2]!
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]! || 1
  out[0] = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w
  out[1] = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w
  out[2] = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w
  return out
}

export function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a[0]! - b[0]!, dy = a[1]! - b[1]!, dz = a[2]! - b[2]!
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// ---------------------------------------------------------------------------
// Mat4 operations (column-major)
// ---------------------------------------------------------------------------

export function mat4Identity(out: Mat4): Mat4 {
  out.fill(0)
  out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1
  return out
}

export function mat4Copy(out: Mat4, a: Mat4): Mat4 {
  out.set(a)
  return out
}

export function mat4Multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const a00 = a[0]!, a01 = a[1]!, a02 = a[2]!, a03 = a[3]!
  const a10 = a[4]!, a11 = a[5]!, a12 = a[6]!, a13 = a[7]!
  const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!, a23 = a[11]!
  const a30 = a[12]!, a31 = a[13]!, a32 = a[14]!, a33 = a[15]!

  let b0 = b[0]!, b1 = b[1]!, b2 = b[2]!, b3 = b[3]!
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[4]!; b1 = b[5]!; b2 = b[6]!; b3 = b[7]!
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[8]!; b1 = b[9]!; b2 = b[10]!; b3 = b[11]!
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  b0 = b[12]!; b1 = b[13]!; b2 = b[14]!; b3 = b[15]!
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33

  return out
}

export function mat4Perspective(out: Mat4, fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2)
  out.fill(0)
  out[0] = f / aspect
  out[5] = f
  out[10] = (far + near) / (near - far)
  out[11] = -1
  out[14] = (2 * far * near) / (near - far)
  return out
}

export function mat4Ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
  const lr = 1 / (left - right)
  const bt = 1 / (bottom - top)
  const nf = 1 / (near - far)
  out.fill(0)
  out[0] = -2 * lr
  out[5] = -2 * bt
  out[10] = 2 * nf
  out[12] = (left + right) * lr
  out[13] = (top + bottom) * bt
  out[14] = (far + near) * nf
  out[15] = 1
  return out
}

export function mat4LookAt(out: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4 {
  const zx = eye[0]! - center[0]!
  const zy = eye[1]! - center[1]!
  const zz = eye[2]! - center[2]!
  let len = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz)
  const z0 = zx * len, z1 = zy * len, z2 = zz * len

  const xx = up[1]! * z2 - up[2]! * z1
  const xy = up[2]! * z0 - up[0]! * z2
  const xz = up[0]! * z1 - up[1]! * z0
  len = Math.sqrt(xx * xx + xy * xy + xz * xz)
  const x0 = len ? xx / len : 0, x1 = len ? xy / len : 0, x2 = len ? xz / len : 0

  const y0 = z1 * x2 - z2 * x1
  const y1 = z2 * x0 - z0 * x2
  const y2 = z0 * x1 - z1 * x0

  out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0
  out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0
  out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0
  out[12] = -(x0 * eye[0]! + x1 * eye[1]! + x2 * eye[2]!)
  out[13] = -(y0 * eye[0]! + y1 * eye[1]! + y2 * eye[2]!)
  out[14] = -(z0 * eye[0]! + z1 * eye[1]! + z2 * eye[2]!)
  out[15] = 1
  return out
}

export function mat4Invert(out: Mat4, a: Mat4): Mat4 | null {
  const a00 = a[0]!, a01 = a[1]!, a02 = a[2]!, a03 = a[3]!
  const a10 = a[4]!, a11 = a[5]!, a12 = a[6]!, a13 = a[7]!
  const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!, a23 = a[11]!
  const a30 = a[12]!, a31 = a[13]!, a32 = a[14]!, a33 = a[15]!

  const b00 = a00 * a11 - a01 * a10
  const b01 = a00 * a12 - a02 * a10
  const b02 = a00 * a13 - a03 * a10
  const b03 = a01 * a12 - a02 * a11
  const b04 = a01 * a13 - a03 * a11
  const b05 = a02 * a13 - a03 * a12
  const b06 = a20 * a31 - a21 * a30
  const b07 = a20 * a32 - a22 * a30
  const b08 = a20 * a33 - a23 * a30
  const b09 = a21 * a32 - a22 * a31
  const b10 = a21 * a33 - a23 * a31
  const b11 = a22 * a33 - a23 * a32

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
  if (!det) return null
  det = 1 / det

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det
  return out
}

export function mat4Translate(out: Mat4, a: Mat4, v: Vec3): Mat4 {
  const x = v[0]!, y = v[1]!, z = v[2]!
  if (a === out) {
    out[12] = a[0]! * x + a[4]! * y + a[8]! * z + a[12]!
    out[13] = a[1]! * x + a[5]! * y + a[9]! * z + a[13]!
    out[14] = a[2]! * x + a[6]! * y + a[10]! * z + a[14]!
    out[15] = a[3]! * x + a[7]! * y + a[11]! * z + a[15]!
  } else {
    const a00 = a[0]!, a01 = a[1]!, a02 = a[2]!, a03 = a[3]!
    const a10 = a[4]!, a11 = a[5]!, a12 = a[6]!, a13 = a[7]!
    const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!, a23 = a[11]!
    out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03
    out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13
    out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23
    out[12] = a00 * x + a10 * y + a20 * z + a[12]!
    out[13] = a01 * x + a11 * y + a21 * z + a[13]!
    out[14] = a02 * x + a12 * y + a22 * z + a[14]!
    out[15] = a03 * x + a13 * y + a23 * z + a[15]!
  }
  return out
}

export function mat4Scale(out: Mat4, a: Mat4, v: Vec3): Mat4 {
  const x = v[0]!, y = v[1]!, z = v[2]!
  out[0] = a[0]! * x; out[1] = a[1]! * x; out[2] = a[2]! * x; out[3] = a[3]! * x
  out[4] = a[4]! * y; out[5] = a[5]! * y; out[6] = a[6]! * y; out[7] = a[7]! * y
  out[8] = a[8]! * z; out[9] = a[9]! * z; out[10] = a[10]! * z; out[11] = a[11]! * z
  out[12] = a[12]!; out[13] = a[13]!; out[14] = a[14]!; out[15] = a[15]!
  return out
}

export function mat4RotateY(out: Mat4, a: Mat4, rad: number): Mat4 {
  const s = Math.sin(rad), c = Math.cos(rad)
  const a00 = a[0]!, a01 = a[1]!, a02 = a[2]!, a03 = a[3]!
  const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!, a23 = a[11]!
  out[0] = a00 * c - a20 * s; out[1] = a01 * c - a21 * s
  out[2] = a02 * c - a22 * s; out[3] = a03 * c - a23 * s
  out[4] = a[4]!; out[5] = a[5]!; out[6] = a[6]!; out[7] = a[7]!
  out[8] = a00 * s + a20 * c; out[9] = a01 * s + a21 * c
  out[10] = a02 * s + a22 * c; out[11] = a03 * s + a23 * c
  out[12] = a[12]!; out[13] = a[13]!; out[14] = a[14]!; out[15] = a[15]!
  return out
}

export function mat4RotateX(out: Mat4, a: Mat4, rad: number): Mat4 {
  const s = Math.sin(rad), c = Math.cos(rad)
  const a10 = a[4]!, a11 = a[5]!, a12 = a[6]!, a13 = a[7]!
  const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!, a23 = a[11]!
  out[0] = a[0]!; out[1] = a[1]!; out[2] = a[2]!; out[3] = a[3]!
  out[4] = a10 * c + a20 * s; out[5] = a11 * c + a21 * s
  out[6] = a12 * c + a22 * s; out[7] = a13 * c + a23 * s
  out[8] = a20 * c - a10 * s; out[9] = a21 * c - a11 * s
  out[10] = a22 * c - a12 * s; out[11] = a23 * c - a13 * s
  out[12] = a[12]!; out[13] = a[13]!; out[14] = a[14]!; out[15] = a[15]!
  return out
}

// ---------------------------------------------------------------------------
// Normal matrix (transpose of inverse of upper-left 3x3)
// ---------------------------------------------------------------------------

export function mat3NormalFromMat4(out: Float32Array, a: Mat4): Float32Array {
  const a00 = a[0]!, a01 = a[1]!, a02 = a[2]!
  const a10 = a[4]!, a11 = a[5]!, a12 = a[6]!
  const a20 = a[8]!, a21 = a[9]!, a22 = a[10]!

  const b01 = a22 * a11 - a12 * a21
  const b11 = -a22 * a10 + a12 * a20
  const b21 = a21 * a10 - a11 * a20

  let det = a00 * b01 + a01 * b11 + a02 * b21
  if (!det) return out
  det = 1 / det

  out[0] = b01 * det
  out[1] = (-a22 * a01 + a02 * a21) * det
  out[2] = (a12 * a01 - a02 * a11) * det
  out[3] = b11 * det
  out[4] = (a22 * a00 - a02 * a20) * det
  out[5] = (-a12 * a00 + a02 * a10) * det
  out[6] = b21 * det
  out[7] = (-a21 * a00 + a01 * a20) * det
  out[8] = (a11 * a00 - a01 * a10) * det
  return out
}

// ---------------------------------------------------------------------------
// Raycasting
// ---------------------------------------------------------------------------

export function unproject(
  out: Vec3,
  winX: number, winY: number, winZ: number,
  invProjView: Mat4,
  viewport: Vec4,
): Vec3 {
  const x = (winX - viewport[0]!) / viewport[2]! * 2 - 1
  const y = (winY - viewport[1]!) / viewport[3]! * 2 - 1
  const z = winZ * 2 - 1

  const m = invProjView
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!
  if (Math.abs(w) < 1e-10) return out

  out[0] = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w
  out[1] = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w
  out[2] = (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w
  return out
}

export function raySphereIntersect(
  origin: Vec3, dir: Vec3,
  center: Vec3, radius: number,
): number {
  const ox = origin[0]! - center[0]!
  const oy = origin[1]! - center[1]!
  const oz = origin[2]! - center[2]!
  const a = dir[0]! * dir[0]! + dir[1]! * dir[1]! + dir[2]! * dir[2]!
  const b = 2 * (ox * dir[0]! + oy * dir[1]! + oz * dir[2]!)
  const c = ox * ox + oy * oy + oz * oz - radius * radius
  const disc = b * b - 4 * a * c
  if (disc < 0) return -1
  return (-b - Math.sqrt(disc)) / (2 * a)
}

export function rayPlaneIntersect(
  origin: Vec3, dir: Vec3,
  normal: Vec3, dist: number,
): number {
  const denom = vec3Dot(normal, dir)
  if (Math.abs(denom) < 1e-6) return -1
  return -(vec3Dot(normal, origin) + dist) / denom
}

/** Convert degrees to radians */
export function toRad(deg: number): number {
  return deg * Math.PI / 180
}
