/**
 * Shared GLSL snippets — projection uniforms, Phong lighting function, fog.
 */

export const PROJECTION_UNIFORMS = /* glsl */ `
uniform mat4 u_projView;
uniform mat4 u_model;
`

export const NORMAL_UNIFORMS = /* glsl */ `
uniform mat3 u_normalMatrix;
`

export const PHONG_UNIFORMS = /* glsl */ `
uniform vec3 u_ambientColor;
uniform vec3 u_lightDir;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform vec3 u_cameraPos;
`

export const PHONG_FUNCTION = /* glsl */ `
vec3 phongLighting(vec3 normal, vec3 fragPos, vec3 baseColor) {
  vec3 N = normalize(normal);
  vec3 L = normalize(u_lightDir);
  vec3 V = normalize(u_cameraPos - fragPos);
  vec3 H = normalize(L + V);

  // Hemisphere ambient - warm sky, cool ground
  float hemi = dot(N, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  vec3 skyAmbient = u_ambientColor * vec3(1.1, 1.05, 1.2);
  vec3 groundAmbient = u_ambientColor * vec3(0.6, 0.55, 0.7);
  vec3 ambient = mix(groundAmbient, skyAmbient, hemi) * baseColor;

  // Smooth wrapped diffuse for softer light falloff
  float NdotL = dot(N, L);
  float diff = max(NdotL * 0.5 + 0.5, 0.0);
  diff = diff * diff;
  vec3 diffuse = u_diffuseColor * diff * baseColor;

  // Fill light from below-side for depth
  vec3 fillDir = normalize(vec3(-0.4, -0.3, -0.6));
  float fillDiff = max(dot(N, fillDir) * 0.5 + 0.5, 0.0);
  vec3 fill = baseColor * fillDiff * 0.15;

  // Blinn-Phong specular with smooth falloff
  float spec = pow(max(dot(N, H), 0.0), u_shininess);
  vec3 specular = u_specularColor * spec * 0.7;

  // Rim/fresnel glow - bright edges like subsurface scatter
  float rim = 1.0 - max(dot(V, N), 0.0);
  rim = pow(rim, 3.0);
  vec3 rimColor = mix(baseColor, vec3(1.0), 0.5);
  vec3 rimLight = rimColor * rim * 0.35;

  vec3 result = ambient + diffuse + fill + specular + rimLight;

  // Slight saturation boost
  float lum = dot(result, vec3(0.299, 0.587, 0.114));
  result = mix(vec3(lum), result, 1.12);

  return clamp(result, 0.0, 1.0);
}
`

export const FOG_UNIFORMS = /* glsl */ `
uniform float u_fogNear;
uniform float u_fogFar;
uniform vec3 u_fogColor;
`

export const FOG_FUNCTION = /* glsl */ `
vec3 applyFog(vec3 color, float dist) {
  float fogFactor = clamp((u_fogFar - dist) / (u_fogFar - u_fogNear), 0.0, 1.0);
  return mix(u_fogColor, color, fogFactor);
}
`
