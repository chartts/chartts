/**
 * Line fragment shader with optional dash pattern.
 */

export const LINE_FRAG = /* glsl */ `
precision highp float;

uniform float u_opacity;

varying vec3 v_color;
varying float v_side;

void main() {
  float alpha = 1.0 - smoothstep(0.9, 1.0, abs(v_side));
  gl_FragColor = vec4(v_color, alpha * u_opacity);
}
`

export const LINE_FRAG_UNIFORMS = ['u_opacity']
