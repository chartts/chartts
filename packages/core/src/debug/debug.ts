import type { RenderNode, RenderContext } from '../types'

/**
 * Debug utilities for Chartts.
 * Attach to a chart to get render tree inspection, event logging, and an overlay panel.
 */
export interface DebugPanel {
  attach(container: HTMLElement, svg: SVGElement): void
  update(ctx: RenderContext, nodes: RenderNode[]): void
  destroy(): void
}

export function createDebugPanel(): DebugPanel {
  let panel: HTMLDivElement | null = null
  let treeEl: HTMLPreElement | null = null
  let statsEl: HTMLDivElement | null = null

  function attach(container: HTMLElement, svg: SVGElement): void {
    panel = document.createElement('div')
    panel.className = 'chartts-debug'
    panel.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 320px;
      max-height: 100%;
      overflow-y: auto;
      background: rgba(0,0,0,0.9);
      color: #e5e7eb;
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 11px;
      padding: 12px;
      border-left: 1px solid #333;
      z-index: 10000;
    `

    // Stats section
    statsEl = document.createElement('div')
    statsEl.style.cssText = 'margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #333;'
    panel.appendChild(statsEl)

    // Render tree section
    const treeLabel = document.createElement('div')
    treeLabel.textContent = 'RENDER TREE'
    treeLabel.style.cssText = 'color: #8b5cf6; font-weight: 700; margin-bottom: 8px; font-size: 10px; letter-spacing: 0.05em;'
    panel.appendChild(treeLabel)

    treeEl = document.createElement('pre')
    treeEl.style.cssText = 'margin: 0; white-space: pre-wrap; word-break: break-all; line-height: 1.4;'
    panel.appendChild(treeEl)

    container.style.position = 'relative'
    container.appendChild(panel)

    // Add SVG element outline on hover
    svg.addEventListener('mouseover', (e) => {
      const target = e.target as SVGElement
      if (target !== svg) {
        target.style.outline = '1px solid rgba(139, 92, 246, 0.5)'
      }
    })
    svg.addEventListener('mouseout', (e) => {
      const target = e.target as SVGElement
      target.style.outline = ''
    })
  }

  function update(ctx: RenderContext, nodes: RenderNode[]): void {
    if (!statsEl || !treeEl) return

    // Stats
    const nodeCount = countNodes(nodes)
    const { data, options, area } = ctx
    statsEl.innerHTML = `
      <div style="color:#8b5cf6;font-weight:700;font-size:10px;letter-spacing:0.05em;margin-bottom:8px;">CHART INFO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        <span style="color:#6b7280;">Series:</span><span>${data.series.length}</span>
        <span style="color:#6b7280;">Points:</span><span>${data.series[0]?.values.length ?? 0}</span>
        <span style="color:#6b7280;">SVG nodes:</span><span>${nodeCount}</span>
        <span style="color:#6b7280;">Area:</span><span>${Math.round(area.width)}x${Math.round(area.height)}</span>
        <span style="color:#6b7280;">Y range:</span><span>${data.bounds.yMin} — ${data.bounds.yMax}</span>
        <span style="color:#6b7280;">Theme:</span><span>${typeof options.theme === 'string' ? options.theme : 'custom'}</span>
        <span style="color:#6b7280;">Curve:</span><span>${options.curve}</span>
        <span style="color:#6b7280;">Animate:</span><span>${options.animate}</span>
      </div>
    `

    // Render tree
    treeEl.innerHTML = renderTreeToString(nodes, 0)
  }

  function destroy(): void {
    panel?.remove()
    panel = null
    treeEl = null
    statsEl = null
  }

  return { attach, update, destroy }
}

function countNodes(nodes: RenderNode[]): number {
  let count = 0
  for (const node of nodes) {
    count++
    if ('children' in node && Array.isArray(node.children)) {
      count += countNodes(node.children)
    }
  }
  return count
}

function renderTreeToString(nodes: RenderNode[], depth: number): string {
  const indent = '  '.repeat(depth)
  let result = ''

  for (const node of nodes) {
    const attrs = 'attrs' in node ? node.attrs : undefined
    const cls = attrs?.class ? ` <span style="color:#3b82f6">.${attrs.class}</span>` : ''
    const type = `<span style="color:#10b981">${node.type}</span>`

    if ('children' in node && Array.isArray(node.children)) {
      result += `${indent}${type}${cls} (${node.children.length})\n`
      result += renderTreeToString(node.children, depth + 1)
    } else if (node.type === 'text') {
      result += `${indent}${type}${cls} "${(node as { content: string }).content}"\n`
    } else if (node.type === 'path') {
      const d = (node as { d: string }).d
      result += `${indent}${type}${cls} d="${d.length > 40 ? d.slice(0, 40) + '...' : d}"\n`
    } else {
      result += `${indent}${type}${cls}\n`
    }
  }

  return result
}
