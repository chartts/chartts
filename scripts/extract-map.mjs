import { readFileSync, writeFileSync } from 'fs'

const svg = readFileSync('C:/Users/azaru/Downloads/world.svg', 'utf8')

// Extract viewBox
const vbMatch = svg.match(/viewbox="([^"]+)"/i)
console.log('ViewBox:', vbMatch?.[1])

// Extract all paths with id/name and class/name
const pathRegex = /<path\s+([^>]*)\/?>/gi
let match
const countries = new Map() // name -> {id, paths[]}

while ((match = pathRegex.exec(svg)) !== null) {
  const attrs = match[1]
  const nameMatch = attrs.match(/name="([^"]*)"/)
  const classMatch = attrs.match(/class="([^"]*)"/)
  const idMatch = attrs.match(/id="([^"]*)"/)
  const dMatch = attrs.match(/d="([^"]*)"/)

  const name = nameMatch?.[1] || classMatch?.[1] || ''
  const id = idMatch?.[1] || ''
  const d = dMatch?.[1] || ''

  if (!name || !d) continue

  if (!countries.has(name)) countries.set(name, { id, paths: [] })
  countries.get(name).paths.push(d)
}

console.log('Total countries:', countries.size)

// Simplify paths - round all numbers to integers
function simplifyPath(d) {
  return d.replace(/(\d+)\.\d+/g, '$1')
}

// Build entries
const entries = []
for (const [name, data] of countries) {
  const mergedPath = data.paths.join('')
  entries.push({ name, id: data.id, path: mergedPath, size: mergedPath.length })
}

// --- FULL WORLD REGIONS (all 220 countries) ---
// Sort alphabetically for the full export
const allEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name))

let fullOutput = `/**
 * World map region paths — ALL ${allEntries.length} countries.
 * Extracted from Simplemaps.com world.svg (MIT License).
 * Copyright (c) 2020 Pareto Software, LLC DBA Simplemaps.com
 *
 * Coordinate space: viewBox="0 0 2000 857"
 * Coordinates rounded to integers for smaller bundle size.
 *
 * Import this from '@chartts/core/geo' for tree-shaking, or use
 * WORLD_SIMPLE from geo-type.ts for a lighter ~30 country subset.
 */

import type { GeoRegion } from './geo-type'

export const WORLD_REGIONS: GeoRegion[] = [\n`

for (const e of allEntries) {
  const simplified = simplifyPath(e.path)
  fullOutput += `  { name: '${e.name.replace(/'/g, "\\'")}', path: '${simplified}' },\n`
}
fullOutput += `]\n`

writeFileSync('packages/core/src/charts/geo/world-regions.ts', fullOutput)

// --- SIMPLE WORLD (top ~30 major countries by significance) ---
const majorCountries = new Set([
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile',
  'United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Poland', 'Sweden', 'Norway',
  'Russian Federation', 'Ukraine', 'Turkey',
  'China', 'India', 'Japan', 'Republic of Korea', 'Indonesia', 'Thailand', 'Vietnam',
  'Australia', 'New Zealand',
  'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Ethiopia', 'Algeria', 'Morocco',
  'Saudi Arabia', 'Iran', 'Iraq', 'Pakistan',
])

const simpleEntries = entries
  .filter(e => majorCountries.has(e.name))
  .sort((a, b) => a.name.localeCompare(b.name))

console.log('\nMajor countries found:', simpleEntries.length)
console.log('Missing:', [...majorCountries].filter(n => !simpleEntries.find(e => e.name === n)))

const simpleSize = simpleEntries.reduce((sum, e) => sum + simplifyPath(e.path).length, 0)
const fullSize = allEntries.reduce((sum, e) => sum + simplifyPath(e.path).length, 0)

console.log('\nFull WORLD_REGIONS:', allEntries.length, 'countries, ~' + Math.round(fullSize / 1024) + 'KB path data')
console.log('WORLD_SIMPLE:', simpleEntries.length, 'countries, ~' + Math.round(simpleSize / 1024) + 'KB path data')

// Update the WORLD_SIMPLE in geo-type.ts
// We'll just output the array for manual insertion
let simpleOutput = '// --- Generated WORLD_SIMPLE (~' + simpleEntries.length + ' major countries) ---\n'
simpleOutput += 'export const WORLD_SIMPLE: GeoRegion[] = [\n'
for (const e of simpleEntries) {
  const simplified = simplifyPath(e.path)
  simpleOutput += `  { name: '${e.name.replace(/'/g, "\\'")}', path: '${simplified}' },\n`
}
simpleOutput += ']\n'

writeFileSync('packages/core/src/charts/geo/world-simple-generated.ts.tmp', simpleOutput)

console.log('\nGenerated world-simple to: world-simple-generated.ts.tmp')
console.log('Generated world-regions to: world-regions.ts')
