/**
 * 2D orthographic vertex shader for GL-accelerated 2D charts.
 */

export const FLAT_VERT = /* glsl */ `
precision highp float;

attribute vec2 a_position;
attribute vec3 a_color;
attribute float a_size;

uniform vec2 u_resolution;
uniform float u_pixelRatio;

varying vec3 v_color;

void main() {
  // Convert pixel coords to clip space
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y; // flip Y for screen coords
  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = a_size * u_pixelRatio;
  v_color = a_color;
}
`

export const FLAT_VERT_UNIFORMS = ['u_resolution', 'u_pixelRatio']

export const FLAT_VERT_ATTRIBUTES = ['a_position', 'a_color', 'a_size']
