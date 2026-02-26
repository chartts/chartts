import { describe, it, expect, vi } from 'vitest'
import { createEventBus } from '../bus'

describe('EventBus', () => {
  it('emits and receives events', () => {
    const bus = createEventBus()
    const handler = vi.fn()
    bus.on('resize', handler)
    bus.emit('resize', { width: 100, height: 200 })
    expect(handler).toHaveBeenCalledWith({ width: 100, height: 200 })
  })

  it('supports multiple handlers', () => {
    const bus = createEventBus()
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on('resize', h1)
    bus.on('resize', h2)
    bus.emit('resize', { width: 100, height: 200 })
    expect(h1).toHaveBeenCalledOnce()
    expect(h2).toHaveBeenCalledOnce()
  })

  it('unsubscribes via returned function', () => {
    const bus = createEventBus()
    const handler = vi.fn()
    const unsub = bus.on('resize', handler)
    unsub()
    bus.emit('resize', { width: 100, height: 200 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('off removes handler', () => {
    const bus = createEventBus()
    const handler = vi.fn()
    bus.on('resize', handler)
    bus.off('resize', handler)
    bus.emit('resize', { width: 100, height: 200 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('destroy clears all handlers', () => {
    const bus = createEventBus()
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on('resize', h1)
    bus.on('destroy', h2)
    bus.destroy()
    bus.emit('resize', { width: 100, height: 200 })
    bus.emit('destroy', undefined as never)
    expect(h1).not.toHaveBeenCalled()
    expect(h2).not.toHaveBeenCalled()
  })

  it('does not throw when emitting with no handlers', () => {
    const bus = createEventBus()
    expect(() => bus.emit('resize', { width: 100, height: 200 })).not.toThrow()
  })

  it('does not throw when removing non-existent handler', () => {
    const bus = createEventBus()
    expect(() => bus.off('resize', vi.fn())).not.toThrow()
  })
})
