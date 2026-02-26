/**
 * @chartts/gl — 3D & GL-accelerated chart types.
 *
 * Zero Three.js dependency. Pure WebGL with custom engine.
 */

// Engine
export { vec3, mat4, mat4Perspective, mat4LookAt, mat4Multiply, mat4Invert, mat4Identity, toRad } from './engine/math'
export type { Vec3, Mat4 } from './engine/math'
export { createCamera, updateCamera, projectToScreen } from './engine/camera'
export type { CameraState, CameraOptions } from './engine/camera'
export { createOrbitControls, updateOrbitControls } from './engine/orbit-controls'
export type { OrbitConfig, OrbitState } from './engine/orbit-controls'
export { createGLRenderer } from './engine/renderer'
export type { GLRenderer } from './engine/renderer'
export { defaultLightConfig, setLightUniforms } from './engine/lighting'
export type { LightConfig } from './engine/lighting'
export { createPickingSystem } from './engine/picking'
export type { PickingSystem } from './engine/picking'
export { createShaderProgram, compileShader } from './engine/shader'
export type { ShaderProgram } from './engine/shader'
export { createVertexBuffer, createIndexBuffer, createVertexLayout, applyVertexLayout } from './engine/buffer'
export type { GLBuffer, VertexLayout, VertexAttribute } from './engine/buffer'
export { createGrid3D } from './engine/grid3d'
export type { Grid3D, GridBounds } from './engine/grid3d'

// Types
export type {
  GLChartData, GLChartOptions, GLChartInstance, GLChartTypePlugin,
  GLRenderContext, GLDataPoint, GLSeries3D, GLSeries2D, GLTheme,
} from './types'
export { hexToRGB, resolveTheme, DEFAULT_GL_THEME, LIGHT_GL_THEME } from './types'

// API
export { createGLChart } from './api/create-gl'

// Convenience factories
export {
  Scatter3D, Bar3D, Surface3D, Globe3D, Map3D,
  Lines3D, Line3D, ScatterGL, LinesGL, FlowGL, GraphGL,
} from './api/factory'

// Chart type plugins
export { createScatter3DPlugin } from './charts/scatter3d/scatter3d-type'
export { createBar3DPlugin } from './charts/bar3d/bar3d-type'
export { createSurface3DPlugin } from './charts/surface3d/surface3d-type'
export { createGlobe3DPlugin } from './charts/globe3d/globe3d-type'
export { createMap3DPlugin } from './charts/map3d/map3d-type'
export { createLines3DPlugin } from './charts/lines3d/lines3d-type'
export { createLine3DPlugin } from './charts/line3d/line3d-type'
export { createScatterGLPlugin } from './charts/scatter-gl/scatter-gl-type'
export { createLinesGLPlugin } from './charts/lines-gl/lines-gl-type'
export { createFlowGLPlugin } from './charts/flow-gl/flow-gl-type'
export { createGraphGLPlugin } from './charts/graph-gl/graph-gl-type'
