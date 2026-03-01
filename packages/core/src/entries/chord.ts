import { createConvenience } from '../api/factory'
import { chordChartType } from '../charts/chord/chord-type'

export const Chord = createConvenience(chordChartType)
export { chordChartType }
export * from './shared'
