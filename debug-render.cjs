/**
 * Headless chart rendering debug tool.
 * Renders charts in jsdom and dumps SVG + analysis for layout debugging.
 */
const { JSDOM } = require('jsdom')

// Set up jsdom before importing the library
const dom = new JSDOM(
  '<!DOCTYPE html><html><body></body></html>',
  { pretendToBeVisual: true }
)
global.document = dom.window.document
global.window = dom.window
global.SVGElement = dom.window.SVGElement
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element
global.Image = dom.window.Image
global.navigator = dom.window.navigator
global.ResizeObserver = class {
  observe() {}
  disconnect() {}
}
global.matchMedia = () => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
})

const { Line, Bar } = require('./packages/core/dist/index.cjs')

const WIDTH = 600
const HEIGHT = 350

function createContainer(id) {
  const el = document.createElement('div')
  el.id = id
  el.style.width = WIDTH + 'px'
  el.style.height = HEIGHT + 'px'
  // jsdom doesn't compute clientWidth/clientHeight, so we need to set explicit dimensions
  Object.defineProperty(el, 'clientWidth', { value: WIDTH })
  Object.defineProperty(el, 'clientHeight', { value: HEIGHT })
  document.body.appendChild(el)
  return el
}

function analyzeSVG(svg, label) {
  console.log('\n' + '='.repeat(70))
  console.log(`  ${label}`)
  console.log('='.repeat(70))

  // ViewBox
  const viewBox = svg.getAttribute('viewBox')
  console.log(`\nViewBox: ${viewBox}`)

  // Count elements by type
  const types = {}
  svg.querySelectorAll('*').forEach(el => {
    const tag = el.tagName
    types[tag] = (types[tag] || 0) + 1
  })
  console.log('Element counts:', JSON.stringify(types, null, 2))

  // Analyze groups
  const groups = svg.querySelectorAll('g')
  console.log(`\nGroups (${groups.length}):`)
  groups.forEach(g => {
    const cls = g.getAttribute('class') || '(no class)'
    const children = g.children.length
    console.log(`  ${cls} — ${children} children`)
  })

  // Check axis positions
  const xAxisLine = svg.querySelector('.chartts-x-axis')
  const yAxisLine = svg.querySelector('.chartts-y-axis')
  if (xAxisLine) {
    console.log(`\nX-axis line: y1=${xAxisLine.getAttribute('y1')}, x1=${xAxisLine.getAttribute('x1')}, x2=${xAxisLine.getAttribute('x2')}`)
  }
  if (yAxisLine) {
    console.log(`Y-axis line: x1=${yAxisLine.getAttribute('x1')}, y1=${yAxisLine.getAttribute('y1')}, y2=${yAxisLine.getAttribute('y2')}`)
  }

  // X-axis labels
  const xLabels = svg.querySelectorAll('.chartts-x-label')
  if (xLabels.length > 0) {
    console.log(`\nX-axis labels (${xLabels.length}):`)
    xLabels.forEach(l => {
      console.log(`  "${l.textContent}" at x=${l.getAttribute('x')}, y=${l.getAttribute('y')}`)
    })
  }

  // Y-axis labels
  const yLabels = svg.querySelectorAll('.chartts-y-label')
  if (yLabels.length > 0) {
    console.log(`\nY-axis labels (${yLabels.length}):`)
    yLabels.forEach(l => {
      console.log(`  "${l.textContent}" at x=${l.getAttribute('x')}, y=${l.getAttribute('y')}`)
    })
  }

  // Grid lines
  const hGrid = svg.querySelectorAll('.chartts-grid-h')
  const vGrid = svg.querySelectorAll('.chartts-grid-v')
  console.log(`\nGrid: ${hGrid.length} horizontal, ${vGrid.length} vertical`)

  // Data paths
  const paths = svg.querySelectorAll('.chartts-line')
  if (paths.length > 0) {
    console.log(`\nLine paths (${paths.length}):`)
    paths.forEach((p, i) => {
      const d = p.getAttribute('d')
      console.log(`  Series ${i}: color=${p.getAttribute('stroke')}, d="${d?.substring(0, 80)}..."`)
    })
  }

  // Data points
  const points = svg.querySelectorAll('.chartts-point')
  if (points.length > 0) {
    console.log(`\nData points (${points.length}):`)
    const first = points[0]
    const last = points[points.length - 1]
    console.log(`  First: cx=${first.getAttribute('cx')}, cy=${first.getAttribute('cy')}, r=${first.getAttribute('r')}`)
    console.log(`  Last:  cx=${last.getAttribute('cx')}, cy=${last.getAttribute('cy')}, r=${last.getAttribute('r')}`)
  }

  // Bars
  const bars = svg.querySelectorAll('.chartts-bar')
  if (bars.length > 0) {
    console.log(`\nBars (${bars.length}):`)
    bars.forEach((b, i) => {
      console.log(`  Bar ${i}: x=${b.getAttribute('x')}, y=${b.getAttribute('y')}, w=${b.getAttribute('width')}, h=${b.getAttribute('height')}`)
    })
  }

  // Legend
  const legendDots = svg.querySelectorAll('.chartts-legend-dot')
  const legendTexts = svg.querySelectorAll('.chartts-legend-text')
  if (legendDots.length > 0) {
    console.log(`\nLegend items (${legendDots.length}):`)
    legendTexts.forEach((t, i) => {
      const dot = legendDots[i]
      console.log(`  "${t.textContent}" dot at cx=${dot?.getAttribute('cx')},cy=${dot?.getAttribute('cy')} text at x=${t.getAttribute('x')},y=${t.getAttribute('y')}`)
    })
  }

  // Chart area analysis
  console.log('\n--- Layout Analysis ---')
  const vb = viewBox?.split(' ').map(Number) || [0, 0, WIDTH, HEIGHT]
  const totalArea = vb[2] * vb[3]

  // Find chart content bounding box from paths/points/bars
  let contentMinX = Infinity, contentMaxX = -Infinity
  let contentMinY = Infinity, contentMaxY = -Infinity

  points.forEach(p => {
    const cx = parseFloat(p.getAttribute('cx'))
    const cy = parseFloat(p.getAttribute('cy'))
    if (cx < contentMinX) contentMinX = cx
    if (cx > contentMaxX) contentMaxX = cx
    if (cy < contentMinY) contentMinY = cy
    if (cy > contentMaxY) contentMaxY = cy
  })

  bars.forEach(b => {
    const bx = parseFloat(b.getAttribute('x'))
    const by = parseFloat(b.getAttribute('y'))
    const bw = parseFloat(b.getAttribute('width'))
    const bh = parseFloat(b.getAttribute('height'))
    if (bx < contentMinX) contentMinX = bx
    if (bx + bw > contentMaxX) contentMaxX = bx + bw
    if (by < contentMinY) contentMinY = by
    if (by + bh > contentMaxY) contentMaxY = by + bh
  })

  if (contentMinX !== Infinity) {
    const contentWidth = contentMaxX - contentMinX
    const contentHeight = contentMaxY - contentMinY
    const usage = (contentWidth * contentHeight) / totalArea * 100
    console.log(`Content bounds: x=[${contentMinX.toFixed(1)}, ${contentMaxX.toFixed(1)}] y=[${contentMinY.toFixed(1)}, ${contentMaxY.toFixed(1)}]`)
    console.log(`Content size: ${contentWidth.toFixed(1)} x ${contentHeight.toFixed(1)}`)
    console.log(`ViewBox size: ${vb[2]} x ${vb[3]}`)
    console.log(`Area utilization: ${usage.toFixed(1)}%`)

    // Margin analysis
    console.log(`Margins: top=${contentMinY.toFixed(1)}, right=${(vb[2] - contentMaxX).toFixed(1)}, bottom=${(vb[3] - contentMaxY).toFixed(1)}, left=${contentMinX.toFixed(1)}`)
  }

  // Output raw SVG (truncated)
  const svgStr = svg.outerHTML
  console.log(`\nRaw SVG size: ${svgStr.length} chars`)

  return svgStr
}

// ---- RENDER CHARTS ----

console.log('\n🔍 CHARTTS DEBUG RENDER ANALYSIS')
console.log(`Container: ${WIDTH}x${HEIGHT}`)

// 1. Line Chart - Multi Series
const lineEl = createContainer('line')
const lineChart = Line('#line', {
  theme: 'dark',
  curve: 'monotone',
  data: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    series: [
      { name: 'Revenue', values: [42, 58, 65, 78, 82, 90, 95, 105, 112, 98, 115, 128] },
      { name: 'Expenses', values: [38, 42, 50, 55, 60, 62, 68, 72, 78, 75, 80, 85] },
      { name: 'Profit', values: [4, 16, 15, 23, 22, 28, 27, 33, 34, 23, 35, 43] },
    ],
  },
  yFormat: (v) => `$${v}K`,
})
const lineSvg = lineEl.querySelector('svg')
const lineSvgStr = analyzeSVG(lineSvg, 'LINE CHART — Multi Series')

// 2. Bar Chart
const barEl = createContainer('bar')
const barChart = Bar('#bar', {
  theme: 'dark',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: '2024', values: [340, 420, 380, 510] },
      { name: '2025', values: [390, 480, 450, 580] },
      { name: '2026', values: [420, 520, 490, 640] },
    ],
  },
  barRadius: 4,
})
const barSvg = barEl.querySelector('svg')
const barSvgStr = analyzeSVG(barSvg, 'BAR CHART — Grouped')

// 3. Area Chart
const areaEl = createContainer('area')
const areaChart = Line('#area', {
  theme: 'dark',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [
      { name: 'Visitors', values: [1200, 1800, 2400, 2100, 3200, 2800, 3500], fill: true, fillOpacity: 0.12 },
      { name: 'Signups', values: [120, 180, 340, 280, 450, 380, 520], fill: true, fillOpacity: 0.12 },
    ],
  },
})
const areaSvg = areaEl.querySelector('svg')
const areaSvgStr = analyzeSVG(areaSvg, 'AREA CHART — Filled')

// 4. Single Series (no legend)
const singleEl = createContainer('single')
const singleChart = Line('#single', {
  theme: 'dark',
  data: {
    labels: ['A', 'B', 'C', 'D', 'E'],
    series: [
      { name: 'Values', values: [10, 25, 15, 30, 20] },
    ],
  },
})
const singleSvg = singleEl.querySelector('svg')
analyzeSVG(singleSvg, 'SINGLE SERIES LINE (no legend)')

// Write SVGs to files for visual inspection
const fs = require('fs')
const path = require('path')
const outDir = path.join(__dirname, 'debug-output')
fs.mkdirSync(outDir, { recursive: true })

function wrapSvg(svgStr, title) {
  return `<!DOCTYPE html>
<html><head>
<title>${title}</title>
<style>
body { background: #0a0a0a; display: flex; flex-direction: column; align-items: center; padding: 40px; font-family: sans-serif; color: #fff; }
.chart-frame { background: #111113; border: 1px solid #1e1e22; border-radius: 12px; padding: 20px; margin: 20px; width: ${WIDTH}px; }
h2 { margin: 0 0 12px; font-size: 14px; color: #9ca3af; }
svg { display: block; width: 100%; height: ${HEIGHT}px; }
</style>
</head><body>
<h1>Chartts Debug Render</h1>
<div class="chart-frame"><h2>${title}</h2>${svgStr}</div>
</body></html>`
}

fs.writeFileSync(path.join(outDir, 'line.html'), wrapSvg(lineSvgStr, 'Line Chart'))
fs.writeFileSync(path.join(outDir, 'bar.html'), wrapSvg(barSvgStr, 'Bar Chart'))
fs.writeFileSync(path.join(outDir, 'area.html'), wrapSvg(areaSvgStr, 'Area Chart'))
fs.writeFileSync(path.join(outDir, 'all.html'), `<!DOCTYPE html>
<html><head>
<title>All Charts Debug</title>
<style>
body { background: #0a0a0a; display: flex; flex-direction: column; align-items: center; padding: 40px; font-family: sans-serif; color: #fff; gap: 24px; }
.chart-frame { background: #111113; border: 1px solid #1e1e22; border-radius: 12px; padding: 20px; width: ${WIDTH}px; }
h2 { margin: 0 0 12px; font-size: 14px; color: #9ca3af; }
svg { display: block; width: 100%; height: ${HEIGHT}px; }
</style>
</head><body>
<h1>Chartts Debug Render — All Charts</h1>
<div class="chart-frame"><h2>Line Chart — Multi Series</h2>${lineSvgStr}</div>
<div class="chart-frame"><h2>Bar Chart — Grouped</h2>${barSvgStr}</div>
<div class="chart-frame"><h2>Area Chart — Filled</h2>${areaSvgStr}</div>
</body></html>`)

console.log('\n\n📁 Debug HTML files written to: lib/debug-output/')
console.log('   Open lib/debug-output/all.html in a browser to inspect')

// Cleanup
lineChart.destroy()
barChart.destroy()
areaChart.destroy()
singleChart.destroy()
