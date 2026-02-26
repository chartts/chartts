import type { ChartEvents, EventHandler, Unsubscribe, EventBus } from '../types'

export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventHandler<unknown>>>()

  return {
    on<K extends keyof ChartEvents>(
      event: K,
      handler: EventHandler<ChartEvents[K]>,
    ): Unsubscribe {
      let set = listeners.get(event as string)
      if (!set) {
        set = new Set()
        listeners.set(event as string, set)
      }
      set.add(handler as EventHandler<unknown>)
      return () => {
        set.delete(handler as EventHandler<unknown>)
        if (set.size === 0) listeners.delete(event as string)
      }
    },

    emit<K extends keyof ChartEvents>(event: K, payload: ChartEvents[K]): void {
      const set = listeners.get(event as string)
      if (set) for (const h of set) h(payload)
    },

    off<K extends keyof ChartEvents>(
      event: K,
      handler: EventHandler<ChartEvents[K]>,
    ): void {
      const set = listeners.get(event as string)
      if (!set) return
      set.delete(handler as EventHandler<unknown>)
      if (set.size === 0) listeners.delete(event as string)
    },

    destroy(): void {
      listeners.clear()
    },
  }
}
