import type { ChartData, Series } from '../types'

/**
 * Dataset — data transformation utilities for filtering, sorting, and
 * aggregating chart data before rendering.
 */

type Labels = ChartData['labels']

function getLabels(data: ChartData): NonNullable<Labels> {
  return data.labels ?? []
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

/** Filter series by a predicate on values. */
export function filterData(
  data: ChartData,
  predicate: (value: number, index: number, seriesIndex: number) => boolean,
): ChartData {
  const labels = getLabels(data)
  const keepIndices = labels
    .map((_: unknown, i: number) =>
      data.series.some((s, si) => predicate(s.values[i] ?? 0, i, si)) ? i : -1,
    )
    .filter((i: number) => i >= 0)

  return {
    ...data,
    series: data.series.map((s, si) => ({
      ...s,
      values: s.values.filter((v, i) => predicate(v, i, si)),
    })),
    labels: keepIndices.map((i: number) => (labels as unknown[])[i]) as Labels,
  }
}

/** Filter to keep only specific series by name or index. */
export function filterSeries(
  data: ChartData,
  keep: (string | number)[],
): ChartData {
  return {
    ...data,
    series: data.series.filter((s, i) =>
      keep.includes(s.name) || keep.includes(i),
    ),
  }
}

/** Filter to keep only specific labels/categories. */
export function filterLabels(
  data: ChartData,
  keep: (string | number | Date)[],
): ChartData {
  const labels = getLabels(data)
  const keepSet = new Set(keep.map(String))
  const indices = (labels as unknown[])
    .map((l, i) => keepSet.has(String(l)) ? i : -1)
    .filter(i => i >= 0)

  return {
    ...data,
    labels: indices.map(i => (labels as unknown[])[i]) as Labels,
    series: data.series.map(s => ({
      ...s,
      values: indices.map(i => s.values[i] ?? 0),
    })),
  }
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

/** Sort data by label or by a specific series' values. */
export function sortData(
  data: ChartData,
  by: 'label' | number,
  direction: 'asc' | 'desc' = 'asc',
): ChartData {
  const labels = getLabels(data)
  const indices = (labels as unknown[]).map((_: unknown, i: number) => i)
  const dir = direction === 'asc' ? 1 : -1

  if (by === 'label') {
    indices.sort((a, b) => dir * String((labels as unknown[])[a]).localeCompare(String((labels as unknown[])[b])))
  } else {
    const series = data.series[by]
    if (series) {
      indices.sort((a, b) => dir * ((series.values[a] ?? 0) - (series.values[b] ?? 0)))
    }
  }

  return {
    ...data,
    labels: indices.map(i => (labels as unknown[])[i]) as Labels,
    series: data.series.map(s => ({
      ...s,
      values: indices.map(i => s.values[i] ?? 0),
    })),
  }
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

type AggFn = 'sum' | 'avg' | 'min' | 'max' | 'count'

/** Aggregate all series values per label into a single series. */
export function aggregateData(
  data: ChartData,
  fn: AggFn = 'sum',
): ChartData {
  const labels = getLabels(data)
  const agg = getAggFn(fn)
  const values = (labels as unknown[]).map((_: unknown, i: number) => {
    const vals = data.series.map(s => s.values[i] ?? 0)
    return agg(vals)
  })

  return {
    ...data,
    series: [{ name: fn, values }],
  }
}

function getAggFn(fn: AggFn): (vals: number[]) => number {
  switch (fn) {
    case 'sum': return vals => vals.reduce((a, b) => a + b, 0)
    case 'avg': return vals => vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    case 'min': return vals => Math.min(...vals)
    case 'max': return vals => Math.max(...vals)
    case 'count': return vals => vals.filter(v => v !== 0).length
  }
}

// ---------------------------------------------------------------------------
// Transform pipeline
// ---------------------------------------------------------------------------

type TransformFn = (data: ChartData) => ChartData

/** Apply a chain of transforms to chart data. */
export function transformData(data: ChartData, ...transforms: TransformFn[]): ChartData {
  return transforms.reduce((d, fn) => fn(d), data)
}

// ---------------------------------------------------------------------------
// Pivot / transpose
// ---------------------------------------------------------------------------

/** Transpose rows and columns — series become labels and vice versa. */
export function pivotData(data: ChartData): ChartData {
  const labels = getLabels(data)
  const newLabels = data.series.map(s => s.name) as string[]
  const newSeries: Series[] = (labels as unknown[]).map((label: unknown, i: number) => ({
    name: String(label),
    values: data.series.map(s => s.values[i] ?? 0),
  }))

  return { labels: newLabels, series: newSeries }
}

// ---------------------------------------------------------------------------
// Slice / window
// ---------------------------------------------------------------------------

/** Take a slice of the data (for pagination or windowing). */
export function sliceData(data: ChartData, start: number, end?: number): ChartData {
  const labels = getLabels(data)
  return {
    ...data,
    labels: (labels as unknown[]).slice(start, end) as Labels,
    series: data.series.map(s => ({
      ...s,
      values: s.values.slice(start, end),
    })),
  }
}
