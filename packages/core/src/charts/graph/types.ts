/** Node shape types */
export type NodeShape = 'rect' | 'circle' | 'diamond' | 'hexagon' | 'stadium'

/** Layout algorithm */
export type GraphLayout = 'force' | 'hierarchical' | 'circular'

/** Direction for hierarchical layout */
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'

/** Rich graph options (passed through ctx.options) */
export interface GraphOptions {
  /** Rich node definitions */
  nodes?: Array<{
    id: string
    label?: string
    shape?: NodeShape
    color?: string
    pin?: { x: number; y: number }
  }>
  /** Rich edge definitions */
  edges?: Array<{
    source: string
    target: string
    label?: string
    style?: 'solid' | 'dashed' | 'dotted'
    color?: string
    weight?: number
  }>
  /** Layout algorithm. Default: 'force' */
  layout?: GraphLayout
  /** Direction for hierarchical layout. Default: 'TB' */
  direction?: LayoutDirection
  /** Default node shape. Default: 'rect' */
  nodeShape?: NodeShape
  /** Edge curve style. Default: 'curved' */
  edgeStyle?: 'straight' | 'curved'
  /** Show arrowheads on edges. Default: true */
  arrows?: boolean
  /** Force layout iteration count. Default: 120 */
  iterations?: number
  /** Enable drag-to-pin interactivity. Default: false */
  draggable?: boolean
}

/** Internal node representation after parsing */
export interface GraphNode {
  id: string
  label: string
  index: number
  value: number
  shape: NodeShape
  color: string | null
  pin: { x: number; y: number } | null
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
}

/** Internal edge representation */
export interface GraphEdge {
  source: number
  target: number
  weight: number
  label: string | null
  style: 'solid' | 'dashed' | 'dotted'
  color: string | null
}
