import type { StreamingInstance } from '@chartts/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamSourceOptions {
  /** How to extract values from incoming messages. */
  parse?: (message: unknown) => { values: number[]; label?: string | number | Date } | null
  /** Auto-reconnect on disconnect. Default: true */
  reconnect?: boolean
  /** Reconnect interval in ms. Default: 3000 */
  reconnectInterval?: number
  /** Max reconnect attempts. Default: 10 */
  maxReconnects?: number
}

export interface StreamSource {
  /** Connect this source to a StreamingInstance and start pushing data. */
  connect(stream: StreamingInstance): void
  /** Disconnect from the data source and stop pushing data. */
  disconnect(): void
  /** Whether the source is currently connected. */
  readonly connected: boolean
}

// ---------------------------------------------------------------------------
// Default parser
// ---------------------------------------------------------------------------

function defaultParse(message: unknown): { values: number[]; label?: string | number | Date } | null {
  let data: unknown = message

  // If it's a string, try JSON.parse
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // Try parsing as a plain number
      const n = Number(data)
      if (!isNaN(n)) return { values: [n] }
      return null
    }
  }

  if (typeof data !== 'object' || data === null) {
    if (typeof data === 'number') return { values: [data] }
    return null
  }

  const obj = data as Record<string, unknown>

  // { values: number[], label?: ... }
  if (Array.isArray(obj['values'])) {
    return {
      values: (obj['values'] as unknown[]).map(v => Number(v)),
      label: obj['label'] as string | number | Date | undefined,
    }
  }

  // { value: number, label?: ... }
  if (typeof obj['value'] === 'number') {
    return {
      values: [obj['value']],
      label: obj['label'] as string | number | Date | undefined,
    }
  }

  // Array of numbers
  if (Array.isArray(data)) {
    const nums = (data as unknown[]).map(v => Number(v))
    if (nums.every(n => !isNaN(n))) return { values: nums }
  }

  return null
}

// ---------------------------------------------------------------------------
// WebSocket stream source
// ---------------------------------------------------------------------------

/**
 * Create a WebSocket data source that pushes incoming messages to a StreamingInstance.
 *
 * @param url - WebSocket URL (ws:// or wss://)
 * @param options - Stream source options
 */
export function createWebSocketStream(
  url: string,
  options?: StreamSourceOptions,
): StreamSource {
  const parse = options?.parse ?? defaultParse
  const shouldReconnect = options?.reconnect ?? true
  const reconnectInterval = options?.reconnectInterval ?? 3000
  const maxReconnects = options?.maxReconnects ?? 10

  let ws: WebSocket | null = null
  let stream: StreamingInstance | null = null
  let reconnectCount = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false
  let isConnected = false

  function open(): void {
    ws = new WebSocket(url)

    ws.onopen = () => {
      reconnectCount = 0
      isConnected = true
    }

    ws.onmessage = (event: MessageEvent) => {
      if (!stream) return
      const parsed = parse(event.data)
      if (parsed) {
        stream.push(parsed.values, parsed.label)
      }
    }

    ws.onclose = () => {
      isConnected = false
      if (!intentionalClose && shouldReconnect && reconnectCount < maxReconnects) {
        reconnectCount++
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          open()
        }, reconnectInterval)
      }
    }

    ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  return {
    connect(s: StreamingInstance): void {
      stream = s
      intentionalClose = false
      reconnectCount = 0
      open()
    },

    disconnect(): void {
      intentionalClose = true
      stream = null
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (ws) {
        ws.onclose = null
        ws.onmessage = null
        ws.onerror = null
        ws.close()
        ws = null
      }
      isConnected = false
    },

    get connected(): boolean {
      return isConnected
    },
  }
}

// ---------------------------------------------------------------------------
// Server-Sent Events stream source
// ---------------------------------------------------------------------------

/**
 * Create an SSE (Server-Sent Events) data source that pushes events to a StreamingInstance.
 *
 * @param url - SSE endpoint URL
 * @param options - Stream source options plus optional eventName
 */
export function createSSEStream(
  url: string,
  options?: StreamSourceOptions & { eventName?: string },
): StreamSource {
  const parse = options?.parse ?? defaultParse
  const shouldReconnect = options?.reconnect ?? true
  const reconnectInterval = options?.reconnectInterval ?? 3000
  const maxReconnects = options?.maxReconnects ?? 10
  const eventName = options?.eventName

  let source: EventSource | null = null
  let stream: StreamingInstance | null = null
  let reconnectCount = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let intentionalClose = false
  let isConnected = false

  function handleMessage(event: MessageEvent): void {
    if (!stream) return
    let data: unknown = event.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        // keep as string
      }
    }
    const parsed = parse(data)
    if (parsed) {
      stream.push(parsed.values, parsed.label)
    }
  }

  function open(): void {
    source = new EventSource(url)

    source.onopen = () => {
      reconnectCount = 0
      isConnected = true
    }

    if (eventName) {
      source.addEventListener(eventName, handleMessage as EventListener)
    } else {
      source.onmessage = handleMessage
    }

    source.onerror = () => {
      isConnected = false
      if (source) {
        source.close()
        source = null
      }
      if (!intentionalClose && shouldReconnect && reconnectCount < maxReconnects) {
        reconnectCount++
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          open()
        }, reconnectInterval)
      }
    }
  }

  return {
    connect(s: StreamingInstance): void {
      stream = s
      intentionalClose = false
      reconnectCount = 0
      open()
    },

    disconnect(): void {
      intentionalClose = true
      stream = null
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (source) {
        if (eventName) {
          source.removeEventListener(eventName, handleMessage as EventListener)
        }
        source.onmessage = null
        source.onerror = null
        source.close()
        source = null
      }
      isConnected = false
    },

    get connected(): boolean {
      return isConnected
    },
  }
}

// ---------------------------------------------------------------------------
// HTTP polling stream source
// ---------------------------------------------------------------------------

/**
 * Create an HTTP polling data source that fetches data at regular intervals
 * and pushes it to a StreamingInstance.
 *
 * @param url - URL to fetch or a function returning a fetch Response
 * @param interval - Polling interval in milliseconds
 * @param options - Stream source options
 */
export function createPollingStream(
  url: string | (() => Promise<Response>),
  interval: number,
  options?: StreamSourceOptions,
): StreamSource {
  const parse = options?.parse ?? defaultParse

  let stream: StreamingInstance | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let isConnected = false

  async function poll(): Promise<void> {
    if (!stream) return

    try {
      const response = typeof url === 'function' ? await url() : await fetch(url)
      const contentType = response.headers.get('content-type') ?? ''
      let data: unknown

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      const parsed = parse(data)
      if (parsed && stream) {
        stream.push(parsed.values, parsed.label)
      }
    } catch {
      // Silently skip failed polls; next interval will retry
    }
  }

  return {
    connect(s: StreamingInstance): void {
      stream = s
      isConnected = true
      // Immediate first poll
      poll()
      timer = setInterval(poll, interval)
    },

    disconnect(): void {
      stream = null
      isConnected = false
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    },

    get connected(): boolean {
      return isConnected
    },
  }
}
