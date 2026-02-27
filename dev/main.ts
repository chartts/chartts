import {
  Line, Bar, StackedBar, HorizontalBar, Pie, Donut, Scatter, Sparkline,
  Area, Radar, Bubble, Candlestick, Gauge, Waterfall, Funnel,
  Heatmap, Boxplot, Histogram, Treemap, Polar,
  RadialBar, Lollipop, Bullet, Dumbbell, Calendar, Combo, Sankey,
  Sunburst, Tree, Graph, Parallel, ThemeRiver, PictorialBar, Chord,
  Geo, Lines, Matrix, Custom,
  OHLC, Step, Volume, Range, Baseline, Kagi, Renko,
  Violin, Pack, Voronoi, WordCloud, Torus,
  WORLD_SIMPLE,
  createChart, lineChartType, barChartType, areaChartType, scatterChartType,
  pieChartType, radarChartType,
  renderToString,
  resolveTheme, THEME_PRESETS,
  formatValue, formatPercent,
  // Financial analysis utilities
  sma, ema, rsi,
  cumulativeReturns, drawdown, simpleReturns, volatility,
  toBollingerData, toMACDData, volumeDirections,
  // Interaction utilities
  linkCharts, applyDataZoom, createDataZoomWidget,
} from '@chartts/core'
import type { ChartInstance, ChartData } from '@chartts/core'
import {
  Scatter3D, Bar3D, Surface3D, Globe3D, Map3D,
  Lines3D, Line3D, ScatterGL, LinesGL, FlowGL, GraphGL, Torus3D,
} from '@chartts/gl'
import type { GLChartData, GLChartInstance, GLSeries3D } from '@chartts/gl'

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const GL_DATA = {
  scatter3d: {
    series: [{
      name: 'Cluster A', values: Array.from({length: 50}, () => Math.random() * 10),
      x: Array.from({length: 50}, () => Math.random() * 10),
      z: Array.from({length: 50}, () => Math.random() * 10),
    }, {
      name: 'Cluster B', values: Array.from({length: 50}, () => 5 + Math.random() * 10),
      x: Array.from({length: 50}, () => 5 + Math.random() * 10),
      z: Array.from({length: 50}, () => 5 + Math.random() * 10),
    }],
  } as GLChartData,
  bar3d: {
    series: [{
      name: 'Sales',
      values: [5, 8, 3, 12, 7, 9, 4, 11, 6, 10],
      x: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
      z: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    }],
    categories: ['Q1','Q2','Q3','Q4','Q5'],
  } as GLChartData,
  surface3d: {
    series: [],
    grid: Array.from({length: 30}, (_, r) =>
      Array.from({length: 30}, (_, c) => {
        const x = (c / 29) * 4 - 2, z = (r / 29) * 4 - 2
        return Math.sin(x * 2) * Math.cos(z * 2) * 3
      })
    ),
  } as GLChartData,
  globe3d: {
    series: [{
      name: 'Population',
      values: [85, 90, 95, 65, 75, 55, 80, 70, 60, 50, 45, 40],
      x: [-74, -0.12, 139.7, -43.2, 37.6, 151.2, 28.9, 121.5, 77.2, -99.1, 2.35, 100.5],
      y: [40.7, 51.5, 35.7, -22.9, 55.8, -33.9, 41.0, 31.2, 28.6, 19.4, 48.9, 13.8],
    }, {
      name: 'Growth',
      values: [30, 25, 20, 55, 15, 35, 28, 60, 70, 45, 18, 65],
      x: [-74, -0.12, 139.7, -43.2, 37.6, 151.2, 28.9, 121.5, 77.2, -99.1, 2.35, 100.5],
      y: [40.7, 51.5, 35.7, -22.9, 55.8, -33.9, 41.0, 31.2, 28.6, 19.4, 48.9, 13.8],
    }],
    categories: ['New York', 'London', 'Tokyo', 'Rio', 'Moscow', 'Sydney', 'Istanbul', 'Shanghai', 'Delhi', 'Mexico City', 'Paris', 'Bangkok'],
  } as GLChartData,
  lines3d: {
    series: [{
      name: 'Path A',
      values: Array.from({length: 20}, (_, i) => Math.sin(i * 0.3) * 3 + 5),
      x: Array.from({length: 20}, (_, i) => i * 0.5),
      z: Array.from({length: 20}, (_, i) => Math.cos(i * 0.3) * 2),
    }, {
      name: 'Path B',
      values: Array.from({length: 20}, (_, i) => Math.cos(i * 0.4) * 2 + 6),
      x: Array.from({length: 20}, (_, i) => i * 0.5),
      z: Array.from({length: 20}, (_, i) => Math.sin(i * 0.4) * 3),
    }],
  } as GLChartData,
  line3d: {
    series: [{
      name: 'Helix',
      values: Array.from({length: 50}, (_, i) => i * 0.2),
      x: Array.from({length: 50}, (_, i) => Math.cos(i * 0.3) * 3),
      z: Array.from({length: 50}, (_, i) => Math.sin(i * 0.3) * 3),
    }],
  } as GLChartData,
  map3d: {
    series: [{
      name: 'Population',
      values: [100, 80, 60, 40, 90, 70, 50, 30, 85, 65],
      x: [0, 1.2, 2.4, 3.6, 4.8, 0, 1.2, 2.4, 3.6, 4.8],
      z: [0, 0, 0, 0, 0, 1.2, 1.2, 1.2, 1.2, 1.2],
    }],
    categories: ['Region A','B','C','D','E','F','G','H','I','J'],
  } as GLChartData,
  scatterGL: (() => {
    // Gaussian cluster generator
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
    const cluster = (cx: number, cy: number, spread: number, n: number) => ({
      x: Array.from({length: n}, () => cx + gauss() * spread),
      y: Array.from({length: n}, () => cy + gauss() * spread),
    })
    const c1 = cluster(25, 70, 8, 4000)
    const c2 = cluster(60, 40, 12, 5000)
    const c3 = cluster(80, 75, 6, 3000)
    return {
      series: [
        { name: 'Group A', x: c1.x, y: c1.y },
        { name: 'Group B', x: c2.x, y: c2.y },
        { name: 'Group C', x: c3.x, y: c3.y },
      ],
    } as GLChartData
  })(),
  linesGL: {
    series: Array.from({length: 5}, (_, si) => ({
      name: `Series ${si + 1}`,
      x: Array.from({length: 200}, (_, i) => i),
      y: Array.from({length: 200}, (_, i) => Math.sin(i * 0.05 + si) * 50 + 50 + Math.random() * 10),
    })),
  } as GLChartData,
  graphGL: {
    series: [{
      name: 'Nodes',
      x: Array.from({length: 30}, () => Math.random() * 100),
      y: Array.from({length: 30}, () => 1 + Math.random() * 5),
    }],
    categories: Array.from({length: 30}, (_, i) => `N${i}`),
  } as GLChartData,
  torus3d: {
    series: [{ name: 'Metrics', values: [160, 130, 95, 55, 38] }],
    categories: ['Retention', 'Revenue', 'Growth', 'Engagement', 'Users'],
  } as GLChartData,
}

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
  geo: {
    labels: ['United States','China','Russia','Brazil','India','Australia','United Kingdom','France','Germany','Japan','Canada','Mexico','South Africa','Egypt','Nigeria','Argentina'],
    series: [
      { name: 'GDP (T$)', values: [21,15,1.7,1.6,3.2,1.4,2.8,2.6,3.8,4.9,1.7,1.1,0.4,0.3,0.4,0.5] },
      { name: 'Population (M)', values: [330,1400,145,210,1380,25,67,67,83,125,38,128,60,100,220,45] },
    ],
  } as ChartData,
  lines: {
    labels: [],
    series: [
      { name: 'NYC → London', values: [120] },
      { name: 'London → Tokyo', values: [85] },
      { name: 'Tokyo → Sydney', values: [60] },
      { name: 'Sydney → NYC', values: [45] },
      { name: 'NYC → Tokyo', values: [100] },
      { name: 'London → Sydney', values: [30] },
    ],
  } as ChartData,
  matrix: {
    labels: ['Math','Science','English','History','Art'],
    series: [
      { name: 'Math', values: [1.0, 0.72, 0.45, 0.38, 0.12] },
      { name: 'Science', values: [0.72, 1.0, 0.55, 0.48, 0.20] },
      { name: 'English', values: [0.45, 0.55, 1.0, 0.68, 0.52] },
      { name: 'History', values: [0.38, 0.48, 0.68, 1.0, 0.42] },
      { name: 'Art', values: [0.12, 0.20, 0.52, 0.42, 1.0] },
    ],
  } as ChartData,
  custom: {
    labels: ['A','B','C','D','E'],
    series: [{ name: 'Values', values: [40, 80, 60, 95, 50] }],
  } as ChartData,
  violin: {
    labels: ['Setosa','Versicolor','Virginica','Hybrid'],
    series: [{ name: 'Petal Length', values: [
      1.0, 1.3, 1.5, 1.7, 1.9,
      3.0, 3.8, 4.3, 4.7, 5.1,
      4.5, 5.2, 5.6, 6.1, 6.9,
      2.5, 3.1, 3.8, 4.2, 5.0,
    ] }],
  } as ChartData,
  pack: {
    labels: ['JavaScript','Python','TypeScript','Java','Rust','Go','C++','Ruby','Swift','Kotlin'],
    series: [{ name: 'Popularity', values: [98, 85, 72, 68, 45, 42, 38, 25, 22, 18] }],
  } as ChartData,
  voronoi: {
    labels: ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa','Lambda','Mu'],
    series: [{ name: 'Weight', values: [85, 72, 60, 55, 48, 42, 38, 35, 28, 22, 18, 12] }],
  } as ChartData,
  wordcloud: {
    labels: ['React','TypeScript','JavaScript','Node','CSS','HTML','Vite','Rust','Python','GraphQL','Docker','Kubernetes','AWS','Tailwind','Next.js','Vue','Angular','Svelte','Deno','Bun'],
    series: [{ name: 'Mentions', values: [100, 92, 88, 75, 70, 65, 58, 55, 50, 45, 42, 38, 35, 48, 52, 40, 32, 30, 25, 28] }],
  } as ChartData,
  torus: {
    labels: ['Apr', 'Jan', 'Mar', 'May', 'Feb'],
    series: [{ name: 'Revenue', values: [150, 120, 95, 72, 45] }],
  } as ChartData,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let charts: ChartInstance[] = []
let glCharts: GLChartInstance[] = []
let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = () => isDark ? 'dark' as const : 'light' as const

function destroyCharts() {
  for (const c of charts) c.destroy()
  charts = []
  for (const c of glCharts) c.destroy()
  glCharts = []
}

function mountGL(_parent: HTMLElement, chart: GLChartInstance) {
  glCharts.push(chart)
  return chart
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
        ['GEO/Map', el => Geo(el, { theme: theme(), data: DATA.geo, regions: WORLD_SIMPLE } as any)],
        ['Lines', el => Lines(el, { theme: theme(), data: DATA.lines })],
        ['Matrix', el => Matrix(el, { theme: theme(), data: DATA.matrix })],
        ['Custom', el => Custom(el, { theme: theme(), data: DATA.custom, renderFn: (ctx: any) => {
          const { area } = ctx; const nodes: any[] = [];
          const vals = ctx.data.series[0]?.values ?? []; const max = Math.max(...vals.map(Math.abs), 1);
          for (let i = 0; i < vals.length; i++) {
            const x = area.x + 30 + i * 60; const h = (vals[i] / max) * (area.height - 40);
            nodes.push({ type: 'rect', x, y: area.y + area.height - 20 - h, width: 40, height: h, attrs: { fill: ctx.options.colors[i % ctx.options.colors.length], rx: 6 } });
          } return nodes;
        } } as any)],
        ['OHLC', el => OHLC(el, { theme: theme(), data: { labels: ['Mon','Tue','Wed','Thu','Fri','Mon','Tue','Wed'], series: [{ name: 'AAPL', values: [152,155,148,153,157,154,158,155] }] }, ohlc: { open:[148,152,155,148,153,157,154,158], high:[154,158,156,155,160,159,162,160], low:[146,150,147,146,151,153,152,154], close:[152,155,148,153,157,154,158,155] } } as any)],
        ['Step', el => Step(el, { theme: theme(), data: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'], series: [{ name: 'Fed Rate', values: [5.25,5.25,5.50,5.50,5.50,5.25,5.00,5.00] }] } })],
        ['Volume', el => Volume(el, { theme: theme(), data: { labels: ['Mon','Tue','Wed','Thu','Fri','Mon','Tue','Wed'], series: [{ name: 'Vol (M)', values: [2.1,3.4,1.8,4.2,2.9,3.1,5.2,2.8] }] } } as any)],
        ['Range/Band', el => Range(el, { theme: theme(), data: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'], series: [{ name: 'Price', values: [100,105,103,108,112,109,115,118] }] }, range: { upper: [108,113,112,116,120,118,124,126], lower: [92,97,94,100,104,100,106,110] } } as any)],
        ['Baseline', el => Baseline(el, { theme: theme(), data: { labels: ['Q1','Q2','Q3','Q4','Q1','Q2','Q3','Q4'], series: [{ name: 'P&L', values: [5.2,-3.1,8.4,-1.5,6.8,2.1,-4.3,9.2] }] }, baseline: 0 } as any)],
        ['Kagi', el => Kagi(el, { theme: theme(), data: { labels: Array.from({length:30}, (_,i) => `D${i+1}`), series: [{ name: 'Price', values: [100,102,101,105,103,108,106,110,107,112,109,114,111,108,105,109,113,110,115,112,118,115,120,117,122,119,125,121,128,124] }] } } as any)],
        ['Renko', el => Renko(el, { theme: theme(), data: { labels: Array.from({length:30}, (_,i) => `D${i+1}`), series: [{ name: 'Price', values: [100,102,105,103,108,106,112,109,115,111,118,114,120,116,122,118,125,121,128,124,130,126,132,128,135,131,138,134,140,136] }] } } as any)],
        ['Violin', el => Violin(el, { theme: theme(), data: DATA.violin })],
        ['Pack', el => Pack(el, { theme: theme(), data: DATA.pack })],
        ['Voronoi', el => Voronoi(el, { theme: theme(), data: DATA.voronoi })],
        ['Word Cloud', el => WordCloud(el, { theme: theme(), data: DATA.wordcloud })],
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
      main.appendChild(section('Financial Analysis', 'Real-world fintech scenarios powered by built-in technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, portfolio analytics, and more. Every indicator is a pure function — import { sma } from "@chartts/core/finance".'))

      // ===================================================================
      // Shared 40-day synthetic AAPL-like price data
      // ===================================================================
      const DAY_LABELS = Array.from({length:40}, (_,i) => {
        const d = new Date(2025, 0, 6 + i) // starts Mon Jan 6 2025
        return `${d.getMonth()+1}/${d.getDate()}`
      })
      const CLOSE = [
        148,152,149,155,153,158,156,160,157,163,
        161,165,162,159,156,160,164,167,163,170,
        168,172,169,175,173,178,176,180,177,183,
        181,185,182,179,176,180,184,188,185,190,
      ]
      const OPEN = [
        146,148,152,149,155,153,158,156,160,157,
        163,161,165,162,159,156,160,164,167,163,
        170,168,172,169,175,173,178,176,180,177,
        183,181,185,182,179,176,180,184,188,185,
      ]
      const HIGH = CLOSE.map((c,i) => Math.max(c, OPEN[i]!) + Math.round(Math.random()*3 + 1))
      const LOW = CLOSE.map((c,i) => Math.min(c, OPEN[i]!) - Math.round(Math.random()*3 + 1))
      const VOL = [
        32,45,28,52,38,61,42,55,36,48,
        51,43,58,67,72,55,49,38,62,44,
        53,41,59,47,56,63,42,51,68,45,
        57,39,64,71,66,48,54,42,58,50,
      ]

      // ===================================================================
      // SCENARIO 1: Stock Trading Dashboard
      // Candlestick + SMA/EMA overlay, Volume, RSI oscillator
      // ===================================================================
      main.appendChild(section('Scenario 1: Stock Trading Dashboard', 'Candlestick with SMA(10) & EMA(20) overlays, volume bars, and RSI(14) oscillator. The bread and butter of any trading terminal.'))
      const s1Grid = grid(2)

      // Compute indicators
      const sma10 = sma(CLOSE, 10)
      const ema20 = ema(CLOSE, 20)
      const rsi14 = rsi(CLOSE, 14)
      const volDirs = volumeDirections(CLOSE)


      const s1Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['AAPL Candlestick + SMA(10) + EMA(20)', 'Price action with moving average overlays', c => Candlestick(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'AAPL', values: CLOSE },
          { name: 'SMA(10)', values: sma10 },
          { name: 'EMA(20)', values: ema20 },
        ] }, ohlc: { open: OPEN, high: HIGH, low: LOW, close: CLOSE }, legend: true } as any)],

        ['OHLC + SMA(10)', 'Tick-mark price chart with trend line', c => OHLC(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'AAPL', values: CLOSE },
          { name: 'SMA(10)', values: sma10 },
        ] }, ohlc: { open: OPEN, high: HIGH, low: LOW, close: CLOSE }, legend: true } as any)],

        ['Trading Volume', 'Green = price up, Red = price down', c => Volume(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Volume (M)', values: VOL }] }, directions: volDirs } as any)],

        ['RSI(14)', 'Overbought > 70, Oversold < 30', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'RSI', values: rsi14 }] }, yMin: 0, yMax: 100, colors: ['#8b5cf6'] })],
      ]
      for (const [title, desc, factory] of s1Items) {
        const { card, container } = chartCard(title, desc)
        s1Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s1Grid)

      // ===================================================================
      // SCENARIO 2: Portfolio Performance Analytics
      // Cumulative returns (baseline), drawdown, rolling volatility
      // ===================================================================
      main.appendChild(section('Scenario 2: Portfolio Performance', 'Cumulative returns vs benchmark, drawdown analysis, and rolling volatility. Every hedge fund dashboard needs these.'))
      const s2Grid = grid(2)

      const cumRet = cumulativeReturns(CLOSE).map(v => +(v * 100).toFixed(2))
      const dd = drawdown(CLOSE).map(v => +(v * 100).toFixed(2))
      const dailyRet = simpleReturns(CLOSE)
      const rollingVol = volatility(dailyRet, 10) as number[]

      // Fake benchmark (S&P 500) — slightly lower returns
      const benchClose = CLOSE.map((v,i) => 148 + (v - 148) * 0.7 + Math.sin(i/5)*2)
      const benchCumRet = cumulativeReturns(benchClose).map(v => +(v * 100).toFixed(2))

      const s2Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Cumulative Returns: Portfolio vs S&P 500', 'Performance comparison since inception', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'Portfolio', values: cumRet },
          { name: 'S&P 500', values: benchCumRet },
        ] }, legend: true, yLabel: '% Return', colors: ['#22c55e', '#6366f1'] })],

        ['Portfolio Alpha', 'Excess return vs benchmark (baseline at 0%)', c => Baseline(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Alpha %', values: cumRet.map((v,i) => +(v - benchCumRet[i]!).toFixed(2)) }] }, baseline: 0, positiveColor: '#22c55e', negativeColor: '#ef4444' } as any)],

        ['Drawdown', 'Peak-to-trough decline — how much pain?', c => Area(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Drawdown %', values: dd, fill: true, fillOpacity: 0.4 }] }, colors: ['#ef4444'], yLabel: '% from peak' })],

        ['Rolling Volatility (10-day)', 'Annualized volatility — risk spikes visible', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Vol %', values: rollingVol.map(v => isNaN(v) ? NaN : +(v * 100).toFixed(1)) }] }, colors: ['#f59e0b'], yLabel: '% annualized' })],
      ]
      for (const [title, desc, factory] of s2Items) {
        const { card, container } = chartCard(title, desc)
        s2Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s2Grid)

      // ===================================================================
      // SCENARIO 3: Bollinger Bands Technical Analysis
      // Range chart with computed bands + volume
      // ===================================================================
      main.appendChild(section('Scenario 3: Bollinger Bands', 'Computed Bollinger Bands (SMA(20) \u00B1 2\u03C3) displayed as a Range chart. Price touching the bands signals overbought/oversold conditions.'))
      const s3Grid = grid(2)

      const bb = toBollingerData(CLOSE, 10, 2) // period=10 for demo data

      const s3Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Bollinger Bands', 'SMA(10) \u00B1 2\u03C3 computed from close prices', c => Range(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'AAPL', values: bb.middle }] }, range: { upper: bb.upper, lower: bb.lower }, bandColor: '#6366f1', bandOpacity: 0.15, showPoints: false } as any)],

        ['Price vs Upper/Lower Band', 'Where is price relative to bands?', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'Close', values: CLOSE },
          { name: 'Upper', values: bb.upper },
          { name: 'Lower', values: bb.lower },
        ] }, legend: true, colors: ['#f59e0b', '#ef4444', '#22c55e'] })],

        ['Volume Profile', 'Volume under Bollinger analysis period', c => Volume(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Volume', values: VOL }] }, directions: volDirs } as any)],

        ['Bandwidth', 'Band width = (upper - lower) / middle — volatility proxy', c => {
          const bandwidth = bb.upper.map((u,i) => {
            const m = bb.middle[i]!
            return isNaN(u) || isNaN(m) || m === 0 ? NaN : +((u - bb.lower[i]!) / m * 100).toFixed(2)
          })
          return Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Bandwidth %', values: bandwidth }] }, colors: ['#ec4899'] })
        }],
      ]
      for (const [title, desc, factory] of s3Items) {
        const { card, container } = chartCard(title, desc)
        s3Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s3Grid)

      // ===================================================================
      // SCENARIO 4: MACD Momentum Analysis
      // Price line + MACD histogram/signal combo
      // ===================================================================
      main.appendChild(section('Scenario 4: MACD Signal', 'MACD(8,17,9) histogram + signal line for momentum analysis. Histogram crossing zero = trend shift. Signal crossovers = buy/sell signals.'))
      const s4Grid = grid(2)

      const m = toMACDData(CLOSE, 8, 17, 9) // shorter periods for 40-point data

      const s4Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Price Action', 'AAPL close prices — the data behind the signals', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'Close', values: CLOSE }] }, colors: ['#3b82f6'] })],

        ['MACD Histogram + Signal', 'Bars = momentum strength, Lines = MACD & signal crossovers', c => Combo(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'Histogram', values: m.histogram },
          { name: 'MACD', values: m.macd },
          { name: 'Signal', values: m.signal },
        ] }, legend: true, colors: ['#6366f1', '#22c55e', '#ef4444'] })],

        ['MACD Line vs Signal Line', 'Crossovers indicate trend changes', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'MACD', values: m.macd },
          { name: 'Signal', values: m.signal },
        ] }, legend: true, colors: ['#22c55e', '#ef4444'] })],

        ['RSI + MACD Confirmation', 'RSI confirms MACD signals — dual indicator strategy', c => Line(c, { theme: theme(), data: { labels: DAY_LABELS, series: [
          { name: 'RSI(14)', values: rsi14 },
        ] }, yMin: 0, yMax: 100, colors: ['#8b5cf6'] })],
      ]
      for (const [title, desc, factory] of s4Items) {
        const { card, container } = chartCard(title, desc)
        s4Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s4Grid)

      // ===================================================================
      // SCENARIO 5: Corporate Finance / Revenue & P&L
      // Waterfall, baseline P&L, combo revenue+margin, step rates
      // ===================================================================
      main.appendChild(section('Scenario 5: Revenue & P&L', 'Corporate finance dashboards: waterfall P&L breakdown, revenue vs margin, interest rate impact, and quarterly performance tracking.'))
      const s5Grid = grid(2)

      const s5Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Quarterly P&L Waterfall', 'Revenue breakdown: where the money goes', c => Waterfall(c, { theme: theme(), data: { labels: ['Revenue','COGS','Gross Profit','S&A','R&D','Operating','Tax','Net Income'], series: [{ name: 'Q4 FY25', values: [850,-320,530,-180,-120,230,-55,175] }] }, totals: [0,2,5,7] } as any)],

        ['Monthly P&L vs Budget', 'Green = above budget, Red = below', c => Baseline(c, { theme: theme(), data: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], series: [{ name: 'Variance %', values: [3.2,-1.5,5.8,-2.1,1.9,4.2,-3.8,2.5,6.1,-0.8,3.5,7.2] }] }, baseline: 0, positiveColor: '#22c55e', negativeColor: '#ef4444' } as any)],

        ['Revenue + Profit Margin', 'Bars = revenue ($M), Line = margin %', c => Combo(c, { theme: theme(), data: { labels: ['Q1','Q2','Q3','Q4','Q1','Q2','Q3','Q4'], series: [
          { name: 'Revenue ($M)', values: [42,48,51,55,58,62,68,75] },
          { name: 'Margin %', values: [18,21,19,23,22,25,24,28] },
        ] }, legend: true, colors: ['#3b82f6', '#f59e0b'] })],

        ['Fed Rate Impact', 'Step chart: discrete rate changes', c => Step(c, { theme: theme(), data: { labels: ['Jan 24','Mar 24','May 24','Jul 24','Sep 24','Nov 24','Jan 25','Mar 25','May 25','Jul 25','Sep 25','Nov 25'], series: [{ name: 'Fed Funds Rate %', values: [5.50,5.50,5.50,5.50,5.25,5.00,4.75,4.50,4.50,4.25,4.00,4.00] }] }, colors: ['#ef4444'] })],
      ]
      for (const [title, desc, factory] of s5Items) {
        const { card, container } = chartCard(title, desc)
        s5Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s5Grid)

      // ===================================================================
      // SCENARIO 6: Noise-Filtered Price Action
      // Kagi + Renko reversal charts for pure trend analysis
      // ===================================================================
      main.appendChild(section('Scenario 6: Trend & Reversal Analysis', 'Kagi and Renko charts filter noise and reveal pure price trends. Used by serious technical traders who want to cut through market noise.'))
      const s6Grid = grid(2)
      const s6Items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Kagi', 'Yang (thick green) = uptrend, Yin (thin red) = downtrend', c => Kagi(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'AAPL', values: CLOSE }] } } as any)],
        ['Renko', 'Fixed-size bricks — only significant moves form new bricks', c => Renko(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'AAPL', values: CLOSE }] } } as any)],
        ['Kagi (Tight 2%)', 'More sensitive reversal detection', c => Kagi(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'AAPL', values: CLOSE }] }, reversalAmount: 0.02 } as any)],
        ['Renko (Brick = 3)', 'Larger bricks = longer-term trend view', c => Renko(c, { theme: theme(), data: { labels: DAY_LABELS, series: [{ name: 'AAPL', values: CLOSE }] }, brickSize: 3 } as any)],
      ]
      for (const [title, desc, factory] of s6Items) {
        const { card, container } = chartCard(title, desc)
        s6Grid.appendChild(card)
        requestAnimationFrame(() => { try { mount(main, factory(container)) } catch {} })
      }
      main.appendChild(s6Grid)
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
        ['Violin', 'Distribution shape', c => Violin(c, { theme: theme(), data: DATA.violin })],
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
        ['Pack', 'Circle packing', c => Pack(c, { theme: theme(), data: DATA.pack })],
        ['Voronoi', 'Tessellation', c => Voronoi(c, { theme: theme(), data: DATA.voronoi })],
        ['Word Cloud', 'Sized by frequency', c => WordCloud(c, { theme: theme(), data: DATA.wordcloud })],
        ['Torus', 'Sine-wave cylinder', c => Torus(c, { theme: theme(), data: DATA.torus, intensity: 1, frequency: 1 } as any)],
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
    id: 'violin', name: 'Violin Plot', icon: '\u{1F3BB}', group: 'Charts',
    render(main) {
      main.appendChild(section('Violin Plot', 'Mirrored kernel density estimation showing distribution shape per category.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Basic Violin', '4 groups', c => Violin(c, { theme: theme(), data: DATA.violin })],
        ['Wide Spread', 'Varied distributions', c => Violin(c, { theme: theme(), data: { labels: ['Low Var', 'High Var', 'Skewed'], series: [{ name: 'Min', values: [30, 5, 20] }, { name: 'Q1', values: [38, 20, 28] }, { name: 'Median', values: [42, 50, 35] }, { name: 'Q3', values: [46, 80, 60] }, { name: 'Max', values: [54, 95, 85] }] } })],
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
    id: 'pack', name: 'Circle Packing', icon: '\u25CB', group: 'Charts',
    render(main) {
      main.appendChild(section('Circle Packing', 'Circles sized proportionally to value. Area encodes magnitude.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Framework Stars', '8 circles', c => Pack(c, { theme: theme(), data: DATA.pack })],
        ['Market Share', 'Tech companies', c => Pack(c, { theme: theme(), data: { labels: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla'], series: [{ name: 'Cap ($T)', values: [3.4, 3.1, 2.1, 1.9, 1.3, 0.8] }] } })],
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
    id: 'voronoi', name: 'Voronoi', icon: '\u2B21', group: 'Charts',
    render(main) {
      main.appendChild(section('Voronoi Tessellation', 'Nearest-neighbor partitioning of a plane. Color intensity encodes value.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Basic Voronoi', '8 regions', c => Voronoi(c, { theme: theme(), data: DATA.voronoi })],
        ['Dense Voronoi', '12 regions', c => Voronoi(c, { theme: theme(), data: { labels: ['A','B','C','D','E','F','G','H','I','J','K','L'], series: [{ name: 'Val', values: [90,45,70,30,85,55,65,40,75,50,60,35] }] } })],
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
    id: 'wordcloud', name: 'Word Cloud', icon: '\u2601', group: 'Charts',
    render(main) {
      main.appendChild(section('Word Cloud', 'Words sized by frequency. Spiral placement with collision detection.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Tech Stack', '12 words', c => WordCloud(c, { theme: theme(), data: DATA.wordcloud })],
        ['Buzz Words', 'Marketing terms', c => WordCloud(c, { theme: theme(), data: { labels: ['AI', 'Cloud', 'DevOps', 'Agile', 'Blockchain', 'IoT', 'SaaS', 'API', 'Microservices', 'Kubernetes'], series: [{ name: 'Frequency', values: [95, 80, 70, 65, 40, 55, 75, 60, 50, 45] }] } })],
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
      main.appendChild(section('Graph / Network', 'Rich node-link diagrams with shapes, layouts, edge styles, and arrows.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        // 1. Flowchart — hierarchical TB with rich nodes
        ['Flowchart (Hierarchical)', 'Top-down flow with mixed shapes', c => Graph(c, {
          theme: theme(), data: { series: [], labels: [] } as any,
          layout: 'hierarchical', direction: 'TB', edgeStyle: 'curved',
          nodes: [
            { id: 'start', label: 'Start', shape: 'stadium', color: '#10b981' },
            { id: 'input', label: 'User Input', shape: 'rect' },
            { id: 'validate', label: 'Valid?', shape: 'diamond', color: '#f59e0b' },
            { id: 'process', label: 'Process Data', shape: 'rect' },
            { id: 'error', label: 'Show Error', shape: 'hexagon', color: '#ef4444' },
            { id: 'save', label: 'Save to DB', shape: 'rect' },
            { id: 'done', label: 'Done', shape: 'stadium', color: '#10b981' },
          ],
          edges: [
            { source: 'start', target: 'input', label: 'begin' },
            { source: 'input', target: 'validate' },
            { source: 'validate', target: 'process', label: 'yes' },
            { source: 'validate', target: 'error', label: 'no', style: 'dashed', color: '#ef4444' },
            { source: 'error', target: 'input', style: 'dotted' },
            { source: 'process', target: 'save' },
            { source: 'save', target: 'done' },
          ],
        } as any)],
        // 2. Dependency graph — circular layout
        ['Dependency Graph (Circular)', 'Package dependencies in circular layout', c => Graph(c, {
          theme: theme(), data: { series: [], labels: [] } as any,
          layout: 'circular', nodeShape: 'rect',
          nodes: [
            { id: 'core', label: '@app/core', shape: 'hexagon', color: '#6366f1' },
            { id: 'ui', label: '@app/ui', shape: 'rect' },
            { id: 'api', label: '@app/api', shape: 'rect' },
            { id: 'auth', label: '@app/auth', shape: 'diamond', color: '#f59e0b' },
            { id: 'db', label: '@app/db', shape: 'rect' },
            { id: 'utils', label: '@app/utils', shape: 'stadium' },
            { id: 'config', label: '@app/config', shape: 'circle' },
          ],
          edges: [
            { source: 'ui', target: 'core' },
            { source: 'api', target: 'core' },
            { source: 'api', target: 'db' },
            { source: 'api', target: 'auth' },
            { source: 'auth', target: 'core' },
            { source: 'auth', target: 'db' },
            { source: 'db', target: 'config' },
            { source: 'core', target: 'utils' },
            { source: 'core', target: 'config' },
            { source: 'ui', target: 'utils' },
          ],
        } as any)],
        // 3. Network — force layout with mixed shapes
        ['Social Network (Force)', 'Mixed shapes with force layout', c => Graph(c, {
          theme: theme(), data: { series: [], labels: [] } as any,
          layout: 'force', iterations: 150,
          nodes: [
            { id: 'alice', label: 'Alice', shape: 'circle', color: '#ec4899' },
            { id: 'bob', label: 'Bob', shape: 'circle', color: '#3b82f6' },
            { id: 'charlie', label: 'Charlie', shape: 'circle', color: '#10b981' },
            { id: 'diana', label: 'Diana', shape: 'circle', color: '#f59e0b' },
            { id: 'eve', label: 'Eve', shape: 'circle', color: '#8b5cf6' },
            { id: 'frank', label: 'Frank', shape: 'circle', color: '#06b6d4' },
            { id: 'server', label: 'Server', shape: 'hexagon', color: '#6366f1' },
          ],
          edges: [
            { source: 'alice', target: 'bob', label: 'friends' },
            { source: 'alice', target: 'charlie' },
            { source: 'bob', target: 'diana' },
            { source: 'charlie', target: 'diana' },
            { source: 'diana', target: 'eve' },
            { source: 'eve', target: 'frank' },
            { source: 'frank', target: 'alice' },
            { source: 'alice', target: 'server', style: 'dashed' },
            { source: 'bob', target: 'server', style: 'dashed' },
            { source: 'eve', target: 'server', style: 'dashed' },
          ],
        } as any)],
        // 4. Backward compat — arrow notation (existing format)
        ['Arrow Notation (Legacy)', 'Backward-compatible arrow format', c => Graph(c, { theme: theme(), data: DATA.graph })],
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

  {
    id: 'geo', name: 'GEO/Map', icon: '\u{1F30D}', group: 'Charts',
    render(main) {
      main.appendChild(section('GEO / Map Chart', 'Choropleth maps with region-based data visualization.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['World GDP', 'Choropleth with data labels and color legend', c => Geo(c, { theme: theme(), data: DATA.geo, regions: WORLD_SIMPLE } as any)],
        ['Zoom & Pan', 'Scroll to zoom, drag to pan', c => Geo(c, { theme: theme(), data: DATA.geo, regions: WORLD_SIMPLE, zoom: true, pan: true } as any)],
        ['Scatter Overlay', 'Population bubbles on choropleth', c => Geo(c, { theme: theme(), data: DATA.geo, regions: WORLD_SIMPLE, scatterSeries: 1 } as any)],
        ['Red Palette', 'Custom color scheme', c => Geo(c, { theme: theme(), data: DATA.geo, regions: WORLD_SIMPLE, colors: ['#ef4444'] } as any)],
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
    id: 'lines-flow', name: 'Lines', icon: '\u27A1', group: 'Charts',
    render(main) {
      main.appendChild(section('Lines / Flow Chart', 'Curved connection lines between named points.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Flight Routes', 'Auto-positioned circular layout', c => Lines(c, { theme: theme(), data: DATA.lines })],
        ['Without Arrows', 'Flow lines only', c => Lines(c, { theme: theme(), data: DATA.lines, showArrows: false } as any)],
        ['High Curvature', 'curvature: 0.6', c => Lines(c, { theme: theme(), data: DATA.lines, curvature: 0.6 } as any)],
        ['Explicit Positions', 'Manual point placement', c => Lines(c, { theme: theme(), data: { labels: [], series: [{ name: 'A \u2192 B', values: [80] },{ name: 'B \u2192 C', values: [60] },{ name: 'C \u2192 A', values: [40] }] }, points: [{name:'A',x:0.2,y:0.3},{name:'B',x:0.8,y:0.2},{name:'C',x:0.5,y:0.8}] } as any)],
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
    id: 'matrix', name: 'Matrix', icon: '\u25A6', group: 'Charts',
    render(main) {
      main.appendChild(section('Matrix Chart', 'Grid layout with color-coded cells for correlation and confusion matrices.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Correlation Matrix', 'Subject correlations', c => Matrix(c, { theme: theme(), data: DATA.matrix })],
        ['Confusion Matrix', 'ML predictions', c => Matrix(c, { theme: theme(), data: {
          labels: ['Cat','Dog','Bird'],
          series: [
            { name: 'Cat', values: [85,10,5] },
            { name: 'Dog', values: [12,80,8] },
            { name: 'Bird', values: [3,7,90] },
          ],
        } })],
        ['Diverging Scale', 'Positive/negative', c => Matrix(c, { theme: theme(), data: {
          labels: ['A','B','C','D'],
          series: [
            { name: 'A', values: [1,-0.5,0.3,-0.8] },
            { name: 'B', values: [-0.5,1,0.6,-0.2] },
            { name: 'C', values: [0.3,0.6,1,-0.4] },
            { name: 'D', values: [-0.8,-0.2,-0.4,1] },
          ],
        }, colorScale: 'diverging' } as any)],
        ['Large Matrix', '8\u00D78 grid', c => Matrix(c, { theme: theme(), data: {
          labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Avg'],
          series: ['Q1','Q2','Q3','Q4','H1','H2','Annual','YoY'].map((name, i) => ({
            name, values: Array.from({length:8}, (_,j) => Math.round((Math.sin(i*j+i)+1)*50))
          })),
        } })],
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
    id: 'custom', name: 'Custom', icon: '\u270E', group: 'Charts',
    render(main) {
      main.appendChild(section('Custom Chart', 'User-defined rendering via options.renderFn callback.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => ChartInstance][] = [
        ['Custom Bars', 'Hand-drawn rounded bars', c => Custom(c, { theme: theme(), data: DATA.custom, renderFn: (ctx: any) => {
          const { area } = ctx; const vals = ctx.data.series[0]?.values ?? []; const max = Math.max(...vals, 1); const nodes: any[] = [];
          for (let i = 0; i < vals.length; i++) {
            const bw = 40; const gap = 15; const x = area.x + 30 + i * (bw + gap);
            const h = (vals[i] / max) * (area.height - 40);
            nodes.push({ type: 'rect', x, y: area.y + area.height - 20 - h, width: bw, height: h, attrs: { fill: ctx.options.colors[i % ctx.options.colors.length], rx: 8, ry: 8 } });
          } return nodes;
        } } as any)],
        ['Custom Circles', 'Proportional circles', c => Custom(c, { theme: theme(), data: DATA.custom, renderFn: (ctx: any) => {
          const { area } = ctx; const vals = ctx.data.series[0]?.values ?? []; const max = Math.max(...vals, 1); const nodes: any[] = [];
          const cx = area.x + area.width / 2; const cy = area.y + area.height / 2;
          for (let i = 0; i < vals.length; i++) {
            const r = 10 + (vals[i] / max) * 50; const angle = (i / vals.length) * Math.PI * 2 - Math.PI / 2;
            const px = cx + 80 * Math.cos(angle); const py = cy + 80 * Math.sin(angle);
            nodes.push({ type: 'circle', cx: px, cy: py, r, attrs: { fill: ctx.options.colors[i % ctx.options.colors.length], fillOpacity: 0.7 } });
          } return nodes;
        } } as any)],
        ['Placeholder', 'No renderFn — shows default', c => Custom(c, { theme: theme(), data: DATA.custom })],
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

  // -- Interactive Trading Dashboard --
  {
    id: 'interactive', name: 'Interactive', icon: '\u21D4', group: 'Features',
    render(main) {
      main.appendChild(section(
        'Interactive Trading Dashboard',
        'Linked candlestick, volume, and RSI charts with zoom (scroll), pan (drag), crosshair (both axes), data zoom slider, brush selection (Shift+drag), and keyboard reset.',
      ))

      // =================================================================
      // Synthetic 90-day AAPL-like price data (~60 trading days)
      // =================================================================
      const DAYS = 90
      const labels: string[] = []
      const open: number[] = []
      const high: number[] = []
      const low: number[] = []
      const close: number[] = []
      const vol: number[] = []

      let price = 185
      for (let i = 0; i < DAYS; i++) {
        const d = new Date(2025, 0, 6 + i)
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
        const o = +(price + (Math.random() - 0.48) * 2).toFixed(2)
        const c = +(o + (Math.random() - 0.45) * 4).toFixed(2)
        const h2 = +(Math.max(o, c) + Math.random() * 3).toFixed(2)
        const l2 = +(Math.min(o, c) - Math.random() * 3).toFixed(2)
        open.push(o); close.push(c); high.push(h2); low.push(l2)
        vol.push(Math.round(20 + Math.random() * 60))
        price = c
      }

      // Compute indicators
      const sma20 = sma(close, 20)
      const ema10 = ema(close, 10)
      const rsi14 = rsi(close, 14)
      const volDirs = volumeDirections(close)

      // Full data objects (for data zoom filtering)
      const fullPriceData: ChartData = {
        labels,
        series: [
          { name: 'AAPL', values: close },
          { name: 'SMA(20)', values: sma20 },
          { name: 'EMA(10)', values: ema10 },
        ],
      }
      const fullVolData: ChartData = {
        labels,
        series: [{ name: 'Volume (M)', values: vol }],
      }
      const fullRsiData: ChartData = {
        labels,
        series: [{ name: 'RSI(14)', values: rsi14 }],
      }

      // =================================================================
      // Layout: stacked panels in a single column
      // =================================================================
      const dashboard = h('div', 'space-y-2')

      // --- Price Chart (Candlestick + SMA + EMA) ---
      const priceWrap = h('div', 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden')
      const priceHeader = h('div', 'px-4 pt-3 pb-1')
      priceHeader.appendChild(Object.assign(h('h3', 'text-sm font-semibold'), { textContent: 'AAPL — Price + SMA(20) + EMA(10)' }))
      priceHeader.appendChild(Object.assign(h('p', 'text-xs text-gray-400 mt-0.5'), { textContent: 'Scroll to zoom, drag to pan, Shift+drag to select range' }))
      priceWrap.appendChild(priceHeader)
      const priceContainer = h('div', 'px-2 pb-2')
      priceContainer.style.height = '350px'
      priceWrap.appendChild(priceContainer)
      dashboard.appendChild(priceWrap)

      // --- Volume Chart ---
      const volWrap = h('div', 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden')
      const volHeader = h('div', 'px-4 pt-2 pb-1')
      volHeader.appendChild(Object.assign(h('h3', 'text-xs font-semibold text-gray-500'), { textContent: 'Volume' }))
      volWrap.appendChild(volHeader)
      const volContainer = h('div', 'px-2 pb-2')
      volContainer.style.height = '120px'
      volWrap.appendChild(volContainer)
      dashboard.appendChild(volWrap)

      // --- DataZoom Slider ---
      const zoomWrap = h('div', 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3')
      dashboard.appendChild(zoomWrap)

      // --- RSI Chart ---
      const rsiWrap = h('div', 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden')
      const rsiHeader = h('div', 'px-4 pt-2 pb-1')
      rsiHeader.appendChild(Object.assign(h('h3', 'text-xs font-semibold text-gray-500'), { textContent: 'RSI(14) — Overbought > 70, Oversold < 30' }))
      rsiWrap.appendChild(rsiHeader)
      const rsiContainer = h('div', 'px-2 pb-2')
      rsiContainer.style.height = '150px'
      rsiWrap.appendChild(rsiContainer)
      dashboard.appendChild(rsiWrap)

      main.appendChild(dashboard)

      // =================================================================
      // Create charts (deferred so containers have dimensions)
      // =================================================================
      requestAnimationFrame(() => {
        let priceChart: ChartInstance | null = null
        let volChart: ChartInstance | null = null
        let rsiChart: ChartInstance | null = null
        try {
          priceChart = Candlestick(priceContainer, {
            theme: theme(),
            data: fullPriceData,
            ohlc: { open, high, low, close },
            legend: true,
            zoom: true,
            pan: true,
            brush: true,
            crosshair: { enabled: true, mode: 'both' },
          } as any)
          mount(main, priceChart)

          volChart = Volume(volContainer, {
            theme: theme(),
            data: fullVolData,
            directions: volDirs,
            zoom: true,
            pan: true,
            crosshair: true,
            xAxis: false,
          } as any)
          mount(main, volChart)

          rsiChart = Line(rsiContainer, {
            theme: theme(),
            data: fullRsiData,
            yMin: 0,
            yMax: 100,
            colors: ['#8b5cf6'],
            zoom: true,
            pan: true,
            crosshair: true,
          })
          mount(main, rsiChart)

          // Link crosshairs across all 3 charts
          linkCharts(priceChart, volChart, rsiChart)

          // DataZoom slider widget
          const widget = createDataZoomWidget({
            data: fullPriceData,
            height: 44,
            onChange: (range) => {
              const pd = applyDataZoom(fullPriceData, range)
              const vd = applyDataZoom(fullVolData, range)
              const rd = applyDataZoom(fullRsiData, range)
              priceChart?.setData(pd)
              volChart?.setData(vd)
              rsiChart?.setData(rd)
            },
          })
          zoomWrap.appendChild(widget.element)

          // --- Controls bar ---
          const { el: logEl, log } = logBox()

          const controls = controlBar(
            btn('Reset Zoom', () => {
              priceChart?.resetZoom()
              volChart?.resetZoom()
              rsiChart?.resetZoom()
              widget.state.reset()
              log('Zoom reset')
            }),
            btn('Zoom In', () => { widget.state.zoomIn(0.15); log('Zoomed in') }),
            btn('Zoom Out', () => { widget.state.zoomOut(0.15); log('Zoomed out') }),
          )
          main.appendChild(controls)

          // Event log
          priceChart.on('brush:end', (payload: unknown) => {
            const p = payload as { startLabel: string; endLabel: string; startIndex: number; endIndex: number }
            log(`Brush: ${p.startLabel} → ${p.endLabel} (indices ${p.startIndex}–${p.endIndex})`)
          })
          priceChart.on('zoom:change', () => log('Zoom changed'))
          priceChart.on('zoom:reset', () => log('Zoom reset'))

          main.appendChild(logEl)

          // Keyboard shortcuts legend
          const legend = h('div', 'mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400')
          legend.innerHTML = `
            <div class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Keyboard & Mouse Controls</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Scroll</kbd> Zoom in/out</div>
              <div><kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Drag</kbd> Pan left/right</div>
              <div><kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Shift+Drag</kbd> Brush select</div>
              <div><kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Dbl-click slider</kbd> Reset range</div>
            </div>
          `
          main.appendChild(legend)

        } catch (e) {
          const errEl = h('div', 'text-red-500 text-xs p-4')
          errEl.textContent = `Error: ${(e as Error).message}`
          main.appendChild(errEl)
        }
      })
    },
  },

  // -- GL Charts (3D / GPU-accelerated) --
  {
    id: 'gl-overview', name: 'GL Overview', icon: '\u25C6', group: 'GL Charts',
    render(main) {
      main.appendChild(section('WebGL 3D & GPU-Accelerated Charts', 'All 12 GL chart types — pure WebGL, no Three.js. Orbit with mouse drag, zoom with scroll.'))
      const g = grid(3)

      const allGL: [string, (el: HTMLElement) => GLChartInstance][] = [
        ['Scatter 3D', el => Scatter3D(el, { data: GL_DATA.scatter3d, theme: isDark ? 'dark' : 'light' })],
        ['Bar 3D', el => Bar3D(el, { data: GL_DATA.bar3d, theme: isDark ? 'dark' : 'light' })],
        ['Surface 3D', el => Surface3D(el, { data: GL_DATA.surface3d, theme: isDark ? 'dark' : 'light' })],
        ['Globe 3D', el => Globe3D(el, { data: GL_DATA.globe3d, theme: isDark ? 'dark' : 'light', orbit: { autoRotate: true, autoRotateSpeed: 0.5 } })],
        ['Map 3D', el => Map3D(el, { data: GL_DATA.map3d, theme: isDark ? 'dark' : 'light' })],
        ['Lines 3D', el => Lines3D(el, { data: GL_DATA.lines3d, theme: isDark ? 'dark' : 'light' })],
        ['Line 3D (Tube)', el => Line3D(el, { data: GL_DATA.line3d, theme: isDark ? 'dark' : 'light' })],
        ['Scatter GL (10K)', el => ScatterGL(el, { data: GL_DATA.scatterGL, theme: isDark ? 'dark' : 'light', pointSize: 3 })],
        ['Lines GL', el => LinesGL(el, { data: GL_DATA.linesGL, theme: isDark ? 'dark' : 'light' })],
        ['Flow GL', el => FlowGL(el, { data: { series: [] }, theme: isDark ? 'dark' : 'light', fieldType: 'wind', showArrows: false } as any)],
        ['Graph GL', el => GraphGL(el, { data: GL_DATA.graphGL, theme: isDark ? 'dark' : 'light' })],
        ['Torus 3D', el => Torus3D(el, { data: GL_DATA.torus3d, theme: isDark ? 'dark' : 'light', orbit: { autoRotate: true, autoRotateSpeed: 0.8 } })],
      ]

      for (const [name, factory] of allGL) {
        const { card, container } = chartCard(name, '', 'h-64')
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'scatter3d', name: 'Scatter 3D', icon: '\u25CF', group: 'GL Charts',
    render(main) {
      main.appendChild(section('3D Scatter Plot', 'GL_POINTS with SDF circles in 3D space. Drag to orbit, scroll to zoom.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Multi-Cluster', '2 series, 50 points each', c => Scatter3D(c, { data: GL_DATA.scatter3d, theme: isDark ? 'dark' : 'light' })],
        ['Large Points', 'pointSize: 12', c => Scatter3D(c, { data: GL_DATA.scatter3d, theme: isDark ? 'dark' : 'light', pointSize: 12 })],
        ['Auto-Rotate', 'Continuous rotation', c => Scatter3D(c, { data: GL_DATA.scatter3d, theme: isDark ? 'dark' : 'light', orbit: { autoRotate: true, autoRotateSpeed: 2 } })],
        ['Light Theme', 'Light background', c => Scatter3D(c, { data: GL_DATA.scatter3d, theme: 'light' })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'bar3d', name: 'Bar 3D', icon: '\u2587', group: 'GL Charts',
    render(main) {
      main.appendChild(section('3D Bar Chart', 'Phong-lit cuboid meshes with animated height. Drag to orbit.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Default', '2 rows x 5 bars', c => Bar3D(c, { data: GL_DATA.bar3d, theme: isDark ? 'dark' : 'light' })],
        ['Wide Bars', 'barWidth: 0.9', c => Bar3D(c, { data: GL_DATA.bar3d, theme: isDark ? 'dark' : 'light', barWidth: 0.9 })],
        ['Auto-Rotate', 'Spinning view', c => Bar3D(c, { data: GL_DATA.bar3d, theme: isDark ? 'dark' : 'light', orbit: { autoRotate: true } })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'surface3d', name: 'Surface 3D', icon: '\u2248', group: 'GL Charts',
    render(main) {
      main.appendChild(section('3D Surface Plot', 'Grid heightmap mesh with computed normals and height-based colormap.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Sine Wave', 'sin(x) * cos(z)', c => Surface3D(c, { data: GL_DATA.surface3d, theme: isDark ? 'dark' : 'light' })],
        ['Wireframe', 'wireframe: true', c => Surface3D(c, { data: GL_DATA.surface3d, theme: isDark ? 'dark' : 'light', wireframe: true })],
        ['Ripple', 'Radial ripple function', c => Surface3D(c, { data: {
          series: [], grid: Array.from({length: 40}, (_, r) =>
            Array.from({length: 40}, (_, c) => {
              const x = (c / 39) * 6 - 3, z = (r / 39) * 6 - 3
              const d = Math.sqrt(x * x + z * z)
              return Math.sin(d * 3) / (d + 0.5) * 5
            })
          ),
        }, theme: isDark ? 'dark' : 'light' })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'globe3d', name: 'Globe 3D', icon: '\uD83C\uDF10', group: 'GL Charts',
    render(main) {
      main.appendChild(section('3D Globe', 'Atmosphere glow, graticule grid, labeled data points. Orbit with mouse, zoom with scroll.'))
      const g = grid(2)
      const t = isDark ? 'dark' as const : 'light' as const
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['World Cities', '12 cities, 2 series with labels', c => Globe3D(c, { data: GL_DATA.globe3d, theme: t })],
        ['Static View', 'No auto-rotate, orbit manually', c => Globe3D(c, { data: GL_DATA.globe3d, theme: t, orbit: { autoRotate: false } })],
        ['Single Series', 'Population only', c => Globe3D(c, { data: {
          series: [GL_DATA.globe3d.series[0]!] as GLSeries3D[],
          categories: GL_DATA.globe3d.categories,
        }, theme: t })],
        ['Light Theme', 'Light background globe', c => Globe3D(c, { data: GL_DATA.globe3d, theme: 'light' })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'scatter-gl', name: 'Scatter GL', icon: '\u2022', group: 'GL Charts',
    render(main) {
      main.appendChild(section('GPU-Accelerated 2D Scatter', 'Axes, grid, legend, density glow. Spatial grid hit testing for millions of points.'))
      const g = grid(2)
      const t = isDark ? 'dark' as const : 'light' as const
      // Gaussian helper for demo data
      const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
      const cluster = (cx: number, cy: number, spread: number, n: number) => ({
        x: Array.from({length: n}, () => cx + gauss() * spread),
        y: Array.from({length: n}, () => cy + gauss() * spread),
      })
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Gaussian Clusters', '3 groups, 12K points', c => ScatterGL(c, { data: GL_DATA.scatterGL, theme: t, pointSize: 3 })],
        ['Density Glow', 'Overlapping clusters glow brighter', c => {
          const c1 = cluster(50, 50, 15, 8000), c2 = cluster(50, 50, 5, 4000)
          return ScatterGL(c, { data: { series: [
            { name: 'Spread', ...c1 },
            { name: 'Dense Core', ...c2 },
          ] }, theme: t, pointSize: 4 })
        }],
        ['Correlation', 'Linear trend + noise', c => {
          const n = 6000
          return ScatterGL(c, { data: { series: [{
            name: 'Measurement',
            x: Array.from({length: n}, (_, i) => i / n * 100),
            y: Array.from({length: n}, (_, i) => (i / n) * 80 + 10 + gauss() * 12),
          }] }, theme: t, pointSize: 3 })
        }],
        ['50K Stress Test', 'Single series, tiny points', c => {
          const n = 50000
          return ScatterGL(c, { data: { series: [{
            name: 'Random',
            x: Array.from({length: n}, () => Math.random() * 200),
            y: Array.from({length: n}, () => Math.random() * 200),
          }] }, theme: t, pointSize: 2 })
        }],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'flow-gl', name: 'Flow GL', icon: '\u2248', group: 'GL Charts',
    render(main) {
      main.appendChild(section('Particle Flow Field', 'GPU-accelerated vector field visualization. Particles colored by velocity, sized by speed, with direction arrows.'))
      const g = grid(2)
      const t = isDark ? 'dark' as const : 'light' as const
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Wind Pattern', 'Directional flow with gusts', c => FlowGL(c, { data: { series: [] }, theme: t, fieldType: 'wind', particleCount: 6000, pointSize: 4 } as any)],
        ['Vortex System', 'Spiraling inward pull', c => FlowGL(c, { data: { series: [] }, theme: t, fieldType: 'vortex', particleCount: 8000, pointSize: 3, colorSlow: '#6366f1', colorMid: '#a78bfa', colorFast: '#f472b6' } as any)],
        ['Source & Sink', 'Two sources, one drain', c => FlowGL(c, { data: { series: [] }, theme: t, fieldType: 'source', particleCount: 6000, pointSize: 4, colorSlow: '#065f46', colorMid: '#10b981', colorFast: '#fbbf24' } as any)],
        ['Turbulence', 'Chaotic multi-frequency field', c => FlowGL(c, { data: { series: [] }, theme: t, fieldType: 'turbulence', particleCount: 10000, pointSize: 3, ageSpeed: 0.004 } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'graph-gl', name: 'Graph GL', icon: '\u25CB', group: 'GL Charts',
    render(main) {
      main.appendChild(section('Force-Directed Graph (GL)', 'Barnes-Hut optimized force layout with WebGL rendering. Nodes settle over time.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['30 Nodes', 'Random connections', c => GraphGL(c, { data: GL_DATA.graphGL, theme: isDark ? 'dark' : 'light' })],
        ['Large Points', 'pointSize: 10', c => GraphGL(c, { data: GL_DATA.graphGL, theme: isDark ? 'dark' : 'light', pointSize: 10 })],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'torus3d', name: 'Torus 3D', icon: '\u25CE', group: 'GL Charts',
    render(main) {
      main.appendChild(section('Torus 3D', 'Sine-modulated cylinder creating stacked-torus appearance. Each ring represents a data value. Configurable intensity and frequency.'))
      const g = grid(2)
      const items: [string, string, (c: HTMLElement) => GLChartInstance][] = [
        ['Default', 'intensity: 1, frequency: 1', c => Torus3D(c, {
          data: GL_DATA.torus3d, theme: isDark ? 'dark' : 'light',
          orbit: { autoRotate: true, autoRotateSpeed: 0.8 },
          intensity: 1, frequency: 1,
        } as any)],
        ['High Frequency', 'frequency: 3', c => Torus3D(c, {
          data: GL_DATA.torus3d, theme: isDark ? 'dark' : 'light',
          orbit: { autoRotate: true, autoRotateSpeed: 0.5 },
          intensity: 1, frequency: 3,
        } as any)],
        ['High Intensity', 'intensity: 2', c => Torus3D(c, {
          data: GL_DATA.torus3d, theme: isDark ? 'dark' : 'light',
          orbit: { autoRotate: true, autoRotateSpeed: 0.5 },
          intensity: 2, frequency: 1,
        } as any)],
        ['Dense Rings', '10 data points, freq: 2', c => Torus3D(c, {
          data: { series: [{ name: 'KPI', values: [90, 35, 68, 80, 45, 72, 55, 88, 40, 65] }], categories: ['A','B','C','D','E','F','G','H','I','J'] },
          theme: isDark ? 'dark' : 'light',
          orbit: { autoRotate: true, autoRotateSpeed: 0.6 },
          intensity: 0.8, frequency: 2,
        } as any)],
      ]
      for (const [title, desc, factory] of items) {
        const { card, container } = chartCard(title, desc)
        g.appendChild(card)
        requestAnimationFrame(() => { try { mountGL(main, factory(container)) } catch (e) { container.innerHTML = `<div class="text-red-500 text-xs p-2">${(e as Error).message}</div>` } })
      }
      main.appendChild(g)
    },
  },
  {
    id: 'torus', name: 'Torus', icon: '\u25CE', group: 'Charts',
    render(main) {
      main.appendChild(section('Torus Chart (2D)', 'SVG silhouette of a sine-modulated cylinder. Each ring segment colored by data value. Supports vertical and horizontal orientations.'))
      const g = grid(2)
      const items: [string, string, () => ChartInstance][] = [
        ['Vertical', 'Default orientation', () => {
          const { card, container } = chartCard('Vertical', 'intensity: 1, frequency: 1')
          g.appendChild(card)
          return Torus(container, { theme: theme(), data: DATA.torus, intensity: 1, frequency: 1 } as any)
        }],
        ['Horizontal', 'orientation: horizontal', () => {
          const { card, container } = chartCard('Horizontal', 'orientation: horizontal')
          g.appendChild(card)
          return Torus(container, { theme: theme(), data: DATA.torus, intensity: 1, frequency: 1, orientation: 'horizontal' } as any)
        }],
        ['High Frequency', 'frequency: 3', () => {
          const { card, container } = chartCard('High Frequency', 'frequency: 3')
          g.appendChild(card)
          return Torus(container, { theme: theme(), data: DATA.torus, intensity: 1, frequency: 3 } as any)
        }],
        ['Intense', 'intensity: 2, freq: 2', () => {
          const { card, container } = chartCard('Intense', 'intensity: 2, frequency: 2')
          g.appendChild(card)
          return Torus(container, { theme: theme(), data: DATA.torus, intensity: 2, frequency: 2 } as any)
        }],
      ]
      for (const [, , factory] of items) {
        requestAnimationFrame(() => { try { mount(main, factory()) } catch (e) { console.error(e) } })
      }
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
  footer.textContent = `@chartts/core + @chartts/gl v0.1.0 \u2022 ${pages.length} pages \u2022 49 chart types`
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
