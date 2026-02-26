/**
 * WebGL shader compilation and program management.
 */

export interface ShaderProgram {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation>
  attributes: Record<string, number>
  use(): void
  setMat4(name: string, value: Float32Array): void
  setMat3(name: string, value: Float32Array): void
  setVec2(name: string, x: number, y: number): void
  setVec3(name: string, x: number, y: number, z: number): void
  setVec4(name: string, x: number, y: number, z: number, w: number): void
  setFloat(name: string, value: number): void
  setInt(name: string, value: number): void
  destroy(): void
}

export function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`[chartts/gl] Shader compile error: ${info}`)
  }
  return shader
}

export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string,
  uniformNames: string[],
  attributeNames: string[],
): ShaderProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`[chartts/gl] Program link error: ${info}`)
  }

  // Cache locations
  const uniforms: Record<string, WebGLUniformLocation> = {}
  for (const name of uniformNames) {
    const loc = gl.getUniformLocation(program, name)
    if (loc) uniforms[name] = loc
  }

  const attributes: Record<string, number> = {}
  for (const name of attributeNames) {
    attributes[name] = gl.getAttribLocation(program, name)
  }

  return {
    program,
    uniforms,
    attributes,
    use() { gl.useProgram(program) },
    setMat4(name, value) { const loc = uniforms[name]; if (loc) gl.uniformMatrix4fv(loc, false, value) },
    setMat3(name, value) { const loc = uniforms[name]; if (loc) gl.uniformMatrix3fv(loc, false, value) },
    setVec2(name, x, y) { const loc = uniforms[name]; if (loc) gl.uniform2f(loc, x, y) },
    setVec3(name, x, y, z) { const loc = uniforms[name]; if (loc) gl.uniform3f(loc, x, y, z) },
    setVec4(name, x, y, z, w) { const loc = uniforms[name]; if (loc) gl.uniform4f(loc, x, y, z, w) },
    setFloat(name, value) { const loc = uniforms[name]; if (loc) gl.uniform1f(loc, value) },
    setInt(name, value) { const loc = uniforms[name]; if (loc) gl.uniform1i(loc, value) },
    destroy() {
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteProgram(program)
    },
  }
}
