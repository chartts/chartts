/**
 * ResizeObserver wrapper for auto-resizing charts to fit their container.
 */
export function observeResize(
  element: HTMLElement,
  callback: (width: number, height: number) => void,
): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { width, height } = entry.contentRect
    if (width > 0 && height > 0) {
      callback(Math.floor(width), Math.floor(height))
    }
  })

  observer.observe(element)
  return () => observer.disconnect()
}
