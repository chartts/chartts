/**
 * FlowGL particle vertex shader — position + age → fading trail.
 */

export const PARTICLE_VERT = /* glsl */ `
precision highp float;

attribute vec2 a_position;
attribute float a_age;
attribute vec3 a_color;

uniform vec2 u_resolution;
uniform float u_pointSize;
uniform float u_pixelRatio;

varying vec3 v_color;
varying float v_age;

void main() {
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = u_pointSize * u_pixelRatio;
  v_color = a_color;
  v_age = a_age;
}
`

export const PARTICLE_VERT_UNIFORMS = ['u_resolution', 'u_pointSize', 'u_pixelRatio']

export const PARTICLE_VERT_ATTRIBUTES = ['a_position', 'a_age', 'a_color']
