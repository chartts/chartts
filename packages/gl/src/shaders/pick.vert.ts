/**
 * Pick pass vertex shader — same transforms, outputs pick color.
 */

import { PROJECTION_UNIFORMS } from './common.glsl'

export const PICK_VERT = /* glsl */ `
precision highp float;

${PROJECTION_UNIFORMS}

attribute vec3 a_position;
attribute vec3 a_pickColor;

varying vec3 v_pickColor;

void main() {
  vec4 worldPos = u_model * vec4(a_position, 1.0);
  gl_Position = u_projView * worldPos;
  v_pickColor = a_pickColor;
}
`

export const PICK_VERT_UNIFORMS = ['u_projView', 'u_model']
export const PICK_VERT_ATTRIBUTES = ['a_position', 'a_pickColor']
