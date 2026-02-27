/**
 * Chart state machine — manages loading/error/empty overlays.
 * Extracted from createChart to keep the orchestrator lean.
 */

export type ChartState = 'ready' | 'loading' | 'error' | 'empty'

export interface StateManager {
  readonly state: ChartState
  readonly message: string | undefined
  setLoading(loading?: boolean): void
  setError(message?: string): void
  setEmpty(message?: string): void
  reset(): void
}

export function createStateManager(onRender: () => void): StateManager {
  let state: ChartState = 'ready'
  let message: string | undefined

  return {
    get state() { return state },
    get message() { return message },

    setLoading(loading = true) {
      state = loading ? 'loading' : 'ready'
      message = undefined
      onRender()
    },

    setError(msg?: string) {
      state = 'error'
      message = msg
      onRender()
    },

    setEmpty(msg?: string) {
      state = 'empty'
      message = msg
      onRender()
    },

    reset() {
      state = 'ready'
      message = undefined
    },
  }
}
