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
  vec3 R = reflect(-L, N);

  vec3 ambient = u_ambientColor * baseColor;
  float diff = max(dot(N, L), 0.0);
  vec3 diffuse = u_diffuseColor * diff * baseColor;
  float spec = pow(max(dot(V, R), 0.0), u_shininess);
  vec3 specular = u_specularColor * spec;

  return ambient + diffuse + specular;
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
