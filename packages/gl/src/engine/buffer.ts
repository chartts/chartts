/**
 * WebGL buffer helpers — VBO, IBO, and vertex layout management.
 */

export interface GLBuffer {
  buffer: WebGLBuffer
  count: number
  bind(): void
  update(data: Float32Array | Uint16Array | Uint32Array, usage?: number): void
  destroy(): void
}

export function createVertexBuffer(
  gl: WebGLRenderingContext,
  data: Float32Array,
  usage: number = gl.STATIC_DRAW,
): GLBuffer {
  const buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, usage)
  return {
    buffer,
    count: data.length,
    bind() { gl.bindBuffer(gl.ARRAY_BUFFER, buffer) },
    update(newData, u = usage) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, newData, u)
      this.count = newData.length
    },
    destroy() { gl.deleteBuffer(buffer) },
  }
}

export function createIndexBuffer(
  gl: WebGLRenderingContext,
  data: Uint16Array | Uint32Array,
  usage: number = gl.STATIC_DRAW,
): GLBuffer {
  const buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, usage)
  return {
    buffer,
    count: data.length,
    bind() { gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer) },
    update(newData, u = usage) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, newData, u)
      this.count = newData.length
    },
    destroy() { gl.deleteBuffer(buffer) },
  }
}

export interface VertexAttribute {
  location: number
  size: number
  offset: number
}

export interface VertexLayout {
  stride: number
  attributes: VertexAttribute[]
}

export function createVertexLayout(
  attribs: Array<{ location: number; size: number }>,
): VertexLayout {
  let offset = 0
  const attributes: VertexAttribute[] = []
  for (const a of attribs) {
    attributes.push({ location: a.location, size: a.size, offset: offset * 4 })
    offset += a.size
  }
  return { stride: offset * 4, attributes }
}

export function applyVertexLayout(gl: WebGLRenderingContext, layout: VertexLayout): void {
  for (const attr of layout.attributes) {
    gl.enableVertexAttribArray(attr.location)
    gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, layout.stride, attr.offset)
  }
}

export function disableVertexLayout(gl: WebGLRenderingContext, layout: VertexLayout): void {
  for (const attr of layout.attributes) {
    gl.disableVertexAttribArray(attr.location)
  }
}
