import { describe, it, expect } from 'vitest'
import { resolveTheme } from '../engine'
import { LIGHT_THEME, DARK_THEME } from '../../constants'

describe('resolveTheme', () => {
  it('returns light theme', () => {
    const theme = resolveTheme('light')
    expect(theme).toEqual(LIGHT_THEME)
  })

  it('returns dark theme', () => {
    const theme = resolveTheme('dark')
    expect(theme).toEqual(DARK_THEME)
  })

  it('auto returns a valid theme', () => {
    const theme = resolveTheme('auto')
    expect(theme.colors).toBeTruthy()
    expect(theme.textColor).toBeTruthy()
    expect(theme.gridColor).toBeTruthy()
  })

  it('merges custom theme with light defaults', () => {
    const theme = resolveTheme({ colors: ['#ff0000'] } as any)
    expect(theme.colors).toEqual(['#ff0000'])
    expect(theme.fontFamily).toBe(LIGHT_THEME.fontFamily)
  })

  it('light theme has all required fields', () => {
    const required = [
      'colors', 'background', 'textColor', 'textMuted', 'axisColor',
      'gridColor', 'tooltipBackground', 'tooltipText', 'tooltipBorder',
      'fontFamily', 'fontSize', 'fontSizeSmall', 'fontSizeLarge',
      'borderRadius', 'gridStyle', 'gridWidth', 'axisWidth',
      'pointRadius', 'lineWidth',
    ]
    for (const field of required) {
      expect(LIGHT_THEME).toHaveProperty(field)
    }
  })

  it('dark theme has all required fields', () => {
    const required = [
      'colors', 'background', 'textColor', 'textMuted', 'axisColor',
      'gridColor', 'tooltipBackground', 'tooltipText', 'tooltipBorder',
    ]
    for (const field of required) {
      expect(DARK_THEME).toHaveProperty(field)
    }
  })
})
