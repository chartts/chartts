/**
 * SDF circle fragment shader with anti-aliased edge for GL_POINTS.
 */

export const POINT_FRAG = /* glsl */ `
precision highp float;

uniform float u_opacity;

varying vec3 v_color;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
  gl_FragColor = vec4(v_color, alpha * u_opacity);
}
`

export const POINT_FRAG_UNIFORMS = ['u_opacity']
