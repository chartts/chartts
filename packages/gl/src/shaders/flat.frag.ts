/**
 * Flat color fragment shader for 2D GL charts.
 */

export const FLAT_FRAG = /* glsl */ `
precision highp float;

uniform float u_opacity;

varying vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, u_opacity);
}
`

export const FLAT_FRAG_UNIFORMS = ['u_opacity']
