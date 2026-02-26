import type { RenderNode, RenderAttrs } from '../types'

/**
 * Rich Text — parse simple markup into multi-styled text elements.
 *
 * Supports a simple markup syntax:
 * - {b}bold{/b} or **bold**
 * - {i}italic{/i} or *italic*
 * - {color:red}colored{/color}
 * - {size:16}sized{/size}
 * - {style:name}custom{/style} — uses named styles
 *
 * Returns a RenderNode (text element with tspan children).
 */

export interface RichTextStyle {
  fontWeight?: number | string
  fontStyle?: string
  fill?: string
  fontSize?: number | string
  fontFamily?: string
  textDecoration?: string
}

export interface RichTextOptions {
  /** Default text attributes */
  defaults?: RichTextStyle
  /** Named styles for {style:name} syntax */
  styles?: Record<string, RichTextStyle>
  /** X position */
  x?: number
  /** Y position */
  y?: number
  /** Additional attributes for the parent text element */
  attrs?: RenderAttrs
}

interface TextSpan {
  text: string
  style: RichTextStyle
}

/**
 * Parse rich text markup and return a RenderNode with tspan children.
 */
export function parseRichText(
  input: string,
  options: RichTextOptions = {},
): RenderNode {
  const spans = parse(input, options.defaults ?? {}, options.styles ?? {})

  // Build tspan children
  const tspans: RenderNode[] = spans.map(span => ({
    type: 'tspan' as unknown as RenderNode['type'],
    attrs: {
      ...(span.style.fontWeight ? { fontWeight: span.style.fontWeight } : {}),
      ...(span.style.fontStyle ? { fontStyle: span.style.fontStyle } : {}),
      ...(span.style.fill ? { fill: span.style.fill } : {}),
      ...(span.style.fontSize ? { fontSize: span.style.fontSize } : {}),
      ...(span.style.fontFamily ? { fontFamily: span.style.fontFamily } : {}),
      ...(span.style.textDecoration ? { textDecoration: span.style.textDecoration } : {}),
    },
    children: [],
    text: span.text,
  } as unknown as RenderNode))

  return {
    type: 'text',
    x: options.x ?? 0,
    y: options.y ?? 0,
    text: '',
    attrs: {
      class: 'chartts-richtext',
      ...options.attrs,
    },
    children: tspans,
  } as unknown as RenderNode
}

/**
 * Format a value with rich text markup.
 * E.g., richLabel("Revenue", 1234, { valueColor: "#3b82f6" })
 * → "{b}Revenue{/b}: {color:#3b82f6}1,234{/color}"
 */
export function richLabel(
  label: string,
  value: number | string,
  opts?: { valueColor?: string; valueWeight?: string },
): string {
  const color = opts?.valueColor ?? '#3b82f6'
  const weight = opts?.valueWeight ?? ''
  const valueStr = typeof value === 'number' ? formatNum(value) : value
  const weightTag = weight ? `{b}${valueStr}{/b}` : valueStr
  return `{b}${label}{/b}: {color:${color}}${weightTag}{/color}`
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function parse(
  input: string,
  defaults: RichTextStyle,
  namedStyles: Record<string, RichTextStyle>,
): TextSpan[] {
  const spans: TextSpan[] = []
  const styleStack: RichTextStyle[] = [{ ...defaults }]

  // Pattern matches: {b}, {/b}, {i}, {/i}, {color:X}, {/color}, {size:X}, {/size}, {style:X}, {/style}, **X**, *X*
  const regex = /\{(b|\/b|i|\/i|color:([^}]+)|\/color|size:([^}]+)|\/size|style:([^}]+)|\/style)\}|\*\*(.+?)\*\*|\*(.+?)\*/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      spans.push({ text: input.slice(lastIndex, match.index), style: currentStyle(styleStack) })
    }

    const tag = match[1]
    const boldShorthand = match[5]
    const italicShorthand = match[6]

    if (boldShorthand) {
      spans.push({ text: boldShorthand, style: { ...currentStyle(styleStack), fontWeight: 700 } })
    } else if (italicShorthand) {
      spans.push({ text: italicShorthand, style: { ...currentStyle(styleStack), fontStyle: 'italic' } })
    } else if (tag === 'b') {
      styleStack.push({ ...currentStyle(styleStack), fontWeight: 700 })
    } else if (tag === '/b') {
      popStyle(styleStack)
    } else if (tag === 'i') {
      styleStack.push({ ...currentStyle(styleStack), fontStyle: 'italic' })
    } else if (tag === '/i') {
      popStyle(styleStack)
    } else if (tag?.startsWith('color:')) {
      styleStack.push({ ...currentStyle(styleStack), fill: match[2] })
    } else if (tag === '/color') {
      popStyle(styleStack)
    } else if (tag?.startsWith('size:')) {
      styleStack.push({ ...currentStyle(styleStack), fontSize: parseFloat(match[3]!) || 12 })
    } else if (tag === '/size') {
      popStyle(styleStack)
    } else if (tag?.startsWith('style:')) {
      const named = namedStyles[match[4]!]
      if (named) {
        styleStack.push({ ...currentStyle(styleStack), ...named })
      }
    } else if (tag === '/style') {
      popStyle(styleStack)
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < input.length) {
    spans.push({ text: input.slice(lastIndex), style: currentStyle(styleStack) })
  }

  return spans
}

function currentStyle(stack: RichTextStyle[]): RichTextStyle {
  return { ...stack[stack.length - 1]! }
}

function popStyle(stack: RichTextStyle[]): void {
  if (stack.length > 1) stack.pop()
}

function formatNum(n: number): string {
  return n.toLocaleString()
}
