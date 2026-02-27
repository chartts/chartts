/**
 * FlowGL particle vertex shader — position + velocity + age → dynamic trail.
 * Supports speed-based sizing, velocity coloring, and direction encoding.
 */

export const PARTICLE_VERT = /* glsl */ `
precision highp float;

attribute vec2 a_position;
attribute vec2 a_velocity;
attribute float a_age;
attribute float a_speed;

uniform vec2 u_resolution;
uniform float u_pointSize;
uniform float u_pixelRatio;
uniform float u_speedRange;    // max speed for normalization
uniform float u_sizeBySpeed;   // 0..1 how much speed affects size

varying float v_age;
varying float v_speed;         // normalized 0..1
varying vec2 v_velocity;

void main() {
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);

  float normSpeed = clamp(a_speed / max(u_speedRange, 0.001), 0.0, 1.0);
  v_speed = normSpeed;
  v_age = a_age;
  v_velocity = a_velocity;

  // Size: base + speed contribution. Faster = bigger.
  float speedScale = mix(1.0, 1.0 + normSpeed * 2.0, u_sizeBySpeed);
  // Young particles slightly larger
  float ageScale = 1.0 - a_age * 0.3;
  gl_PointSize = u_pointSize * u_pixelRatio * speedScale * ageScale;
}
`

export const PARTICLE_VERT_UNIFORMS = [
  'u_resolution', 'u_pointSize', 'u_pixelRatio',
  'u_speedRange', 'u_sizeBySpeed',
]

export const PARTICLE_VERT_ATTRIBUTES = [
  'a_position', 'a_velocity', 'a_age', 'a_speed',
]
