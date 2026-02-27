import { parseGraphData } from './parse'
import { measureNodeSize } from './text-measure'
import { hierarchyLayout } from './layout-hierarchy'
import { circularLayout } from './layout-circular'
import { forceLayout } from './layout-force'
import type { GraphNode } from './types'

const data = { series: [], labels: [], bounds: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 } } as any
const area = { x: 28, y: 12, width: 452, height: 248 }

// --- Hierarchical test ---
const opts1 = {
  nodes: [
    { id: 'start', label: 'Start', shape: 'stadium', color: '#10b981' },
    { id: 'input', label: 'User Input', shape: 'rect' },
    { id: 'validate', label: 'Valid?', shape: 'diamond', color: '#f59e0b' },
    { id: 'process', label: 'Process Data', shape: 'rect' },
    { id: 'error', label: 'Error Handler', shape: 'hexagon', color: '#ef4444' },
    { id: 'output', label: 'Output Results', shape: 'rect' },
    { id: 'end', label: 'End', shape: 'stadium', color: '#10b981' },
  ],
  edges: [
    { source: 'start', target: 'input' },
    { source: 'input', target: 'validate' },
    { source: 'validate', target: 'process', label: 'yes' },
    { source: 'validate', target: 'error', label: 'no', style: 'dashed' },
    { source: 'process', target: 'output' },
    { source: 'error', target: 'output', style: 'dotted' },
    { source: 'output', target: 'end' },
  ],
  colors: ['#3b82f6'],
} as any

function measure(nodes: GraphNode[]) {
  for (const node of nodes) {
    const size = measureNodeSize(node.label, 10, node.shape)
    node.width = size.width
    node.height = size.height
  }
}

function printNodes(label: string, nodes: GraphNode[]) {
  console.log(`\n=== ${label} ===`)
  for (const n of nodes) {
    const top = n.y - n.height / 2
    const bot = n.y + n.height / 2
    console.log(
      n.label.padEnd(16),
      `x:${n.x.toFixed(0).padStart(4)} y:${n.y.toFixed(0).padStart(4)}`,
      `w:${n.width.toFixed(0).padStart(3)} h:${n.height.toFixed(0).padStart(3)}`,
      `| top:${top.toFixed(0).padStart(4)} bot:${bot.toFixed(0).padStart(4)}`,
    )
  }
  // Check for 2D bounding box overlaps
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!
      const b = nodes[j]!
      const overlapX = (a.width + b.width) / 2 - Math.abs(a.x - b.x)
      const overlapY = (a.height + b.height) / 2 - Math.abs(a.y - b.y)
      if (overlapX > 0 && overlapY > 0) {
        console.log(`  2D OVERLAP: ${a.label} <-> ${b.label} (overlapX=${overlapX.toFixed(0)}, overlapY=${overlapY.toFixed(0)})`)
      }
    }
  }
}

// Hierarchical
const r1 = parseGraphData(data, opts1)
measure(r1.graphNodes)
hierarchyLayout(r1.graphNodes, r1.graphEdges, { area, direction: 'TB' })
printNodes('Hierarchical TB', r1.graphNodes)

// Circular
const r2 = parseGraphData(data, opts1)
measure(r2.graphNodes)
circularLayout(r2.graphNodes, r2.graphEdges, { area })
printNodes('Circular', r2.graphNodes)

// Force
const r3 = parseGraphData(data, opts1)
measure(r3.graphNodes)
forceLayout(r3.graphNodes, r3.graphEdges, { area, iterations: 120 })
printNodes('Force', r3.graphNodes)
