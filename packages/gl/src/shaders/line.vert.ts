/**
 * Screen-space thick line vertex shader via triangle expansion.
 * Each line segment is a quad (2 triangles, 4 vertices + 6 indices).
 */

import { PROJECTION_UNIFORMS } from './common.glsl'

export const LINE_VERT = /* glsl */ `
precision highp float;

${PROJECTION_UNIFORMS}

attribute vec3 a_position;
attribute vec3 a_next;
attribute vec3 a_color;
attribute float a_side;

uniform vec2 u_resolution;
uniform float u_lineWidth;

varying vec3 v_color;
varying float v_side;

void main() {
  vec4 clipCurrent = u_projView * u_model * vec4(a_position, 1.0);
  vec4 clipNext = u_projView * u_model * vec4(a_next, 1.0);

  vec2 screenCurrent = clipCurrent.xy / clipCurrent.w * u_resolution * 0.5;
  vec2 screenNext = clipNext.xy / clipNext.w * u_resolution * 0.5;

  vec2 dir = screenNext - screenCurrent;
  float len = length(dir);
  dir = len > 0.001 ? dir / len : vec2(1.0, 0.0);
  vec2 normal = vec2(-dir.y, dir.x);

  vec2 offset = normal * u_lineWidth * 0.5 * a_side;
  vec2 finalScreen = screenCurrent + offset;

  gl_Position = vec4(finalScreen / (u_resolution * 0.5) * clipCurrent.w, clipCurrent.z, clipCurrent.w);
  v_color = a_color;
  v_side = a_side;
}
`

export const LINE_VERT_UNIFORMS = [
  'u_projView', 'u_model', 'u_resolution', 'u_lineWidth',
]

export const LINE_VERT_ATTRIBUTES = [
  'a_position', 'a_next', 'a_color', 'a_side',
]
