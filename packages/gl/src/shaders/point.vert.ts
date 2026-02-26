/**
 * GL_POINTS vertex shader with size attenuation for 3D scatter.
 */

import { PROJECTION_UNIFORMS } from './common.glsl'

export const POINT_VERT = /* glsl */ `
precision highp float;

${PROJECTION_UNIFORMS}

attribute vec3 a_position;
attribute vec3 a_color;
attribute float a_size;

uniform float u_pixelRatio;
uniform float u_sizeAttenuation;

varying vec3 v_color;

void main() {
  vec4 worldPos = u_model * vec4(a_position, 1.0);
  vec4 mvPos = u_projView * worldPos;
  gl_Position = mvPos;

  float attenuation = u_sizeAttenuation > 0.0
    ? u_sizeAttenuation / max(mvPos.z, 0.1)
    : 1.0;
  gl_PointSize = a_size * u_pixelRatio * attenuation;
  v_color = a_color;
}
`

export const POINT_VERT_UNIFORMS = [
  'u_projView', 'u_model', 'u_pixelRatio', 'u_sizeAttenuation',
]

export const POINT_VERT_ATTRIBUTES = [
  'a_position', 'a_color', 'a_size',
]
