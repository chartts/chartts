import {
  Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline,
  Area, Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel,
  Heatmap, Boxplot, Histogram, Treemap, Polar,
  RadialBar, Lollipop, Bullet, Dumbbell, Calendar, Combo, Sankey,
  Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar, Chord,
  createChart, lineChartType, barChartType, areaChartType, scatterChartType,
  pieChartType, radarChartType,
  renderToString,
  resolveTheme, THEME_PRESETS,
  formatValue, formatPercent,
} from '@chartts/core'
import type { ChartInstance, ChartData } from '@chartts/core'

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const DATA = {
  revenue: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    series: [{ name: 'Revenue', values: [4200,5800,5100,7200,6800,8900,9200,8700,10100,9800,11200,12500] }],
  } as ChartData,
  multi: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
    series: [
      { name: 'Revenue', values: [42,58,51,72,68,89] },
      { name: 'Expenses', values: [35,41,38,52,48,61] },
      { name: 'Profit', values: [7,17,13,20,20,28] },
    ],
  } as ChartData,
  bar: {
    labels: ['Product A','Product B','Product C','Product D','Product E'],
    series: [{ name: 'Sales', values: [340,280,420,190,310] }],
  } as ChartData,
  grouped: {
    labels: ['Q1','Q2','Q3','Q4'],
    series: [
      { name: '2024', values: [120,150,180,200] },
      { name: '2025', values: [140,180,210,250] },
    ],
  } as ChartData,
  pie: {
    labels: ['Chrome','Firefox','Safari','Edge','Other'],
    series: [{ name: 'Share', values: [65,12,10,8,5] }],
  } as ChartData,
  scatter: {
    labels: ['A','B','C','D','E','F','G','H','I','J'],
    series: [
      { name: 'Group A', values: [28,45,32,55,40,62,35,48,52,38] },
      { name: 'Group B', values: [15,38,25,48,33,55,28,42,45,30] },
    ],
  } as ChartData,
  radar: {
    labels: ['Speed','Power','Defense','Range','Stealth','Intelligence'],
    series: [
      { name: 'Hero A', values: [85,70,90,60,45,75] },
      { name: 'Hero B', values: [65,90,50,80,70,85] },
    ],
  } as ChartData,
  area: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    series: [{ name: 'Users', values: [120,350,280,420,510,380,290], fill: true, fillOpacity: 0.2, showPoints: false }],
  } as ChartData,
  waterfall: {
    labels: ['Start','Sales','Returns','COGS','OpEx','Tax','Net'],
    series: [{ name: 'Profit', values: [1000,450,-120,-280,-150,-80,820] }],
  } as ChartData,
  funnel: {
    labels: ['Visitors','Signups','Activated','Subscribed','Retained'],
    series: [{ name: 'Conversion', values: [10000,4200,2100,800,450] }],
  } as ChartData,
  spark: {
    labels: Array.from({ length: 20 }, (_, i) => i),
    series: [{ name: 'Trend', values: [12,14,11,15,18,16,19,22,20,24,23,26,25,28,27,30,32,29,34,36], showPoints: false }],
  } as ChartData,
  heatmap: {
    labels: ['Mon','Tue','Wed','Thu','Fri'],
    series: [
      { name: '9am', values: [2,5,8,3,6] },
      { name: '12pm', values: [7,9,4,8,5] },
      { name: '3pm', values: [5,3,7,6,9] },
      { name: '6pm', values: [8,6,2,4,3] },
    ],
  } as ChartData,
  boxplot: {
    labels: ['Team A','Team B','Team C','Team D'],
    series: [{ name: 'Dist', values: [22,35,48,62,78,18,30,42,55,70,28,40,52,68,85,15,25,38,50,65] }],
  } as ChartData,
  histogram: {
    labels: ['0-10','10-20','20-30','30-40','40-50','50-60','60-70','70-80','80-90','90-100'],
    series: [{ name: 'Scores', values: [5,12,18,32,45,38,28,15,8,3] }],
  } as ChartData,
  treemap: {
    labels: ['JS','Python','Java','C++','Go','Rust','Ruby'],
    series: [{ name: 'Popularity', values: [65,55,45,30,25,18,12] }],
  } as ChartData,
  polar: {
    labels: ['N','NE','E','SE','S','SW','W','NW'],
    series: [{ name: 'Wind', values: [40,25,55,30,45,20,60,35] }],
  } as ChartData,
  radialbar: {
    labels: ['React','Vue','Angular','Svelte','Solid'],
    series: [{ name: 'Satisfaction', values: [92,87,68,95,88] }],
  } as ChartData,
  lollipop: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    series: [{ name: 'Steps', values: [8200,6500,9100,7800,10500,12000,5400] }],
  } as ChartData,
  bullet: {
    labels: ['Revenue','Profit','Satisfaction','New Customers'],
    series: [
      { name: 'Actual', values: [275,42,88,1500] },
      { name: 'Target', values: [300,50,95,2000] },
    ],
  } as ChartData,
  dumbbell: {
    labels: ['Engineering','Marketing','Sales','Support','HR'],
    series: [
      { name: '2024', values: [72,58,65,80,45] },
      { name: '2025', values: [88,75,72,85,68] },
    ],
  } as ChartData,
  calendar: {
    labels: Array.from({ length: 91 }, (_, i) => `Day ${i+1}`),
    series: [{ name: 'Contributions', values: Array.from({ length: 91 }, () => Math.floor(Math.random()*10)) }],
  } as ChartData,
  combo: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
    series: [
      { name: 'Revenue', values: [42,58,51,72,68,89] },
      { name: 'Trend', values: [40,50,55,62,70,82] },
    ],
  } as ChartData,
  sankey: {
    series: [
      { name: 'Google \u2192 Landing', values: [5000] },
      { name: 'Google \u2192 Blog', values: [3000] },
      { name: 'Social \u2192 Landing', values: [2500] },
      { name: 'Social \u2192 Product', values: [1500] },
      { name: 'Direct \u2192 Landing', values: [2000] },
      { name: 'Landing \u2192 Signup', values: [4000] },
      { name: 'Landing \u2192 Product', values: [3500] },
      { name: 'Blog \u2192 Signup', values: [1200] },
      { name: 'Product \u2192 Purchase', values: [2800] },
      { name: 'Signup \u2192 Purchase', values: [2500] },
    ],
  } as ChartData,
  sunburst: {
    labels: ['Tech/Frontend/React','Tech/Frontend/Vue','Tech/Frontend/Svelte','Tech/Backend/Node','Tech/Backend/Python','Tech/Backend/Go','Design/UI','Design/UX','Design/Brand','Marketing/SEO','Marketing/Content','Marketing/Ads'],
    series: [{ name: 'Headcount', values: [25,15,8,20,18,12,10,8,5,7,9,6] }],
  } as ChartData,
  tree: {
    labels: ['CEO','CEO/CTO','CEO/CTO/Eng Lead','CEO/CTO/Eng Lead/Dev A','CEO/CTO/Eng Lead/Dev B','CEO/CTO/QA Lead','CEO/CFO','CEO/CFO/Finance','CEO/CFO/Accounting','CEO/CMO','CEO/CMO/Marketing','CEO/CMO/Sales'],
    series: [{ name: 'Org', values: [1,1,1,1,1,1,1,1,1,1,1,1] }],
  } as ChartData,
  graph: {
    series: [
      { name: 'React \u2192 Redux', values: [8] },
      { name: 'React \u2192 Next.js', values: [9] },
      { name: 'React \u2192 Vite', values: [6] },
      { name: 'Vue \u2192 Nuxt', values: [7] },
      { name: 'Vue \u2192 Vite', values: [8] },
      { name: 'Vue \u2192 Pinia', values: [6] },
      { name: 'Svelte \u2192 SvelteKit', values: [7] },
      { name: 'Svelte \u2192 Vite', values: [5] },
      { name: 'Next.js \u2192 Vercel', values: [8] },
      { name: 'Nuxt \u2192 Vercel', values: [5] },
    ],
  } as ChartData,
  parallel: {
    labels: ['Price','Performance','Battery','Camera','Display','Storage'],
    series: [
      { name: 'Phone A', values: [899,92,85,95,90,256] },
      { name: 'Phone B', values: [699,78,90,80,85,128] },
      { name: 'Phone C', values: [1099,98,75,98,95,512] },
      { name: 'Phone D', values: [499,65,95,70,75,64] },
      { name: 'Phone E', values: [799,88,88,85,88,256] },
    ],
  } as ChartData,
  themeriver: {
    labels: ['2018','2019','2020','2021','2022','2023','2024','2025'],
    series: [
      { name: 'React', values: [40,45,50,55,58,60,62,65] },
      { name: 'Vue', values: [15,22,28,32,35,37,38,40] },
      { name: 'Angular', values: [30,28,25,22,20,18,16,15] },
      { name: 'Svelte', values: [2,5,8,12,15,18,22,25] },
      { name: 'Solid', values: [0,1,2,4,6,8,10,12] },
    ],
  } as ChartData,
  pictorialbar: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    series: [{ name: 'Coffees', values: [3,4,2,5,3,6,2] }],
  } as ChartData,
  chord: {
    labels: ['Engineering','Design','Marketing','Sales','Support'],
    series: [
      { name: 'Engineering', values: [0,30,10,5,15] },
      { name: 'Design', values: [25,0,20,8,5] },
      { name: 'Marketing', values: [5,15,0,30,10] },
      { name: 'Sales', values: [3,5,25,0,20] },
      { name: 'Support', values: [10,3,8,15,0] },
    ],
  } as ChartData,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let charts: ChartInstance[] = []
let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = () => isDark ? 'dark' as const : 'light' as const

function destroyCharts() {
  for (const c of charts) c.destroy()
  charts = []
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function h(tag: string, cls: string, html?: string): HTMLElement {
  const e = document.createElement(tag)
  e.className = cls
  if (html) e.innerHTML = html
  return e
}

function mount(_parent: HTMLElement, chart: ChartInstance) {
  charts.push(chart)
  return chart
}

function chartCard(title: string, desc: string, containerCls = 'h-64'): { card: HTMLElement; container: HTMLElement } {
  const card = h('div', 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden')
  const header = h('div', 'px-4 pt-3 pb-2')
  header.appendChild(Object.assign(h('h3', 'text-sm font-semibold'), { textContent: title }))
  header.appendChild(Object.assign(h('p', 'text-xs text-gray-400 mt-0.5'), { textContent: desc }))
  card.appendChild(header)
  const container = h('div', `px-4 pb-4 ${containerCls}`)
  card.appendChild(container)
  return { card, container }
}

function section(title: string, description: string): HTMLElement {
  const s = h('div', 'mb-8')
  s.appendChild(Object.assign(h('h2', 'text-lg font-bold mb-1'), { textContent: title }))
  s.appendChild(Object.assign(h('p', 'text-sm text-gray-500 dark:text-gray-400 mb-4'), { textContent: description }))
  return s
}

function grid(cols = 3): HTMLElement {
  return h('div', `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-${cols} gap-4`)
}

function btn(label: string, onClick: () => void, cls = ''): HTMLElement {
  const b = h('button', `px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${cls}`)
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}

function controlBar(...children: HTMLElement[]): HTMLElement {
  const bar = h('div', 'flex flex-wrap items-center gap-2 mb-4')
  for (const c of children) bar.appendChild(c)
  return bar
}

function logBox(): { el: HTMLElement; log: (msg: string) => void } {
  const el = h('div', 'mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono max-h-32 overflow-y-auto')
  el.textContent = 'Events will appear here...'
  const log = (msg: string) => {
    const line = h('div', 'py-0.5 border-b border-gray-200 dark:border-gray-700 last:border-0')
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`
    if (el.firstChild?.textContent === 'Events will appear here...') el.innerHTML = ''
    el.prepend(line)
  }
  return { el, log }
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

interface Page {
  id: string
  name: string
  icon: string
  group: string
  render: (main: HTMLElement) => void
}

const pages: Page[] = [
  // -- Overview --
  {
    id: 'overview', name: 'All Charts', icon: '\u25A6', group: 'Overview',
    render(main) {
      main.appendChild(section('All 34 Chart Types', 'One of every chart type at a glance. Click sidebar to test each in detail.'))
      const g = grid(3)

      const all: [string, (el: HTMLElement) => ChartInstance][] = [
        ['Line', el => Line(el, { theme: theme(), data: DATA.revenue })],
        ['Bar', el => Bar(el, { theme: theme(), data: DATA.bar })],
        ['Stacked Bar', el => StackedBar(el, { theme: theme(), data: DATA.grouped })],
        ['Horizontal Bar', el => HorizontalBar(el, { theme: theme(), data: { labels: ['A','B','C'], series: [{ name: 'X', values: [80,120,60] }] } })],
        ['Area', el => Area(el, { theme: theme(), data: DATA.area })],
        ['Pie', el => Pie(el, { theme: theme(), data: DATA.pie })],
        ['Donut', el => Donut(el, { theme: theme(), data: DATA.pie })],
        ['Scatter', el => Scatter(el, { theme: theme(), data: DATA.scatter })],
        ['Bubble', el => Bubble(el, { theme: theme(), data: { labels: ['A','B','C','D','E'], series: [{ name: 'D', values: [15,30,22,45,28] }] } })],
        ['Radar', el => Radar(el, { theme: theme(), data: DATA.radar })],
        ['Sparkline', el => Sparkline(el, { theme: theme(), data: DATA.spark })],
        ['Candlestick', el => Candlestick(el, { theme: theme(), data: { labels: ['Mon','Tue','Wed','Thu','Fri'], series: [{ name: 'AAPL', values: [152,155,148,153,157] }] }, ohlc: { open:[148,152,155,148,153], high:[154,158,156,155,160], low:[146,150,147,146,151], close:[152,155,148,153,157] } } as any)],
        ['Waterfall', el => Waterfall(el, { theme: theme(), data: DATA.waterfall, totals: [0,6] } as any)],
        ['Funnel', el => Funnel(el, { theme: theme(), data: DATA.funnel } as any)],
        ['Gauge', el => Gauge(el, { theme: theme(), data: { series: [{ name: 'Score', values: [73] }] }, gaugeMin: 0, gaugeMax: 100 } as any)],
        ['Heatmap', el => Heatmap(el, { theme: theme(), data: DATA.heatmap })],
        ['Boxplot', el => Boxplot(el, { theme: theme(), data: DATA.boxplot })],
        ['Histogram', el => Histogram(el, { theme: theme(), data: DATA.histogram })],
        ['Treemap', el => Treemap(el, { theme: theme(), data: DATA.treemap })],
        ['Polar', el => Polar(el, { theme: theme(), data: DATA.polar })],
        ['Radial Bar', el => RadialBar(el, { theme: theme(), data: DATA.radialbar })],
        ['Lollipop', el => Lollipop(el, { theme: theme(), data: DATA.lollipop })],
        ['Bullet', el => Bullet(el, { theme: theme(), data: DATA.bullet })],
        ['Dumbbell', el => Dumbbell(el, { theme: theme(), data: DATA.dumbbell })],
        ['Calendar', el => Calendar(el, { theme: theme(), data: DATA.calendar, colors: ['#10b981'] })],
        ['Combo', el => Combo(el, { theme: theme(), data: DATA.combo })],
        ['Sankey', el => Sankey(el, { theme: theme(), data: DATA.sankey })],
        ['Sunburst', el => Sunburst(el, { theme: theme(), data: DATA.sunburst })],
        ['Tree', el => Tree(el, { theme: theme(), data: DATA.tree })],
        ['Graph', el => Graph(el, { theme: theme(), data: DATA.graph })],
        ['Parallel', el => Parallel(el, { theme: theme(), data: DATA.parallel })],
        ['ThemeRiver', el => ThemeRiver(el, { theme: theme(), data: DATA.themeriver })],
        ['PictorialBar', el => PictorialBar(el, { theme: theme(), data: DATA.pictorialbar })],
        ['Chord', el => Chord(el, { theme: theme(), data: DATA.chord })],
      ]

      for (const [name, factory] of all) {
        const { card, container } = chartCard(name, '', 'h-48')
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(container, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },

  // -- Chart type pages --
  {
    id: 'line', name: 'Line', icon: '\u2500', group: 'Charts',
    render(main) {
      main.appendChild(section('Line Charts', 'All line chart variants: curves, multi-series, dashed, step.'))
      const g = grid(2)
      const variants: [string, string, () => ChartInstance][] = [
        ['Simple Line', 'Single series, monotone curve', () => { const { card, container } = chartCard('Simple Line', 'Monotone curve, auto y-axis'); g.appendChild(card); return Line(container, { theme: theme(), data: DATA.revenue }) }],
        ['Multi-Series', 'Three series with legend', () => { const { card, container } = chartCard('Multi-Series', '3 series, legend, tooltips'); g.appendChild(card); return Line(container, { theme: theme(), data: DATA.multi }) }],
        ['Step Curve', 'curve: "step"', () => { const { card, container } = chartCard('Step Interpolation', 'Discrete step mode'); g.appendChild(card); return Line(container, { theme: theme(), data: DATA.revenue, curve: 'step' }) }],
        ['Linear Curve', 'curve: "linear"', () => { const { card, container } = chartCard('Linear', 'Straight line segments'); g.appendChild(card); return Line(container, { theme: theme(), data: DATA.multi, curve: 'linear' }) }],
        ['Dashed Lines', 'style: "dashed" / "dotted"', () => { const { card, container } = chartCard('Dashed & Dotted', 'Different line styles per series'); g.appendChild(card); return Line(container, { theme: theme(), data: { labels: ['Jan','Feb','Mar','Apr','May'], series: [{ name: 'Actual', values: [10,25,20,35,30], style: 'solid' },{ name: 'Forecast', values: [12,22,28,32,38], style: 'dashed' },{ name: 'Target', values: [15,15,15,15,15], style: 'dotted' }] } }) }],
        ['No Points', 'showPoints: false', () => { const { card, container } = chartCard('No Points', 'Clean line only'); g.appendChild(card); return Line(container, { theme: theme(), data: { ...DATA.spark, series: DATA.spark.series.map(s => ({ ...s, showPoints: false })) } }) }],
      ]
      for (const [_n, _d, factory] of variants) { requestAnimationFrame(() => { try { mount(main, factory()) } catch {} }) }
      main.appendChild(g)
    },
  },
  {
    id: 'bar', name: 'Bar', icon: '\u2590', group: 'Charts',
    render(main) {
      main.appendChild(section('Bar Charts', 'All bar variants: vertical, horizontal, stacked, grouped, negative values.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Simple Bar', 'Single series', c => Bar(c, { theme: theme(), data: DATA.bar })],
        ['Grouped', 'Multi-series side by side', c => Bar(c, { theme: theme(), data: DATA.grouped })],
        ['Negative Values', 'Bars above/below zero', c => Bar(c, { theme: theme(), data: { labels: ['Jan','Feb','Mar','Apr','May','Jun'], series: [{ name: 'P&L', values: [25,-10,35,-5,40,15] }] } })],
        ['Rounded Corners', 'barRadius: 6', c => Bar(c, { theme: theme(), data: DATA.bar, barRadius: 6 })],
        ['Custom Colors', 'Purple palette', c => Bar(c, { theme: theme(), data: DATA.bar, colors: ['#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'] })],
        ['Stacked Bar', 'StackedBar()', c => StackedBar(c, { theme: theme(), data: { labels: ['Q1','Q2','Q3','Q4'], series: [{ name: 'A', values: [120,150,180,200] },{ name: 'B', values: [80,110,90,130] },{ name: 'C', values: [40,60,70,50] }] } })],
        ['Horizontal Bar', 'HorizontalBar()', c => HorizontalBar(c, { theme: theme(), data: { labels: ['React','Vue','Angular','Svelte','Solid'], series: [{ name: 'Stars', values: [218,207,94,76,30] }] } })],
        ['Both Grids', 'xGrid + yGrid', c => Bar(c, { theme: theme(), data: DATA.grouped, xGrid: true, yGrid: true })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'pie', name: 'Pie & Donut', icon: '\u25CF', group: 'Charts',
    render(main) {
      main.appendChild(section('Pie & Donut', 'Pie and donut chart variants.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Pie Chart', 'Classic pie with labels', c => Pie(c, { theme: theme(), data: DATA.pie })],
        ['Donut Chart', 'Inner radius cutout', c => Donut(c, { theme: theme(), data: DATA.pie })],
        ['Three Slices', 'Even split', c => Pie(c, { theme: theme(), data: { labels: ['A','B','C'], series: [{ name: 'Even', values: [33,33,34] }] } })],
        ['Custom Colors', 'Indigo palette', c => Donut(c, { theme: theme(), data: DATA.pie, colors: ['#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899'] })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'scatter', name: 'Scatter & Bubble', icon: '\u22EF', group: 'Charts',
    render(main) {
      main.appendChild(section('Scatter & Bubble', 'Scatter plots and bubble charts.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Scatter', 'Two groups', c => Scatter(c, { theme: theme(), data: DATA.scatter })],
        ['Single Scatter', 'One group', c => Scatter(c, { theme: theme(), data: { labels: DATA.scatter.labels, series: [DATA.scatter.series[0]!] } })],
        ['Bubble', 'Variable radius', c => Bubble(c, { theme: theme(), data: { labels: ['A','B','C','D','E','F'], series: [{ name: 'Markets', values: [30,55,42,70,25,60] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'radar', name: 'Radar', icon: '\u25C6', group: 'Charts',
    render(main) {
      main.appendChild(section('Radar Charts', 'Multi-dimensional comparison.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Two Series', 'Hero A vs Hero B', c => Radar(c, { theme: theme(), data: DATA.radar })],
        ['Single Series', 'One polygon', c => Radar(c, { theme: theme(), data: { labels: ['ATK','DEF','SPD','HP','MP'], series: [{ name: 'Stats', values: [90,60,75,85,50] }] } })],
        ['Pentagon', 'Five axes, two teams', c => Radar(c, { theme: theme(), data: { labels: ['Design','Code','Test','Deploy','Monitor'], series: [{ name: 'A', values: [80,95,70,85,60] },{ name: 'B', values: [70,75,90,60,85] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'financial', name: 'Financial', icon: '$', group: 'Charts',
    render(main) {
      main.appendChild(section('Financial Charts', 'Candlestick and waterfall charts.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Candlestick', 'OHLC with up/down colors', c => Candlestick(c, { theme: theme(), data: { labels: ['Mon','Tue','Wed','Thu','Fri'], series: [{ name: 'AAPL', values: [152,155,148,153,157] }] }, ohlc: { open:[148,152,155,148,153], high:[154,158,156,155,160], low:[146,150,147,146,151], close:[152,155,148,153,157] } } as any)],
        ['Waterfall', 'Running total', c => Waterfall(c, { theme: theme(), data: DATA.waterfall, totals: [0,6] } as any)],
        ['Waterfall (No Connectors)', 'connectors: false', c => Waterfall(c, { theme: theme(), data: { labels: ['Rev','COGS','Gross','SGA','R&D','EBIT'], series: [{ name: 'P&L', values: [500,-180,320,-90,-60,170] }] }, totals: [0,2,5], connectors: false } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'gauge-funnel', name: 'Gauge & Funnel', icon: '\u25D5', group: 'Charts',
    render(main) {
      main.appendChild(section('Gauge & Funnel', 'Gauge meters and funnel charts.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Gauge', '73% performance', c => Gauge(c, { theme: theme(), data: { series: [{ name: 'Perf', values: [73] }] }, gaugeMin: 0, gaugeMax: 100 } as any)],
        ['Gauge (Custom Range)', '0-200 temperature', c => Gauge(c, { theme: theme(), data: { series: [{ name: 'Temp', values: [142] }] }, gaugeMin: 0, gaugeMax: 200, valueFormat: (v: number) => `${v}\u00B0` } as any)],
        ['Funnel', '5-step conversion', c => Funnel(c, { theme: theme(), data: DATA.funnel } as any)],
        ['Simple Funnel', '3 steps', c => Funnel(c, { theme: theme(), data: { labels: ['Leads','Qualified','Closed'], series: [{ name: 'Pipeline', values: [500,200,80] }] } } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'scientific', name: 'Scientific', icon: '\u269A', group: 'Charts',
    render(main) {
      main.appendChild(section('Scientific Charts', 'Heatmap, boxplot, histogram.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Heatmap', 'Time vs day matrix', c => Heatmap(c, { theme: theme(), data: DATA.heatmap })],
        ['Boxplot', 'Statistical distribution', c => Boxplot(c, { theme: theme(), data: DATA.boxplot })],
        ['Histogram', 'Frequency distribution', c => Histogram(c, { theme: theme(), data: DATA.histogram })],
        ['Large Heatmap', '7x6 weekly grid', c => Heatmap(c, { theme: theme(), data: { labels: ['W1','W2','W3','W4','W5','W6'], series: [{ name: 'Mon', values: [4,7,2,8,5,3] },{ name: 'Tue', values: [6,3,9,4,7,8] },{ name: 'Wed', values: [8,5,1,6,9,2] },{ name: 'Thu', values: [3,8,7,2,4,6] },{ name: 'Fri', values: [5,2,6,9,3,7] },{ name: 'Sat', values: [1,4,3,5,8,9] },{ name: 'Sun', values: [2,6,8,1,2,4] }] }, colors: ['#10b981'] } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'treemap-polar', name: 'Treemap & Polar', icon: '\u25A6', group: 'Charts',
    render(main) {
      main.appendChild(section('Treemap & Polar', 'Space-filling and radial charts.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Treemap', 'Sized by popularity', c => Treemap(c, { theme: theme(), data: DATA.treemap })],
        ['Polar / Rose', 'Nightingale rose', c => Polar(c, { theme: theme(), data: DATA.polar })],
        ['Polar (Monthly)', '12-month activity', c => Polar(c, { theme: theme(), data: { labels: ['J','F','M','A','M','J','J','A','S','O','N','D'], series: [{ name: 'Activity', values: [20,25,40,55,70,85,90,80,65,45,30,22] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'radial-lollipop', name: 'Radial & Lollipop', icon: '\u29BF', group: 'Charts',
    render(main) {
      main.appendChild(section('Radial Bar & Lollipop', 'Concentric arcs and stems with dots.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Radial Bar', 'Satisfaction scores', c => RadialBar(c, { theme: theme(), data: DATA.radialbar })],
        ['Radial (Metrics)', 'Custom colors', c => RadialBar(c, { theme: theme(), data: { labels: ['CPU','Memory','Disk','Network'], series: [{ name: 'Usage', values: [78,65,42,91] }] }, colors: ['#ef4444','#f59e0b','#10b981','#6366f1'] })],
        ['Lollipop', 'Weekly steps', c => Lollipop(c, { theme: theme(), data: DATA.lollipop })],
        ['Lollipop Multi', 'Two series', c => Lollipop(c, { theme: theme(), data: { labels: ['Q1','Q2','Q3','Q4'], series: [{ name: '2024', values: [45,52,38,61] },{ name: '2025', values: [55,48,65,72] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'bullet-dumbbell', name: 'Bullet & Dumbbell', icon: '\u2192', group: 'Charts',
    render(main) {
      main.appendChild(section('Bullet & Dumbbell', 'Compact gauges and range comparisons.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Bullet', 'Actual vs target', c => Bullet(c, { theme: theme(), data: DATA.bullet })],
        ['Dumbbell', 'Before vs after', c => Dumbbell(c, { theme: theme(), data: DATA.dumbbell })],
        ['Dumbbell (Salary)', 'Min vs max range', c => Dumbbell(c, { theme: theme(), data: { labels: ['Junior','Mid','Senior','Lead','Principal'], series: [{ name: 'Min', values: [60,85,110,140,170] },{ name: 'Max', values: [80,120,160,200,250] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'calendar-combo-sankey', name: 'Calendar, Combo, Sankey', icon: '\u262E', group: 'Charts',
    render(main) {
      main.appendChild(section('Calendar, Combo & Sankey', 'GitHub-style calendar, mixed chart types, and flow diagrams.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Calendar Heatmap', 'GitHub-style grid', c => Calendar(c, { theme: theme(), data: DATA.calendar, colors: ['#10b981'] })],
        ['Combo (Bar + Line)', 'First series bars, rest lines', c => Combo(c, { theme: theme(), data: DATA.combo })],
        ['Sankey', 'Traffic flow', c => Sankey(c, { theme: theme(), data: DATA.sankey })],
        ['Sparkline', 'Tiny inline chart', c => Sparkline(c, { theme: theme(), data: DATA.spark })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },

  // -- New Chart Types --
  {
    id: 'sunburst', name: 'Sunburst', icon: '\u2600', group: 'Charts',
    render(main) {
      main.appendChild(section('Sunburst Charts', 'Hierarchical radial visualization. Nested rings from center outward.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Department Sunburst', 'Tech/Design/Marketing hierarchy', c => Sunburst(c, { theme: theme(), data: DATA.sunburst })],
        ['Flat Sunburst', 'No hierarchy, single ring', c => Sunburst(c, { theme: theme(), data: { labels: ['JS','Python','Java','Go','Rust','Ruby','C++'], series: [{ name: 'Pop', values: [65,55,45,25,18,12,30] }] } })],
        ['Deep Hierarchy', '3 levels deep', c => Sunburst(c, { theme: theme(), data: { labels: ['A/X/1','A/X/2','A/Y/1','A/Y/2','B/X/1','B/Y/1','B/Y/2'], series: [{ name: 'V', values: [20,15,25,10,30,18,12] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'tree', name: 'Tree', icon: '\u2503', group: 'Charts',
    render(main) {
      main.appendChild(section('Tree Charts', 'Hierarchical node-link diagrams. Top-down and left-right layouts.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Org Chart', 'Top-down tree (default)', c => Tree(c, { theme: theme(), data: DATA.tree })],
        ['Horizontal Tree', 'Left-to-right layout', c => Tree(c, { theme: theme(), data: DATA.tree, treeLayout: 'left-right' } as any)],
        ['Flat Tree', 'No hierarchy, star layout', c => Tree(c, { theme: theme(), data: { labels: ['Root','A','B','C','D','E'], series: [{ name: 'V', values: [1,1,1,1,1,1] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'graph', name: 'Graph / Network', icon: '\u25CB', group: 'Charts',
    render(main) {
      main.appendChild(section('Graph / Network', 'Force-directed node-link diagrams showing relationships.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Framework Ecosystem', 'Libraries and their connections', c => Graph(c, { theme: theme(), data: DATA.graph })],
        ['Simple Network', 'Three connected nodes', c => Graph(c, { theme: theme(), data: { series: [{ name: 'A \u2192 B', values: [5] },{ name: 'B \u2192 C', values: [3] },{ name: 'C \u2192 A', values: [4] }] } })],
        ['Hub and Spoke', 'Central node connected to all', c => Graph(c, { theme: theme(), data: { series: [{ name: 'Hub \u2192 A', values: [5] },{ name: 'Hub \u2192 B', values: [4] },{ name: 'Hub \u2192 C', values: [6] },{ name: 'Hub \u2192 D', values: [3] },{ name: 'Hub \u2192 E', values: [7] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'parallel', name: 'Parallel', icon: '\u2016', group: 'Charts',
    render(main) {
      main.appendChild(section('Parallel Coordinates', 'Multi-dimensional data on parallel vertical axes.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Phone Comparison', '6 dimensions, 5 phones', c => Parallel(c, { theme: theme(), data: DATA.parallel })],
        ['3 Dimensions', 'Simple parallel chart', c => Parallel(c, { theme: theme(), data: { labels: ['Speed','Cost','Quality'], series: [{ name: 'A', values: [80,30,90] },{ name: 'B', values: [60,80,70] },{ name: 'C', values: [95,60,50] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'themeriver', name: 'ThemeRiver', icon: '\u2248', group: 'Charts',
    render(main) {
      main.appendChild(section('ThemeRiver / StreamGraph', 'Stacked streams centered around a baseline.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Framework Trends', '5 frameworks over time', c => ThemeRiver(c, { theme: theme(), data: DATA.themeriver })],
        ['Three Streams', 'Simple stream chart', c => ThemeRiver(c, { theme: theme(), data: { labels: ['Q1','Q2','Q3','Q4'], series: [{ name: 'Alpha', values: [20,35,40,30] },{ name: 'Beta', values: [15,25,20,35] },{ name: 'Gamma', values: [30,20,25,20] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'pictorialbar', name: 'PictorialBar', icon: '\u25CF', group: 'Charts',
    render(main) {
      main.appendChild(section('PictorialBar', 'Bars made from stacked symbols. Like a pictograph.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Coffee Tracker', 'Circles (default)', c => PictorialBar(c, { theme: theme(), data: DATA.pictorialbar })],
        ['Diamond Symbols', 'symbol: "diamond"', c => PictorialBar(c, { theme: theme(), data: DATA.pictorialbar, symbol: 'diamond' } as any)],
        ['Star Symbols', 'symbol: "star"', c => PictorialBar(c, { theme: theme(), data: { labels: ['Alice','Bob','Charlie','Diana'], series: [{ name: 'Score', values: [5,3,4,2] }] }, symbol: 'star', symbolSize: 18 } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'chord', name: 'Chord', icon: '\u25EF', group: 'Charts',
    render(main) {
      main.appendChild(section('Chord Diagram', 'Circular relationship diagram with ribbons connecting arcs.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Team Collaboration', 'Cross-team communication flows', c => Chord(c, { theme: theme(), data: DATA.chord })],
        ['Arrow Notation', 'Using \u2192 format', c => Chord(c, { theme: theme(), data: { series: [{ name: 'US \u2192 EU', values: [50] },{ name: 'EU \u2192 US', values: [40] },{ name: 'US \u2192 Asia', values: [30] },{ name: 'Asia \u2192 US', values: [35] },{ name: 'EU \u2192 Asia', values: [25] },{ name: 'Asia \u2192 EU', values: [20] }] } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)
    },
  },

  // -- Feature testing pages --
  {
    id: 'themes', name: 'Themes', icon: '\u25D1', group: 'Features',
    render(main) {
      main.appendChild(section('Theme System', 'Test all built-in themes and presets. Each chart uses a different theme.'))
      const g = grid(2)

      const themes = ['light', 'dark', 'auto', 'corporate', 'saas', 'startup', 'editorial', 'ocean']
      for (const t of themes) {
        const { card, container } = chartCard(`Theme: ${t}`, `theme: "${t}"`)
        if (t === 'dark' || t === 'ocean') { container.style.background = '#0a0a0a'; container.style.borderRadius = '8px' }
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, Line(container, { theme: t as any, data: DATA.multi })) } catch {} })
      }
      main.appendChild(g)

      // Theme presets object
      const presetSection = section('Theme Preset Details', 'THEME_PRESETS object keys: ' + Object.keys(THEME_PRESETS).join(', '))
      main.appendChild(presetSection)

      const info = h('pre', 'p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono overflow-x-auto mb-4')
      info.textContent = JSON.stringify(resolveTheme('corporate'), null, 2)
      main.appendChild(info)
    },
  },
  {
    id: 'interactivity', name: 'Interactivity', icon: '\u270B', group: 'Features',
    render(main) {
      main.appendChild(section('Interactivity', 'Test tooltips, crosshair, click events, and hover.'))

      // Tooltip
      const g = grid(2)

      const { card: c1, container: t1 } = chartCard('Default Tooltip', 'tooltip: true — hover over points')
      g.appendChild(c1)
      requestAnimationFrame(() => mount(main, Line(t1, { theme: theme(), data: DATA.multi, tooltip: true })))

      const { card: c2, container: t2 } = chartCard('Crosshair', 'crosshair: true — vertical line with all values')
      g.appendChild(c2)
      requestAnimationFrame(() => mount(main, Line(t2, { theme: theme(), data: DATA.multi, crosshair: true })))

      // Click events
      const { card: c3, container: t3 } = chartCard('Click Events', 'Click any data point')
      const eventLog = logBox()
      c3.appendChild(eventLog.el)
      g.appendChild(c3)
      requestAnimationFrame(() => mount(main, Line(t3, { theme: theme(), data: DATA.multi, onClick: (pt: any) => eventLog.log(`Click: ${pt.seriesName} \u2014 ${pt.label}: ${pt.value}`) })))

      // Hover events
      const { card: c4, container: t4 } = chartCard('Hover Events', 'Hover over points')
      const hoverLog = logBox()
      c4.appendChild(hoverLog.el)
      g.appendChild(c4)
      requestAnimationFrame(() => mount(main, Bar(t4, { theme: theme(), data: DATA.bar, onHover: (pt: any) => { if (pt) hoverLog.log(`Hover: ${pt.label} = ${pt.value}`) } })))

      main.appendChild(g)
    },
  },
  {
    id: 'states', name: 'States', icon: '\u26A0', group: 'Features',
    render(main) {
      main.appendChild(section('Chart States', 'Test loading, error, and empty states. Use buttons to toggle.'))

      const { card, container } = chartCard('State Tester', 'Use buttons below to change state', 'h-64')
      let chart: ChartInstance | null = null
      requestAnimationFrame(() => {
        chart = Line(container, { theme: theme(), data: DATA.revenue })
        mount(main, chart)
      })

      const bar = controlBar(
        btn('Normal', () => chart?.setData(DATA.revenue)),
        btn('Loading', () => chart?.setLoading(true)),
        btn('Error', () => chart?.setError('Something went wrong')),
        btn('Empty', () => chart?.setEmpty('No data available')),
        btn('Empty (auto)', () => chart?.setData({ series: [{ name: 'Empty', values: [] }] })),
      )
      card.appendChild(bar)
      const g = grid(1)
      g.appendChild(card)
      main.appendChild(g)

      // Auto-transitions
      const { card: c2, container: t2 } = chartCard('Loading \u2192 Data', 'Shows loading skeleton for 2s, then reveals data')
      const g2 = grid(2)
      g2.appendChild(c2)
      requestAnimationFrame(() => {
        const ch = Line(t2, { theme: theme(), data: { series: [{ name: 'X', values: [] }] } })
        ch.setLoading(true)
        mount(main, ch)
        setTimeout(() => ch.setData(DATA.revenue), 2000)
      })

      const { card: c3, container: t3 } = chartCard('Error \u2192 Retry', 'Shows error for 2s, then loads')
      g2.appendChild(c3)
      requestAnimationFrame(() => {
        const ch = Bar(t3, { theme: theme(), data: { series: [{ name: 'X', values: [] }] } })
        ch.setError('Network timeout')
        mount(main, ch)
        setTimeout(() => ch.setData(DATA.bar), 2000)
      })
      main.appendChild(g2)
    },
  },
  {
    id: 'data-updates', name: 'Data Updates', icon: '\u21BB', group: 'Features',
    render(main) {
      main.appendChild(section('Live Data Updates', 'Test setData() and setOptions() on running charts.'))

      // Random data updates
      const { card, container } = chartCard('Random Data', 'Click button to randomize', 'h-64')
      let chart: ChartInstance | null = null
      requestAnimationFrame(() => {
        chart = Line(container, { theme: theme(), data: DATA.multi })
        mount(main, chart)
      })
      const bar = controlBar(
        btn('Randomize Data', () => {
          chart?.setData({
            labels: ['Jan','Feb','Mar','Apr','May','Jun'],
            series: [
              { name: 'Revenue', values: Array.from({ length: 6 }, () => Math.floor(Math.random()*100)) },
              { name: 'Expenses', values: Array.from({ length: 6 }, () => Math.floor(Math.random()*80)) },
              { name: 'Profit', values: Array.from({ length: 6 }, () => Math.floor(Math.random()*40)) },
            ],
          })
        }),
        btn('Add Point', () => {
          if (!chart) return
          const d = chart.getData()
          const newLabels = [...(d.labels || []), `X${(d.labels?.length || 0) + 1}`] as string[]
          chart.setData({
            labels: newLabels,
            series: d.series.map(s => ({ ...s, values: [...s.values, Math.floor(Math.random()*100)] })),
          })
        }),
        btn('Reset', () => chart?.setData(DATA.multi)),
      )
      card.appendChild(bar)
      const g = grid(1)
      g.appendChild(card)
      main.appendChild(g)

      // Live streaming
      const { card: c2, container: t2 } = chartCard('Live Streaming', 'New point every 500ms')
      let streaming = false
      let streamChart: ChartInstance | null = null
      let interval: number | null = null
      const streamData: ChartData = { labels: Array.from({ length: 20 }, (_, i) => i), series: [{ name: 'Live', values: Array.from({ length: 20 }, () => Math.floor(Math.random()*100)), showPoints: false }] }
      requestAnimationFrame(() => {
        streamChart = Line(t2, { theme: theme(), data: streamData })
        mount(main, streamChart)
      })
      const streamBar = controlBar(
        btn('Start Streaming', () => {
          if (streaming) return
          streaming = true
          interval = window.setInterval(() => {
            const s = streamData.series[0]!
            s.values.push(Math.floor(Math.random()*100))
            s.values.shift()
            streamChart?.setData({ ...streamData })
          }, 500)
        }),
        btn('Stop', () => { streaming = false; if (interval) clearInterval(interval) }),
      )
      c2.appendChild(streamBar)
      const g2 = grid(1)
      g2.appendChild(c2)
      main.appendChild(g2)
    },
  },
  {
    id: 'export', name: 'Export', icon: '\u2B07', group: 'Features',
    render(main) {
      main.appendChild(section('Export', 'Test toSVG(), toPNG(), toClipboard(), and renderToString() (SSR).'))

      const { card, container } = chartCard('Export Tester', 'Use buttons to export this chart', 'h-64')
      let chart: ChartInstance | null = null
      requestAnimationFrame(() => {
        chart = Line(container, { theme: theme(), data: DATA.multi })
        mount(main, chart)
      })

      const output = h('pre', 'mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono max-h-48 overflow-auto')
      output.textContent = 'Export output will appear here...'

      const bar = controlBar(
        btn('toSVG()', () => { if (chart) { const svg = chart.toSVG(); output.textContent = svg.slice(0, 500) + '...' } }),
        btn('toPNG()', async () => { if (chart) { const blob = await chart.toPNG(); output.textContent = `PNG Blob: ${blob.size} bytes, type: ${blob.type}` } }),
        btn('toClipboard()', async () => { if (chart) { await chart.toClipboard(); output.textContent = 'Copied PNG to clipboard!' } }),
      )
      card.appendChild(bar)
      card.appendChild(output)
      const g = grid(1)
      g.appendChild(card)
      main.appendChild(g)

      // SSR
      const ssrSection = section('SSR: renderToString()', 'Server-side rendering without DOM.')
      main.appendChild(ssrSection)
      const ssrOutput = h('div', 'p-4 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-auto')
      try {
        const svg = renderToString(lineChartType, DATA.multi, { width: 600, height: 300, theme: theme() })
        ssrOutput.innerHTML = svg
      } catch (e) {
        ssrOutput.textContent = `SSR Error: ${(e as Error).message}`
      }
      main.appendChild(ssrOutput)

      const ssrCode = h('pre', 'mt-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono')
      ssrCode.textContent = `import { renderToString, lineChartType } from '@chartts/core'\n\nconst svg = renderToString(lineChartType, data, { width: 600, height: 300, theme: 'dark' })`
      main.appendChild(ssrCode)
    },
  },
  {
    id: 'axes-grid', name: 'Axes & Grid', icon: '\u256C', group: 'Features',
    render(main) {
      main.appendChild(section('Axes & Grid', 'Test axis formatting, labels, grid options, Y range.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Auto Format (K/M/B)', 'Large values auto-formatted', c => Bar(c, { theme: theme(), data: { labels: ['A','B','C','D'], series: [{ name: 'Revenue', values: [1200000, 3500000, 2800000, 5100000] }] } })],
        ['Custom Y Format', 'yFormat: dollar format', c => Line(c, { theme: theme(), data: DATA.revenue, yFormat: (v: number) => `$${formatValue(v)}` })],
        ['Axis Labels', 'xLabel + yLabel', c => Bar(c, { theme: theme(), data: DATA.bar, xLabel: 'Products', yLabel: 'Units Sold' })],
        ['Y Range Override', 'yMin: 0, yMax: 100', c => Line(c, { theme: theme(), data: { labels: ['A','B','C','D'], series: [{ name: 'Score', values: [42,68,55,73] }] }, yMin: 0, yMax: 100 })],
        ['No Grid', 'yGrid: false', c => Line(c, { theme: theme(), data: DATA.area, yGrid: false })],
        ['Both Grids', 'xGrid + yGrid', c => Line(c, { theme: theme(), data: DATA.multi, xGrid: true, yGrid: true })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(g)

      // Format utilities
      const fmtSection = section('Format Utilities', 'formatValue() and formatPercent() exports.')
      main.appendChild(fmtSection)
      const fmtPre = h('pre', 'p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-mono')
      fmtPre.textContent = [
        `formatValue(1234) = "${formatValue(1234)}"`,
        `formatValue(1234567) = "${formatValue(1234567)}"`,
        `formatValue(1234567890) = "${formatValue(1234567890)}"`,
        `formatValue(1234567890000) = "${formatValue(1234567890000)}"`,
        `formatPercent(0.73) = "${formatPercent(0.73)}"`,
        `formatPercent(85) = "${formatPercent(85)}"`,
      ].join('\n')
      main.appendChild(fmtPre)
    },
  },
  {
    id: 'animations', name: 'Animations', icon: '\u25B6', group: 'Features',
    render(main) {
      main.appendChild(section('Entry Animations', 'All chart types have entry animations. Click "Replay" to re-trigger.'))

      const types: [string, (c: HTMLElement) => ChartInstance][] = [
        ['Line (draw)', c => Line(c, { theme: theme(), data: DATA.revenue })],
        ['Bar (scaleY)', c => Bar(c, { theme: theme(), data: DATA.bar })],
        ['Pie (scale pop)', c => Pie(c, { theme: theme(), data: DATA.pie })],
        ['Radar (scale)', c => Radar(c, { theme: theme(), data: DATA.radar })],
        ['Funnel (slide)', c => Funnel(c, { theme: theme(), data: DATA.funnel } as any)],
        ['Gauge (draw)', c => Gauge(c, { theme: theme(), data: { series: [{ name: 'S', values: [73] }] }, gaugeMin: 0, gaugeMax: 100 } as any)],
        ['Boxplot (scaleY)', c => Boxplot(c, { theme: theme(), data: DATA.boxplot })],
        ['Radial Bar (stroke)', c => RadialBar(c, { theme: theme(), data: DATA.radialbar })],
        ['Dumbbell (pop)', c => Dumbbell(c, { theme: theme(), data: DATA.dumbbell })],
        ['Sankey (fade)', c => Sankey(c, { theme: theme(), data: DATA.sankey })],
      ]

      const g = grid(2)
      for (const [name, factory] of types) {
        const { card, container } = chartCard(name, 'Click "Replay" to re-trigger animation')
        let currentChart: ChartInstance | null = null

        const replayBtn = btn('Replay', () => {
          if (currentChart) { currentChart.destroy(); charts = charts.filter(c => c !== currentChart) }
          container.innerHTML = ''
          requestAnimationFrame(() => { currentChart = factory(container); mount(main, currentChart) })
        })
        const btnWrap = h('div', 'px-4 pb-2')
        btnWrap.appendChild(replayBtn)
        card.appendChild(btnWrap)

        g.appendChild(card)
        requestAnimationFrame(() => { try { currentChart = factory(container); mount(main, currentChart) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'responsive', name: 'Responsive', icon: '\u2922', group: 'Features',
    render(main) {
      main.appendChild(section('Responsive Resize', 'Charts auto-resize with their container. Drag the divider to test.'))

      const wrapper = h('div', 'border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden')
      const resizable = h('div', 'resize-x overflow-auto p-4 min-w-[200px] max-w-full')
      resizable.style.width = '100%'
      resizable.style.resize = 'horizontal'

      const inner = h('div', 'h-64')
      resizable.appendChild(inner)
      wrapper.appendChild(resizable)

      const label = h('p', 'text-xs text-gray-400 p-2')
      label.textContent = 'Drag the bottom-right corner of the box above to resize'
      wrapper.appendChild(label)

      main.appendChild(wrapper)
      requestAnimationFrame(() => mount(main, Line(inner, { theme: theme(), data: DATA.multi })))

      // Fixed sizes
      const g = grid(3)
      for (const w of [200, 400, 600]) {
        const { card, container } = chartCard(`${w}px wide`, `width: ${w}`, 'h-40')
        container.style.width = `${w}px`
        container.style.maxWidth = '100%'
        g.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, Line(container, { theme: theme(), data: DATA.multi, width: w, height: 160 })) } catch {} })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'canvas', name: 'Canvas Renderer', icon: '\u25A3', group: 'Features',
    render(main) {
      main.appendChild(section('Canvas 2D Renderer', 'Same RenderNode tree drawn to Canvas 2D instead of SVG. Use renderer: "canvas" for large datasets (1k-100k points).'))
      const g = grid(2)

      const canvasCharts: [string, string, any, ChartData][] = [
        ['Line (Canvas)', 'renderer: "canvas"', lineChartType, DATA.revenue],
        ['Bar (Canvas)', 'renderer: "canvas"', barChartType, DATA.bar],
        ['Area (Canvas)', 'renderer: "canvas"', areaChartType, DATA.area],
        ['Scatter (Canvas)', 'renderer: "canvas"', scatterChartType, DATA.scatter],
        ['Pie (Canvas)', 'renderer: "canvas"', pieChartType, DATA.pie],
        ['Radar (Canvas)', 'renderer: "canvas"', radarChartType, DATA.radar],
      ]

      for (const [name, desc, chartType, data] of canvasCharts) {
        const { card, container } = chartCard(name, desc)
        g.appendChild(card)
        requestAnimationFrame(() => {
          try {
            mount(main, createChart(container, chartType, data, { theme: theme(), renderer: 'canvas' }))
          } catch (e) {
            container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>`
          }
        })
      }

      // Large dataset demo
      const { card: bigCard, container: bigContainer } = chartCard(
        '10k Points (Canvas)',
        'Performance test: 10,000 data points rendered to canvas',
        'h-64',
      )
      g.appendChild(bigCard)
      requestAnimationFrame(() => {
        try {
          const bigData: ChartData = {
            labels: Array.from({ length: 10000 }, (_, i) => i),
            series: [{
              name: 'Signal',
              values: Array.from({ length: 10000 }, (_, i) => Math.sin(i / 100) * 50 + Math.random() * 20 + 50),
              showPoints: false,
            }],
          }
          const t0 = performance.now()
          const inst = createChart(bigContainer, lineChartType, bigData, { theme: theme(), renderer: 'canvas' })
          const elapsed = (performance.now() - t0).toFixed(1)
          const badge = h('div', 'absolute top-2 right-2 text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-mono')
          badge.textContent = `${elapsed}ms`
          bigCard.style.position = 'relative'
          bigCard.appendChild(badge)
          mount(main, inst)
        } catch (e) {
          bigContainer.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>`
        }
      })

      main.appendChild(g)
    },
  },
]

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function getRoute(): string {
  return location.hash.slice(2) || 'overview'
}

function navigate(id: string) {
  location.hash = `#/${id}`
}

// ---------------------------------------------------------------------------
// Render app
// ---------------------------------------------------------------------------

const app = document.getElementById('app')!

function render() {
  destroyCharts()
  app.innerHTML = ''

  const route = getRoute()

  // Sidebar
  const sidebar = h('aside', 'w-56 shrink-0 h-full overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col')

  // Brand
  const brand = h('div', 'px-4 py-4 border-b border-gray-200 dark:border-gray-800')
  brand.innerHTML = '<div class="font-bold text-base">Chartts <span class="text-[10px] font-medium text-gray-400">dev</span></div>'

  // Theme toggle in brand area
  const themeBtn = h('button', 'mt-2 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left')
  themeBtn.innerHTML = isDark ? '\u2600 Switch to Light' : '\u263E Switch to Dark'
  themeBtn.addEventListener('click', () => { isDark = !isDark; document.documentElement.classList.toggle('dark', isDark); render() })
  brand.appendChild(themeBtn)
  sidebar.appendChild(brand)

  // Nav links
  const nav = h('nav', 'flex-1 overflow-y-auto py-2')
  let lastGroup = ''
  for (const page of pages) {
    if (page.group !== lastGroup) {
      lastGroup = page.group
      const groupLabel = h('div', 'px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400')
      groupLabel.textContent = page.group
      nav.appendChild(groupLabel)
    }
    const link = h('a', `flex items-center gap-2 px-4 py-1.5 text-sm cursor-pointer transition-colors ${
      page.id === route
        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`)
    link.innerHTML = `<span class="w-4 text-center text-xs">${page.icon}</span>${page.name}`
    link.addEventListener('click', () => navigate(page.id))
    nav.appendChild(link)
  }
  sidebar.appendChild(nav)

  // Stats footer
  const footer = h('div', 'px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-400')
  footer.textContent = `@chartts/core v0.1.0 \u2022 ${pages.length} pages \u2022 27 chart types`
  sidebar.appendChild(footer)

  app.appendChild(sidebar)

  // Main content
  const main = h('main', 'flex-1 h-full overflow-y-auto p-6')

  const currentPage = pages.find(p => p.id === route)
  if (currentPage) {
    currentPage.render(main)
  } else {
    main.appendChild(Object.assign(h('h1', 'text-2xl font-bold'), { textContent: '404 — Page not found' }))
  }

  app.appendChild(main)
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

if (isDark) document.documentElement.classList.add('dark')
window.addEventListener('hashchange', render)
render()
