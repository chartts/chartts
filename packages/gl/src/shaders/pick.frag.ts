/**
 * Pick pass fragment shader — outputs the pick color as-is.
 */

export const PICK_FRAG = /* glsl */ `
precision highp float;

varying vec3 v_pickColor;

void main() {
  gl_FragColor = vec4(v_pickColor, 1.0);
}
`

export const PICK_FRAG_UNIFORMS = [] as string[]
