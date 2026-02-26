/**
 * 3D mesh vertex shader — position + normal + color → lit fragment.
 */

import { PROJECTION_UNIFORMS, NORMAL_UNIFORMS } from './common.glsl'

export const MESH_VERT = /* glsl */ `
precision highp float;

${PROJECTION_UNIFORMS}
${NORMAL_UNIFORMS}

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec3 v_color;

void main() {
  vec4 worldPos = u_model * vec4(a_position, 1.0);
  v_fragPos = worldPos.xyz;
  v_normal = u_normalMatrix * a_normal;
  v_color = a_color;
  gl_Position = u_projView * worldPos;
}
`

export const MESH_VERT_UNIFORMS = [
  'u_projView', 'u_model', 'u_normalMatrix',
]

export const MESH_VERT_ATTRIBUTES = [
  'a_position', 'a_normal', 'a_color',
]
