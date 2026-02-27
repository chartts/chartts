/**
 * Phong lighting model — directional light with ambient, diffuse, specular.
 */

import type { ShaderProgram } from './shader'
import type { Vec3 } from './math'

export interface LightConfig {
  ambient: [number, number, number]
  diffuseDirection: [number, number, number]
  diffuseColor: [number, number, number]
  specularColor: [number, number, number]
  shininess: number
}

export function defaultLightConfig(): LightConfig {
  return {
    ambient: [0.35, 0.33, 0.4],
    diffuseDirection: [0.6, 0.9, 0.4],
    diffuseColor: [1.0, 0.97, 0.95],
    specularColor: [1.0, 0.98, 0.96],
    shininess: 48,
  }
}

export function setLightUniforms(program: ShaderProgram, light: LightConfig, cameraPos: Vec3): void {
  program.setVec3('u_ambientColor', light.ambient[0], light.ambient[1], light.ambient[2])
  // Normalize direction
  const [dx, dy, dz] = light.diffuseDirection
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
  program.setVec3('u_lightDir', dx / len, dy / len, dz / len)
  program.setVec3('u_diffuseColor', light.diffuseColor[0], light.diffuseColor[1], light.diffuseColor[2])
  program.setVec3('u_specularColor', light.specularColor[0], light.specularColor[1], light.specularColor[2])
  program.setFloat('u_shininess', light.shininess)
  program.setVec3('u_cameraPos', cameraPos[0]!, cameraPos[1]!, cameraPos[2]!)
}

/** Uniform names needed for Phong lighting */
export const LIGHT_UNIFORMS = [
  'u_ambientColor', 'u_lightDir', 'u_diffuseColor',
  'u_specularColor', 'u_shininess', 'u_cameraPos',
]
