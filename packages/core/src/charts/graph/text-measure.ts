import type { NodeShape } from './types'

const CHAR_WIDTH_RATIO = 0.6
const PADDING_H = 16
const PADDING_V = 10

/**
 * Heuristic text measurement (no DOM access).
 * Returns the bounding box needed for the node shape to contain the label.
 */
export function measureNodeSize(
  label: string,
  fontSize: number,
  shape: NodeShape,
): { width: number; height: number } {
  const charWidth = fontSize * CHAR_WIDTH_RATIO
  const textWidth = label.length * charWidth
  const textHeight = fontSize * 1.2

  let w = textWidth + PADDING_H * 2
  let h = textHeight + PADDING_V * 2

  // Enforce minimums
  w = Math.max(w, 40)
  h = Math.max(h, 28)

  switch (shape) {
    case 'circle': {
      // Circle must contain the text bbox
      const d = Math.sqrt(w * w + h * h)
      return { width: d, height: d }
    }
    case 'diamond': {
      // Diamond needs ~1.4x bbox dimensions
      return { width: w * 1.45, height: h * 1.45 }
    }
    case 'hexagon': {
      // Hexagon needs slightly wider to contain text
      return { width: w * 1.25, height: h * 1.15 }
    }
    case 'stadium':
    case 'rect':
    default:
      return { width: w, height: h }
  }
}
