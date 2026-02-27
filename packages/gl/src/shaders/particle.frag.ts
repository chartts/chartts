/**
 * Particle fragment shader — velocity-colored with glow, trail fade, and
 * direction-aware elongation via gl_PointCoord manipulation.
 */

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;

uniform vec3 u_colorSlow;    // color at speed=0
uniform vec3 u_colorMid;     // color at speed=0.5
uniform vec3 u_colorFast;    // color at speed=1
uniform float u_useSpeedColor; // 0=use vertex color, 1=use speed gradient

varying float v_age;
varying float v_speed;
varying vec2 v_velocity;

vec3 speedGradient(float t) {
  if (t < 0.5) {
    return mix(u_colorSlow, u_colorMid, t * 2.0);
  }
  return mix(u_colorMid, u_colorFast, (t - 0.5) * 2.0);
}

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);

  // Direction-aware elongation: stretch along velocity
  float speed = length(v_velocity);
  if (speed > 0.01) {
    vec2 dir = normalize(v_velocity);
    // Rotate coord into velocity-aligned frame
    float stretch = 1.0 + v_speed * 1.5;
    float cx = coord.x * dir.x + coord.y * dir.y;   // along velocity
    float cy = -coord.x * dir.y + coord.y * dir.x;  // perpendicular
    cx /= stretch;
    coord = vec2(cx, cy);
  }

  float dist = length(coord);
  if (dist > 0.5) discard;

  // Core + glow
  float core = 1.0 - smoothstep(0.15, 0.35, dist);
  float glow = (1.0 - smoothstep(0.1, 0.5, dist)) * 0.6;
  float alpha = max(core, glow);

  // Age fade: quadratic for longer visible tail
  float ageFade = 1.0 - v_age * v_age;
  alpha *= ageFade;

  // Color: speed gradient or fallback
  vec3 color = speedGradient(v_speed);

  // Brighten core of young fast particles
  float hotspot = core * (1.0 - v_age) * v_speed;
  color += vec3(0.3, 0.2, 0.1) * hotspot;

  gl_FragColor = vec4(color, alpha);
}
`

export const PARTICLE_FRAG_UNIFORMS = [
  'u_colorSlow', 'u_colorMid', 'u_colorFast', 'u_useSpeedColor',
]
