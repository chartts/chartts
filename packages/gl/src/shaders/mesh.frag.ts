/**
 * Phong fragment shader for 3D meshes.
 */

import { PHONG_UNIFORMS, PHONG_FUNCTION } from './common.glsl'

export const MESH_FRAG = /* glsl */ `
precision highp float;

${PHONG_UNIFORMS}

uniform float u_opacity;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec3 v_color;

${PHONG_FUNCTION}

void main() {
  vec3 lit = phongLighting(v_normal, v_fragPos, v_color);
  gl_FragColor = vec4(lit, u_opacity);
}
`

export const MESH_FRAG_UNIFORMS = [
  'u_ambientColor', 'u_lightDir', 'u_diffuseColor',
  'u_specularColor', 'u_shininess', 'u_cameraPos', 'u_opacity',
]
