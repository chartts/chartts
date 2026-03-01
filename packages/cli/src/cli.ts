import { Command } from 'commander'
import { readFile, writeFile } from 'fs/promises'
import { resolve, extname } from 'path'
import { CHART_TYPES } from '@chartts/core'
import { renderChart, renderToPNG } from '@chartts/ssr'
import { fromCSV } from '@chartts/csv'
import { fromJSON } from '@chartts/json'
import type { ChartData } from '@chartts/core'

const program = new Command()

program
  .name('chartts')
  .description('Command-line chart rendering for Chartts')
  .version('0.1.5')

program
  .command('render')
  .description('Render a chart from a data file')
  .requiredOption('--type <type>', 'Chart type (e.g. line, bar, pie, area, scatter)')
  .requiredOption('--data <file>', 'Path to data file (.csv or .json)')
  .requiredOption('-o, --output <file>', 'Output file path (.svg or .png)')
  .option('--width <n>', 'Chart width in pixels', '600')
  .option('--height <n>', 'Chart height in pixels', '400')
  .option('--theme <name>', 'Chart theme', 'light')
  .option('--x <field>', 'Field name for x-axis labels (JSON data)')
  .option('--y <field>', 'Field name for y-axis series (JSON data)')
  .option('--title <text>', 'Chart title / aria label')
  .option('--scale <n>', 'PNG scale factor', '2')
  .action(async (opts) => {
    try {
      await renderAction(opts)
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
      process.exit(1)
    }
  })

program
  .command('types')
  .description('List all available chart types')
  .action(() => {
    const types = Object.keys(CHART_TYPES)
    console.log('Available chart types:\n')
    for (const t of types) {
      console.log(`  ${t.toLowerCase().padEnd(20)} ${t}`)
    }
    console.log(`\nTotal: ${types.length} chart types`)
  })

interface RenderOptions {
  type: string
  data: string
  output: string
  width: string
  height: string
  theme: string
  x?: string
  y?: string
  title?: string
  scale: string
}

async function renderAction(opts: RenderOptions): Promise<void> {
  const width = parseInt(opts.width, 10)
  const height = parseInt(opts.height, 10)
  const scale = parseInt(opts.scale, 10)

  if (isNaN(width) || width <= 0) {
    throw new Error(`Invalid width: ${opts.width}`)
  }
  if (isNaN(height) || height <= 0) {
    throw new Error(`Invalid height: ${opts.height}`)
  }
  if (isNaN(scale) || scale <= 0) {
    throw new Error(`Invalid scale: ${opts.scale}`)
  }

  // Resolve chart type (case-insensitive lookup)
  const chartType = resolveChartType(opts.type)
  if (!chartType) {
    const available = Object.keys(CHART_TYPES).map(k => k.toLowerCase()).join(', ')
    throw new Error(`Unknown chart type "${opts.type}". Available: ${available}`)
  }

  // Read and parse data file
  const dataPath = resolve(opts.data)
  const ext = extname(dataPath).toLowerCase()
  const raw = await readFile(dataPath, 'utf-8')

  let data: ChartData
  if (ext === '.csv' || ext === '.tsv') {
    data = fromCSV(raw, {
      ...(opts.x ? { labelColumn: opts.x } : {}),
      ...(opts.y ? { seriesColumns: [opts.y] } : {}),
    })
  } else if (ext === '.json') {
    data = fromJSON(raw, {
      ...(opts.x ? { labelKey: opts.x } : {}),
      ...(opts.y ? { seriesKeys: [opts.y] } : {}),
    })
  } else {
    // Try JSON first, fall back to CSV
    try {
      data = fromJSON(raw, {
        ...(opts.x ? { labelKey: opts.x } : {}),
        ...(opts.y ? { seriesKeys: [opts.y] } : {}),
      })
    } catch {
      data = fromCSV(raw, {
        ...(opts.x ? { labelColumn: opts.x } : {}),
        ...(opts.y ? { seriesColumns: [opts.y] } : {}),
      })
    }
  }

  if (!data.series || data.series.length === 0) {
    throw new Error('No data series found in the input file')
  }

  // Render
  const outputPath = resolve(opts.output)
  const outputExt = extname(outputPath).toLowerCase()

  const chartOptions = {
    width,
    height,
    theme: opts.theme as 'light' | 'dark',
    ...(opts.title ? { ariaLabel: opts.title } : {}),
  }

  if (outputExt === '.png') {
    const png = await renderToPNG(chartType, data, {
      ...chartOptions,
      scale,
    })
    await writeFile(outputPath, png)
    console.log(`PNG saved to ${outputPath} (${width}x${height} @${scale}x)`)
  } else {
    // Default to SVG
    const svg = renderChart(chartType, data, chartOptions)
    await writeFile(outputPath, svg, 'utf-8')
    console.log(`SVG saved to ${outputPath} (${width}x${height})`)
  }
}

function resolveChartType(name: string) {
  // Direct match
  if (CHART_TYPES[name]) return CHART_TYPES[name]

  // Case-insensitive match
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(CHART_TYPES)) {
    if (key.toLowerCase() === lower) return value
  }

  // Kebab-case to PascalCase: "stacked-bar" -> "StackedBar"
  const pascal = lower
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  if (CHART_TYPES[pascal]) return CHART_TYPES[pascal]

  return null
}

program.parse()
