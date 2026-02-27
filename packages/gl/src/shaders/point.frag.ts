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

  // Solid core with soft edge
  float coreAlpha = 1.0 - smoothstep(0.3, 0.42, dist);
  // Outer glow halo
  float glowAlpha = (1.0 - smoothstep(0.2, 0.5, dist)) * 0.4;
  float alpha = max(coreAlpha, glowAlpha);

  // Brighten center for a glossy look
  vec3 color = v_color + vec3(0.15) * (1.0 - smoothstep(0.0, 0.2, dist));

  gl_FragColor = vec4(color, alpha * u_opacity);
}
`

export const POINT_FRAG_UNIFORMS = ['u_opacity']
