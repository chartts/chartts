/**
 * Particle fragment shader with trail fade based on age.
 */

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;

varying vec3 v_color;
varying float v_age;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float edgeAlpha = 1.0 - smoothstep(0.4, 0.5, dist);
  float ageAlpha = 1.0 - v_age;
  gl_FragColor = vec4(v_color, edgeAlpha * ageAlpha);
}
`

export const PARTICLE_FRAG_UNIFORMS = [] as string[]
