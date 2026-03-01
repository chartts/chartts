import type { ThemeConfig } from '@chartts/core'

// ---------------------------------------------------------------------------
// Helper — compact theme factory with sensible defaults
// ---------------------------------------------------------------------------

function theme(
  colors: string[],
  opts: Partial<ThemeConfig> & { textColor: string; textMuted: string; axisColor: string; gridColor: string },
): ThemeConfig {
  return {
    colors,
    background: 'transparent',
    tooltipBackground: opts.textColor,
    tooltipText: opts.gridColor,
    tooltipBorder: opts.axisColor,
    fontFamily: '"Inter", -apple-system, sans-serif',
    fontSize: 12,
    fontSizeSmall: 10,
    fontSizeLarge: 14,
    borderRadius: 6,
    gridStyle: 'solid',
    gridWidth: 1,
    axisWidth: 1,
    pointRadius: 3.5,
    lineWidth: 2,
    ...opts,
  }
}

// ---------------------------------------------------------------------------
// Neon — dark background, vivid neon accents, cyberpunk feel
// ---------------------------------------------------------------------------

export const neonTheme: ThemeConfig = {
  colors: [
    '#00fff5', '#ff00ff', '#39ff14', '#ff3131', '#ffff00',
    '#bf00ff', '#ff6600', '#00bfff', '#ff1493', '#7fff00',
  ],
  background: 'transparent',
  textColor: '#e0e0e0',
  textMuted: '#777777',
  axisColor: '#444444',
  gridColor: '#2a2a2a',
  tooltipBackground: '#1a1a2e',
  tooltipText: '#e0e0e0',
  tooltipBorder: '#444444',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 2,
  gridStyle: 'dotted',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Pastel — soft muted tones, gentle on the eyes
// ---------------------------------------------------------------------------

export const pastelTheme: ThemeConfig = {
  colors: [
    '#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b5eaea',
    '#ffb6b9', '#fae3d9', '#bbded6', '#61c0bf', '#f6c6ea',
  ],
  background: 'transparent',
  textColor: '#4a4a4a',
  textMuted: '#8a8a8a',
  axisColor: '#c0c0c0',
  gridColor: '#f0f0f0',
  tooltipBackground: '#ffffff',
  tooltipText: '#4a4a4a',
  tooltipBorder: '#e0e0e0',
  fontFamily: '"Nunito", "Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 12,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 5,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Monochrome — grayscale only, maximum clarity
// ---------------------------------------------------------------------------

export const monochromeTheme: ThemeConfig = {
  colors: [
    '#111111', '#333333', '#555555', '#777777', '#999999',
    '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#444444',
  ],
  background: 'transparent',
  textColor: '#111111',
  textMuted: '#666666',
  axisColor: '#999999',
  gridColor: '#e5e5e5',
  tooltipBackground: '#111111',
  tooltipText: '#f5f5f5',
  tooltipBorder: '#333333',
  fontFamily: '"Helvetica Neue", "Arial", sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 0,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Luxury — rich darks, gold accents, premium feel
// ---------------------------------------------------------------------------

export const luxuryTheme: ThemeConfig = {
  colors: [
    '#d4af37', '#c9b037', '#bf9b30', '#a67c00', '#8b6914',
    '#e8d5b7', '#c0c0c0', '#b87333', '#e5c100', '#ffd700',
  ],
  background: 'transparent',
  textColor: '#f5f0e8',
  textMuted: '#a09080',
  axisColor: '#504030',
  gridColor: '#302820',
  tooltipBackground: '#1a1410',
  tooltipText: '#f5f0e8',
  tooltipBorder: '#504030',
  fontFamily: '"Playfair Display", "Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 2,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Retro — warm vintage tones, hand-drawn feel
// ---------------------------------------------------------------------------

export const retroTheme: ThemeConfig = {
  colors: [
    '#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261',
    '#264653', '#a8dadc', '#606c38', '#dda15e', '#bc6c25',
  ],
  background: 'transparent',
  textColor: '#3d3d3d',
  textMuted: '#7a7a7a',
  axisColor: '#b0a090',
  gridColor: '#e8e0d8',
  tooltipBackground: '#3d3d3d',
  tooltipText: '#f5f0e8',
  tooltipBorder: '#7a7a7a',
  fontFamily: '"Courier New", "Courier", monospace',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 0,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 2,
  pointRadius: 4,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Minimal — ultra-clean, barely there UI
// ---------------------------------------------------------------------------

export const minimalTheme: ThemeConfig = {
  colors: [
    '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
    '#0891b2', '#4f46e5', '#c026d3', '#059669', '#d97706',
  ],
  background: 'transparent',
  textColor: '#374151',
  textMuted: '#9ca3af',
  axisColor: '#e5e7eb',
  gridColor: '#f9fafb',
  tooltipBackground: '#ffffff',
  tooltipText: '#374151',
  tooltipBorder: '#f3f4f6',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 0.5,
  pointRadius: 2.5,
  lineWidth: 1.5,
}

// ---------------------------------------------------------------------------
// Midnight — deep blue dark mode
// ---------------------------------------------------------------------------

export const midnightTheme: ThemeConfig = {
  colors: [
    '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa',
    '#fb923c', '#2dd4bf', '#f87171', '#818cf8', '#4ade80',
  ],
  background: 'transparent',
  textColor: '#e2e8f0',
  textMuted: '#64748b',
  axisColor: '#334155',
  gridColor: '#1e293b',
  tooltipBackground: '#0f172a',
  tooltipText: '#f1f5f9',
  tooltipBorder: '#334155',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Earth — natural, organic tones
// ---------------------------------------------------------------------------

export const earthTheme: ThemeConfig = {
  colors: [
    '#606c38', '#283618', '#dda15e', '#bc6c25', '#588157',
    '#a3b18a', '#dad7cd', '#344e41', '#3a5a40', '#6b705c',
  ],
  background: 'transparent',
  textColor: '#283618',
  textMuted: '#6b705c',
  axisColor: '#a3b18a',
  gridColor: '#dad7cd',
  tooltipBackground: '#283618',
  tooltipText: '#dad7cd',
  tooltipBorder: '#588157',
  fontFamily: '"Merriweather", "Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Nord — Arctic color palette, cool blues and greens
// ---------------------------------------------------------------------------

export const nordTheme: ThemeConfig = {
  colors: [
    '#88c0d0', '#81a1c1', '#5e81ac', '#bf616a', '#d08770',
    '#ebcb8b', '#a3be8c', '#b48ead', '#8fbcbb', '#4c566a',
  ],
  background: 'transparent',
  textColor: '#d8dee9',
  textMuted: '#4c566a',
  axisColor: '#3b4252',
  gridColor: '#2e3440',
  tooltipBackground: '#2e3440',
  tooltipText: '#eceff4',
  tooltipBorder: '#3b4252',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Dracula — popular dark theme, purple accents
// ---------------------------------------------------------------------------

export const draculaTheme: ThemeConfig = {
  colors: [
    '#bd93f9', '#ff79c6', '#50fa7b', '#f1fa8c', '#8be9fd',
    '#ffb86c', '#ff5555', '#6272a4', '#f8f8f2', '#44475a',
  ],
  background: 'transparent',
  textColor: '#f8f8f2',
  textMuted: '#6272a4',
  axisColor: '#44475a',
  gridColor: '#383a59',
  tooltipBackground: '#282a36',
  tooltipText: '#f8f8f2',
  tooltipBorder: '#44475a',
  fontFamily: '"Fira Code", "JetBrains Mono", monospace',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Solarized Light — warm yellowish light theme
// ---------------------------------------------------------------------------

export const solarizedLightTheme: ThemeConfig = {
  colors: [
    '#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16',
    '#dc322f', '#d33682', '#6c71c4', '#657b83', '#93a1a1',
  ],
  background: 'transparent',
  textColor: '#586e75',
  textMuted: '#93a1a1',
  axisColor: '#93a1a1',
  gridColor: '#eee8d5',
  tooltipBackground: '#fdf6e3',
  tooltipText: '#586e75',
  tooltipBorder: '#eee8d5',
  fontFamily: '"Source Sans Pro", "Inter", sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Solarized Dark — dark counterpart
// ---------------------------------------------------------------------------

export const solarizedDarkTheme: ThemeConfig = {
  colors: [
    '#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16',
    '#dc322f', '#d33682', '#6c71c4', '#657b83', '#839496',
  ],
  background: 'transparent',
  textColor: '#839496',
  textMuted: '#586e75',
  axisColor: '#073642',
  gridColor: '#073642',
  tooltipBackground: '#002b36',
  tooltipText: '#fdf6e3',
  tooltipBorder: '#073642',
  fontFamily: '"Source Sans Pro", "Inter", sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Catppuccin Mocha — pastel dark theme
// ---------------------------------------------------------------------------

export const catppuccinTheme: ThemeConfig = {
  colors: [
    '#89b4fa', '#f38ba8', '#a6e3a1', '#f9e2af', '#cba6f7',
    '#fab387', '#94e2d5', '#f5c2e7', '#74c7ec', '#eba0ac',
  ],
  background: 'transparent',
  textColor: '#cdd6f4',
  textMuted: '#6c7086',
  axisColor: '#45475a',
  gridColor: '#313244',
  tooltipBackground: '#1e1e2e',
  tooltipText: '#cdd6f4',
  tooltipBorder: '#45475a',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Tokyo Night — dark theme with soft purple/blue tones
// ---------------------------------------------------------------------------

export const tokyoNightTheme: ThemeConfig = {
  colors: [
    '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68',
    '#f7768e', '#73daca', '#b4f9f8', '#2ac3de', '#ff9e64',
  ],
  background: 'transparent',
  textColor: '#c0caf5',
  textMuted: '#565f89',
  axisColor: '#3b4261',
  gridColor: '#292e42',
  tooltipBackground: '#1a1b26',
  tooltipText: '#c0caf5',
  tooltipBorder: '#3b4261',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Gruvbox — warm retro dark theme
// ---------------------------------------------------------------------------

export const gruvboxTheme: ThemeConfig = {
  colors: [
    '#458588', '#b8bb26', '#d79921', '#cc241d', '#b16286',
    '#689d6a', '#d65d0e', '#83a598', '#fabd2f', '#fb4934',
  ],
  background: 'transparent',
  textColor: '#ebdbb2',
  textMuted: '#928374',
  axisColor: '#504945',
  gridColor: '#3c3836',
  tooltipBackground: '#282828',
  tooltipText: '#ebdbb2',
  tooltipBorder: '#504945',
  fontFamily: '"IBM Plex Mono", "Fira Code", monospace',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 2,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// One Dark — Atom editor inspired dark theme
// ---------------------------------------------------------------------------

export const oneDarkTheme: ThemeConfig = {
  colors: [
    '#61afef', '#c678dd', '#98c379', '#e5c07b', '#e06c75',
    '#56b6c2', '#d19a66', '#be5046', '#61afef', '#abb2bf',
  ],
  background: 'transparent',
  textColor: '#abb2bf',
  textMuted: '#5c6370',
  axisColor: '#3e4451',
  gridColor: '#2c313a',
  tooltipBackground: '#21252b',
  tooltipText: '#abb2bf',
  tooltipBorder: '#3e4451',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Synthwave — 80s retro, hot pink and electric blue
// ---------------------------------------------------------------------------

export const synthwaveTheme: ThemeConfig = {
  colors: [
    '#ff7edb', '#36f9f6', '#fede5d', '#ff8b39', '#e44dff',
    '#72f1b8', '#f97e72', '#c792ea', '#82aaff', '#ff6ac1',
  ],
  background: 'transparent',
  textColor: '#d6deeb',
  textMuted: '#637777',
  axisColor: '#3a3a5c',
  gridColor: '#262640',
  tooltipBackground: '#1a1a2e',
  tooltipText: '#d6deeb',
  tooltipBorder: '#3a3a5c',
  fontFamily: '"Fira Code", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 0,
  gridStyle: 'dotted',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Forest — deep greens, natural canopy
// ---------------------------------------------------------------------------

export const forestTheme: ThemeConfig = {
  colors: [
    '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2',
    '#b7e4c7', '#1b4332', '#081c15', '#d8f3dc', '#367e5e',
  ],
  background: 'transparent',
  textColor: '#1b4332',
  textMuted: '#588068',
  axisColor: '#95d5b2',
  gridColor: '#d8f3dc',
  tooltipBackground: '#1b4332',
  tooltipText: '#d8f3dc',
  tooltipBorder: '#2d6a4f',
  fontFamily: '"Lato", "Inter", sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Sunset — warm gradients, orange and purple
// ---------------------------------------------------------------------------

export const sunsetTheme: ThemeConfig = {
  colors: [
    '#ff6b6b', '#ffa36b', '#ffd56b', '#c9b1ff', '#a06cd5',
    '#ff8fa3', '#ffb3c6', '#7b68ee', '#ff6347', '#e8a87c',
  ],
  background: 'transparent',
  textColor: '#3d2c2c',
  textMuted: '#8b7070',
  axisColor: '#c9a0a0',
  gridColor: '#f5e6e0',
  tooltipBackground: '#3d2c2c',
  tooltipText: '#f5e6e0',
  tooltipBorder: '#6b4444',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Arctic — cool blues and whites
// ---------------------------------------------------------------------------

export const arcticTheme: ThemeConfig = {
  colors: [
    '#4fc3f7', '#29b6f6', '#039be5', '#0277bd', '#01579b',
    '#80deea', '#26c6da', '#00838f', '#b3e5fc', '#0288d1',
  ],
  background: 'transparent',
  textColor: '#263238',
  textMuted: '#78909c',
  axisColor: '#b0bec5',
  gridColor: '#eceff1',
  tooltipBackground: '#263238',
  tooltipText: '#eceff1',
  tooltipBorder: '#37474f',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 6,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Autumn — warm oranges, reds, and browns
// ---------------------------------------------------------------------------

export const autumnTheme: ThemeConfig = {
  colors: [
    '#d4421e', '#e8751a', '#f0a830', '#c7941a', '#8b6f47',
    '#a0522d', '#b8860b', '#cd853f', '#d2691e', '#8b4513',
  ],
  background: 'transparent',
  textColor: '#3e2723',
  textMuted: '#795548',
  axisColor: '#bcaaa4',
  gridColor: '#efebe9',
  tooltipBackground: '#3e2723',
  tooltipText: '#efebe9',
  tooltipBorder: '#5d4037',
  fontFamily: '"Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1.5,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Spring — fresh greens and pinks
// ---------------------------------------------------------------------------

export const springTheme: ThemeConfig = {
  colors: [
    '#66bb6a', '#ef5350', '#ab47bc', '#42a5f5', '#ffa726',
    '#ec407a', '#7e57c2', '#26a69a', '#d4e157', '#ff7043',
  ],
  background: 'transparent',
  textColor: '#33691e',
  textMuted: '#689f38',
  axisColor: '#aed581',
  gridColor: '#f1f8e9',
  tooltipBackground: '#33691e',
  tooltipText: '#f1f8e9',
  tooltipBorder: '#558b2f',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 10,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Cyberpunk — high contrast neon on black
// ---------------------------------------------------------------------------

export const cyberpunkTheme: ThemeConfig = {
  colors: [
    '#f0f', '#0ff', '#ff0', '#f00', '#0f0',
    '#ff6ec7', '#00ffcc', '#ccff00', '#ff3366', '#66ffcc',
  ],
  background: 'transparent',
  textColor: '#f0f0f0',
  textMuted: '#666666',
  axisColor: '#333333',
  gridColor: '#1a1a1a',
  tooltipBackground: '#0a0a0a',
  tooltipText: '#f0f0f0',
  tooltipBorder: '#333333',
  fontFamily: '"Orbitron", "JetBrains Mono", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 0,
  gridStyle: 'dotted',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Vintage — muted warm tones, classic feel
// ---------------------------------------------------------------------------

export const vintageTheme: ThemeConfig = {
  colors: [
    '#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae',
    '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570',
  ],
  background: 'transparent',
  textColor: '#333333',
  textMuted: '#999999',
  axisColor: '#cccccc',
  gridColor: '#eeeeee',
  tooltipBackground: '#333333',
  tooltipText: '#ffffff',
  tooltipBorder: '#555555',
  fontFamily: '"Georgia", "Times New Roman", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 2,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Blueprint — technical drawing style, blue on white
// ---------------------------------------------------------------------------

export const blueprintTheme: ThemeConfig = {
  colors: [
    '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5',
    '#64b5f6', '#90caf9', '#0d47a1', '#0277bd', '#0288d1',
  ],
  background: 'transparent',
  textColor: '#0d47a1',
  textMuted: '#5472a0',
  axisColor: '#90caf9',
  gridColor: '#e3f2fd',
  tooltipBackground: '#0d47a1',
  tooltipText: '#e3f2fd',
  tooltipBorder: '#1565c0',
  fontFamily: '"Courier New", "Courier", monospace',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 0,
  gridStyle: 'dashed',
  gridWidth: 0.5,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 1.5,
}

// ---------------------------------------------------------------------------
// Newspaper — black & white, serif, print-ready
// ---------------------------------------------------------------------------

export const newspaperTheme: ThemeConfig = {
  colors: [
    '#000000', '#333333', '#666666', '#999999', '#cc0000',
    '#003366', '#006600', '#663300', '#444444', '#888888',
  ],
  background: 'transparent',
  textColor: '#000000',
  textMuted: '#666666',
  axisColor: '#000000',
  gridColor: '#e0e0e0',
  tooltipBackground: '#000000',
  tooltipText: '#ffffff',
  tooltipBorder: '#333333',
  fontFamily: '"Georgia", "Times New Roman", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 0,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 1.5,
  pointRadius: 2.5,
  lineWidth: 1.5,
}

// ---------------------------------------------------------------------------
// Chalk — chalkboard style, green on dark
// ---------------------------------------------------------------------------

export const chalkTheme: ThemeConfig = {
  colors: [
    '#ffffff', '#fce94f', '#fcaf3e', '#e9b96e', '#8ae234',
    '#729fcf', '#ad7fa8', '#ef2929', '#d3d7cf', '#babdb6',
  ],
  background: 'transparent',
  textColor: '#d3d7cf',
  textMuted: '#888a85',
  axisColor: '#555753',
  gridColor: '#353530',
  tooltipBackground: '#2a2a25',
  tooltipText: '#d3d7cf',
  tooltipBorder: '#555753',
  fontFamily: '"Indie Flower", "Comic Sans MS", cursive',
  fontSize: 13,
  fontSizeSmall: 11,
  fontSizeLarge: 15,
  borderRadius: 0,
  gridStyle: 'dashed',
  gridWidth: 1,
  axisWidth: 2,
  pointRadius: 4,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Watercolor — soft painted feel
// ---------------------------------------------------------------------------

export const watercolorTheme: ThemeConfig = {
  colors: [
    '#7eb5d6', '#d4a5a5', '#9fc5a8', '#e8c170', '#c5a3cf',
    '#f0b49e', '#a8d4e6', '#d8c99b', '#b8d4a3', '#e6a8b4',
  ],
  background: 'transparent',
  textColor: '#5a5a5a',
  textMuted: '#9a9a9a',
  axisColor: '#cccccc',
  gridColor: '#f5f0eb',
  tooltipBackground: '#ffffff',
  tooltipText: '#5a5a5a',
  tooltipBorder: '#e0dbd5',
  fontFamily: '"Crimson Text", "Georgia", serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 16,
  gridStyle: 'solid',
  gridWidth: 0.5,
  axisWidth: 0.5,
  pointRadius: 5,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Material — Google Material Design colors
// ---------------------------------------------------------------------------

export const materialTheme: ThemeConfig = {
  colors: [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
    '#0097a7', '#c2185b', '#5d4037', '#455a64', '#fbc02d',
  ],
  background: 'transparent',
  textColor: '#212121',
  textMuted: '#757575',
  axisColor: '#bdbdbd',
  gridColor: '#f5f5f5',
  tooltipBackground: '#424242',
  tooltipText: '#ffffff',
  tooltipBorder: '#616161',
  fontFamily: '"Roboto", "Inter", sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Corporate Blue — enterprise, blue accent
// ---------------------------------------------------------------------------

export const corporateBlueTheme: ThemeConfig = {
  colors: [
    '#003f88', '#0066cc', '#3399ff', '#66b3ff', '#99ccff',
    '#004e98', '#005cbf', '#1a75d1', '#4d94e6', '#80b3f0',
  ],
  background: 'transparent',
  textColor: '#1a1a2e',
  textMuted: '#6b6b8a',
  axisColor: '#b0b0c0',
  gridColor: '#ececf0',
  tooltipBackground: '#1a1a2e',
  tooltipText: '#ffffff',
  tooltipBorder: '#003f88',
  fontFamily: '"Segoe UI", "Inter", sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Corporate Green — enterprise, green accent
// ---------------------------------------------------------------------------

export const corporateGreenTheme: ThemeConfig = {
  colors: [
    '#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50',
    '#66bb6a', '#81c784', '#145a1e', '#0d4e14', '#a5d6a7',
  ],
  background: 'transparent',
  textColor: '#1a2e1a',
  textMuted: '#6b8a6b',
  axisColor: '#b0c0b0',
  gridColor: '#ecf0ec',
  tooltipBackground: '#1b5e20',
  tooltipText: '#ffffff',
  tooltipBorder: '#2e7d32',
  fontFamily: '"Segoe UI", "Inter", sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Corporate Red — enterprise, red accent
// ---------------------------------------------------------------------------

export const corporateRedTheme: ThemeConfig = {
  colors: [
    '#b71c1c', '#c62828', '#d32f2f', '#e53935', '#f44336',
    '#ef5350', '#e57373', '#9a0007', '#ff1744', '#ff5252',
  ],
  background: 'transparent',
  textColor: '#2e1a1a',
  textMuted: '#8a6b6b',
  axisColor: '#c0b0b0',
  gridColor: '#f0ecec',
  tooltipBackground: '#b71c1c',
  tooltipText: '#ffffff',
  tooltipBorder: '#c62828',
  fontFamily: '"Segoe UI", "Inter", sans-serif',
  fontSize: 11,
  fontSizeSmall: 9,
  fontSizeLarge: 13,
  borderRadius: 4,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3,
  lineWidth: 2,
}

// ---------------------------------------------------------------------------
// Sketchy — hand-drawn feel with rough strokes
// ---------------------------------------------------------------------------

export const sketchyTheme: ThemeConfig = {
  colors: [
    '#2b2b2b', '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#95a5a6',
  ],
  background: 'transparent',
  textColor: '#2b2b2b',
  textMuted: '#7f8c8d',
  axisColor: '#bdc3c7',
  gridColor: '#ecf0f1',
  tooltipBackground: '#2c3e50',
  tooltipText: '#ecf0f1',
  tooltipBorder: '#7f8c8d',
  fontFamily: '"Indie Flower", "Patrick Hand", cursive',
  fontSize: 13,
  fontSizeSmall: 11,
  fontSizeLarge: 15,
  borderRadius: 0,
  gridStyle: 'dashed',
  gridWidth: 1.5,
  axisWidth: 2,
  pointRadius: 5,
  lineWidth: 2.5,
}

// ---------------------------------------------------------------------------
// Rose Pine — dark theme with muted pinks and purples
// ---------------------------------------------------------------------------

export const rosePineTheme: ThemeConfig = {
  colors: [
    '#ebbcba', '#31748f', '#9ccfd8', '#c4a7e7', '#f6c177',
    '#eb6f92', '#e0def4', '#908caa', '#524f67', '#403d52',
  ],
  background: 'transparent',
  textColor: '#e0def4',
  textMuted: '#6e6a86',
  axisColor: '#403d52',
  gridColor: '#2a273f',
  tooltipBackground: '#191724',
  tooltipText: '#e0def4',
  tooltipBorder: '#403d52',
  fontFamily: '"Inter", -apple-system, sans-serif',
  fontSize: 12,
  fontSizeSmall: 10,
  fontSizeLarge: 14,
  borderRadius: 8,
  gridStyle: 'solid',
  gridWidth: 1,
  axisWidth: 1,
  pointRadius: 3.5,
  lineWidth: 2,
}

// ===========================================================================
// NEW THEMES (compact format using theme() helper)
// ===========================================================================

// ---------------------------------------------------------------------------
// Editor Themes
// ---------------------------------------------------------------------------

export const monokaiTheme = theme(
  ['#f92672', '#66d9ef', '#a6e22e', '#fd971f', '#ae81ff', '#e6db74', '#f8f8f2', '#75715e', '#ff6188', '#ffd866'],
  { textColor: '#f8f8f2', textMuted: '#75715e', axisColor: '#49483e', gridColor: '#3e3d32', fontFamily: '"Fira Code", monospace' },
)

export const githubLightTheme = theme(
  ['#0969da', '#1a7f37', '#cf222e', '#8250df', '#bf8700', '#0550ae', '#116329', '#a40e26', '#6639ba', '#953800'],
  { textColor: '#1f2328', textMuted: '#656d76', axisColor: '#d0d7de', gridColor: '#f6f8fa', fontFamily: '"Segoe UI", -apple-system, sans-serif' },
)

export const githubDarkTheme = theme(
  ['#58a6ff', '#3fb950', '#f85149', '#bc8cff', '#d29922', '#79c0ff', '#56d364', '#ff7b72', '#d2a8ff', '#e3b341'],
  { textColor: '#e6edf3', textMuted: '#7d8590', axisColor: '#30363d', gridColor: '#21262d', fontFamily: '"Segoe UI", -apple-system, sans-serif' },
)

export const ayuLightTheme = theme(
  ['#ff6a00', '#86b300', '#4cbf99', '#55b4d4', '#a37acc', '#f07171', '#e6ba7e', '#399ee6', '#fa8d3e', '#4cbf99'],
  { textColor: '#575f66', textMuted: '#abb0b6', axisColor: '#d8d8d7', gridColor: '#f3f4f5', fontFamily: '"Source Code Pro", monospace' },
)

export const ayuDarkTheme = theme(
  ['#ff8f40', '#aad94c', '#95e6cb', '#59c2ff', '#d2a6ff', '#f07178', '#e6b673', '#73b8ff', '#ffb454', '#bae67e'],
  { textColor: '#bfbdb6', textMuted: '#565b66', axisColor: '#2d353b', gridColor: '#1f2430', fontFamily: '"Source Code Pro", monospace' },
)

export const pandaTheme = theme(
  ['#ff75b5', '#19f9d8', '#ffb86c', '#b084eb', '#ff2c6d', '#6fc1ff', '#e6e6e6', '#ff9ac1', '#45a9f9', '#ffcc95'],
  { textColor: '#e6e6e6', textMuted: '#757575', axisColor: '#3f4245', gridColor: '#2b2c2f', fontFamily: '"Operator Mono", "Fira Code", monospace', borderRadius: 4 },
)

export const cobaltTheme = theme(
  ['#ffc600', '#ff9d00', '#ff628c', '#0088ff', '#80ffbb', '#a5ff90', '#9effff', '#fb94ff', '#3ad900', '#ff0'],
  { textColor: '#e1efff', textMuted: '#5a7ea6', axisColor: '#1a3a5c', gridColor: '#122d4f', fontFamily: '"Inconsolata", monospace', borderRadius: 2 },
)

export const nightOwlTheme = theme(
  ['#82aaff', '#c792ea', '#7fdbca', '#f78c6c', '#addb67', '#ff5874', '#ecc48d', '#ffcb8b', '#c5e478', '#d6deeb'],
  { textColor: '#d6deeb', textMuted: '#637777', axisColor: '#1d3b53', gridColor: '#122d42', fontFamily: '"Dank Mono", "Operator Mono", monospace', borderRadius: 4 },
)

export const palenightTheme = theme(
  ['#82aaff', '#c3e88d', '#f07178', '#c792ea', '#ffcb6b', '#89ddff', '#f78c6c', '#ff5370', '#a6accd', '#717cb4'],
  { textColor: '#a6accd', textMuted: '#676e95', axisColor: '#3a3f58', gridColor: '#2f3344', fontFamily: '"JetBrains Mono", monospace' },
)

export const andromedaTheme = theme(
  ['#ee5d43', '#96e072', '#ffe66d', '#00e8c6', '#c74ded', '#f39c12', '#7cb7ff', '#f97e72', '#0be5a8', '#d4bfff'],
  { textColor: '#d5ced9', textMuted: '#655a72', axisColor: '#3b3547', gridColor: '#2b2539', fontFamily: '"Fira Code", monospace' },
)

// ---------------------------------------------------------------------------
// Brand-Inspired
// ---------------------------------------------------------------------------

export const stripeTheme = theme(
  ['#635bff', '#0a2540', '#00d4aa', '#ff7a59', '#80e9ff', '#ffbb00', '#ff5e6c', '#425466', '#7a73ff', '#3ecf8e'],
  { textColor: '#0a2540', textMuted: '#425466', axisColor: '#c1c9d2', gridColor: '#f6f9fc', fontFamily: '"GT America", "Inter", sans-serif', borderRadius: 8 },
)

export const vercelTheme = theme(
  ['#000000', '#666666', '#888888', '#999999', '#0070f3', '#50e3c2', '#f5a623', '#7928ca', '#ff0080', '#00c4b4'],
  { textColor: '#000000', textMuted: '#666666', axisColor: '#eaeaea', gridColor: '#fafafa', fontFamily: '"Inter", -apple-system, sans-serif', borderRadius: 4, gridWidth: 0.5 },
)

export const linearTheme = theme(
  ['#5e6ad2', '#26b5ce', '#f2c94c', '#e16259', '#4cb782', '#8b5cf6', '#d8a656', '#e88de0', '#5fa1f5', '#a7c957'],
  { textColor: '#f2f2f2', textMuted: '#7e7e8f', axisColor: '#323248', gridColor: '#1e1e2e', fontFamily: '"Inter", sans-serif', borderRadius: 8 },
)

export const figmaTheme = theme(
  ['#f24e1e', '#ff7262', '#a259ff', '#1abcfe', '#0acf83', '#ffcd29', '#14ae5c', '#9747ff', '#24cb71', '#ff8c00'],
  { textColor: '#333333', textMuted: '#999999', axisColor: '#e5e5e5', gridColor: '#f5f5f5', fontFamily: '"Inter", sans-serif', borderRadius: 8 },
)

export const notionTheme = theme(
  ['#2eaadc', '#6940a5', '#d44c47', '#448361', '#d9730d', '#cb912f', '#337ea9', '#9065b0', '#64473a', '#787774'],
  { textColor: '#37352f', textMuted: '#787774', axisColor: '#e3e2e0', gridColor: '#f7f6f3', fontFamily: '"Georgia", serif', borderRadius: 3 },
)

export const slackTheme = theme(
  ['#4a154b', '#36c5f0', '#2eb67d', '#ecb22e', '#e01e5a', '#611f69', '#1264a3', '#e8912d', '#2bac76', '#cd2553'],
  { textColor: '#1d1c1d', textMuted: '#616061', axisColor: '#dddddd', gridColor: '#f8f8f8', fontFamily: '"Lato", "Helvetica Neue", sans-serif', borderRadius: 8 },
)

export const spotifyTheme = theme(
  ['#1db954', '#1ed760', '#b3b3b3', '#535353', '#ffffff', '#191414', '#1db954', '#509bf5', '#f573a0', '#e8115b'],
  { textColor: '#ffffff', textMuted: '#b3b3b3', axisColor: '#404040', gridColor: '#282828', fontFamily: '"Montserrat", "Helvetica Neue", sans-serif', borderRadius: 20 },
)

export const discordTheme = theme(
  ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#3ba55d', '#faa61a', '#5865f2', '#99aab5', '#f47b67'],
  { textColor: '#dcddde', textMuted: '#72767d', axisColor: '#40444b', gridColor: '#2f3136', fontFamily: '"Whitney", "Inter", sans-serif', borderRadius: 8 },
)

// ---------------------------------------------------------------------------
// Regional / Cultural
// ---------------------------------------------------------------------------

export const sakuraTheme = theme(
  ['#ffb7c5', '#ff92a5', '#f8c3cd', '#e8a0bf', '#d291bc', '#c77dba', '#f7cad0', '#f9bec7', '#e5989b', '#b5838d'],
  { textColor: '#5c374c', textMuted: '#a07a8f', axisColor: '#e8c4d0', gridColor: '#fdf2f4', fontFamily: '"Noto Serif JP", "Georgia", serif', borderRadius: 12, pointRadius: 4 },
)

export const terracottaTheme = theme(
  ['#c2703e', '#e07b4c', '#d4956a', '#b8652a', '#a0522d', '#e8a87c', '#c98860', '#deb887', '#cd853f', '#8b5e3c'],
  { textColor: '#3e2723', textMuted: '#8d6e63', axisColor: '#bcaaa4', gridColor: '#f5ebe0', fontFamily: '"Cormorant Garamond", serif', borderRadius: 4, gridStyle: 'solid' },
)

export const jadeTheme = theme(
  ['#00695c', '#2e7d32', '#4db6ac', '#81c784', '#009688', '#00897b', '#388e3c', '#66bb6a', '#26a69a', '#43a047'],
  { textColor: '#1b3c34', textMuted: '#607d6b', axisColor: '#b2c9b9', gridColor: '#e8f0eb', fontFamily: '"Noto Serif SC", "Georgia", serif', borderRadius: 2, axisWidth: 1.5 },
)

export const saharaTheme = theme(
  ['#d4a76a', '#c2956b', '#e6c88a', '#b8860b', '#daa520', '#cd853f', '#a0522d', '#f4a460', '#c68642', '#8b6914'],
  { textColor: '#3e2c1a', textMuted: '#8c7a5e', axisColor: '#c9b99a', gridColor: '#f5f0e0', fontFamily: '"Amiri", "Georgia", serif', borderRadius: 2, gridStyle: 'dotted' },
)

export const fjordTheme = theme(
  ['#2c5f7c', '#4a90a4', '#6fb4c1', '#89c4cf', '#3a7ca5', '#1b4965', '#5fa8d3', '#62b6cb', '#1b9aaa', '#468faf'],
  { textColor: '#1b2a3d', textMuted: '#607d8b', axisColor: '#b0c4de', gridColor: '#e8f1f8', fontFamily: '"Roboto Slab", serif', borderRadius: 4 },
)

export const caribbeanTheme = theme(
  ['#00bcd4', '#ff6f00', '#e91e63', '#4caf50', '#ffeb3b', '#00acc1', '#ff5722', '#8bc34a', '#ffc107', '#03a9f4'],
  { textColor: '#1a3a4a', textMuted: '#5f8a9a', axisColor: '#b0d0d8', gridColor: '#e0f4f8', fontFamily: '"Pacifico", cursive', borderRadius: 12, lineWidth: 2.5, pointRadius: 4 },
)

// ---------------------------------------------------------------------------
// Data Viz Standards
// ---------------------------------------------------------------------------

export const tableauTheme = theme(
  ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'],
  { textColor: '#333333', textMuted: '#888888', axisColor: '#cccccc', gridColor: '#f0f0f0', fontFamily: '"Tableau", "Helvetica Neue", sans-serif' },
)

export const d3Category10Theme = theme(
  ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  { textColor: '#333333', textMuted: '#999999', axisColor: '#cccccc', gridColor: '#f2f2f2', fontFamily: '"Helvetica Neue", sans-serif', borderRadius: 0 },
)

export const observableTheme = theme(
  ['#4269d0', '#efb118', '#ff725c', '#6cc5b0', '#3ca951', '#ff8ab7', '#a463f2', '#97bbf5', '#9c6b4e', '#9498a0'],
  { textColor: '#1b1e23', textMuted: '#6e7781', axisColor: '#d1d5da', gridColor: '#f3f4f6', fontFamily: '"Source Sans Pro", sans-serif', borderRadius: 3 },
)

export const economistTheme = theme(
  ['#e3120b', '#006ba6', '#36b7b4', '#d4b95e', '#00a19a', '#bc5090', '#004c6d', '#86bcb6', '#f68f46', '#788aa3'],
  { textColor: '#333333', textMuted: '#888888', axisColor: '#cccccc', gridColor: '#f0ece2', fontFamily: '"Econ Sans", "Helvetica Neue", sans-serif', borderRadius: 0, axisWidth: 1.5 },
)

export const bloombergTheme = theme(
  ['#f06e22', '#2e78c2', '#61a22f', '#e0a025', '#c4302b', '#6f5091', '#1a8f98', '#d45d00', '#4c7d2c', '#8e4585'],
  { textColor: '#222222', textMuted: '#666666', axisColor: '#bbbbbb', gridColor: '#eeeeee', fontFamily: '"Lucida Sans", "Helvetica Neue", sans-serif', borderRadius: 0, gridWidth: 0.5 },
)

export const financialTimesTheme = theme(
  ['#0d7680', '#0f5499', '#cc0000', '#ff7faa', '#593380', '#00994d', '#ff8833', '#96cc28', '#0a5e66', '#cc7722'],
  { textColor: '#333333', textMuted: '#807e76', axisColor: '#ccc1b7', gridColor: '#fff1e5', fontFamily: '"Metric", "Financier Text", Georgia, serif', borderRadius: 0, axisWidth: 1.5 },
)

// ---------------------------------------------------------------------------
// Seasonal
// ---------------------------------------------------------------------------

export const winterTheme = theme(
  ['#a8d5e2', '#6cb4d9', '#3a8fc2', '#1a6da3', '#0d4f8b', '#c5e3f0', '#dceefb', '#4a9bc7', '#2279a7', '#8fc7de'],
  { textColor: '#1a3a4f', textMuted: '#6b8fa0', axisColor: '#b8d4e3', gridColor: '#eaf3f8', fontFamily: '"Inter", sans-serif', borderRadius: 8, gridStyle: 'solid' },
)

export const summerTheme = theme(
  ['#ff6b35', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffc43d', '#1b9aaa', '#e71d36', '#84dcc6', '#ff9f1c'],
  { textColor: '#1d3557', textMuted: '#457b9d', axisColor: '#a8dadc', gridColor: '#f1faee', fontFamily: '"Nunito", sans-serif', borderRadius: 10, lineWidth: 2.5 },
)

export const harvestTheme = theme(
  ['#cc6600', '#e69900', '#ffcc00', '#996633', '#cc9933', '#8b4513', '#d2691e', '#b8860b', '#daa520', '#a0522d'],
  { textColor: '#3e2723', textMuted: '#795548', axisColor: '#bcaaa4', gridColor: '#efebe9', fontFamily: '"Merriweather", serif', borderRadius: 4 },
)

export const blossomTheme = theme(
  ['#ff69b4', '#ff85c8', '#dda0dd', '#ba55d3', '#ee82ee', '#da70d6', '#ff1493', '#c71585', '#db7093', '#ffc0cb'],
  { textColor: '#4a2040', textMuted: '#8e6084', axisColor: '#d4a0c0', gridColor: '#fdf0f5', fontFamily: '"Quicksand", sans-serif', borderRadius: 12, pointRadius: 4.5 },
)

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

export const highContrastLightTheme = theme(
  ['#000000', '#0000ff', '#cc0000', '#006600', '#800080', '#cc6600', '#004d99', '#990033', '#336600', '#660066'],
  { textColor: '#000000', textMuted: '#444444', axisColor: '#000000', gridColor: '#cccccc', fontFamily: '"Atkinson Hyperlegible", "Arial", sans-serif', borderRadius: 0, axisWidth: 2, lineWidth: 3, pointRadius: 5 },
)

export const highContrastDarkTheme = theme(
  ['#ffff00', '#00ffff', '#ff6666', '#66ff66', '#ff66ff', '#ffaa00', '#66aaff', '#ff9999', '#99ff99', '#ffaaff'],
  { textColor: '#ffffff', textMuted: '#cccccc', axisColor: '#ffffff', gridColor: '#444444', fontFamily: '"Atkinson Hyperlegible", "Arial", sans-serif', borderRadius: 0, axisWidth: 2, lineWidth: 3, pointRadius: 5 },
)

export const colorblindSafeTheme = theme(
  ['#332288', '#88ccee', '#44aa99', '#117733', '#999933', '#ddcc77', '#cc6677', '#882255', '#aa4499', '#661100'],
  { textColor: '#222222', textMuted: '#777777', axisColor: '#bbbbbb', gridColor: '#eeeeee', fontFamily: '"Inter", -apple-system, sans-serif', borderRadius: 4, lineWidth: 2.5, pointRadius: 4 },
)

export const deuteranopiaSafeTheme = theme(
  ['#0072b2', '#e69f00', '#cc79a7', '#009e73', '#d55e00', '#56b4e9', '#f0e442', '#000000', '#0072b2', '#e69f00'],
  { textColor: '#222222', textMuted: '#777777', axisColor: '#bbbbbb', gridColor: '#eeeeee', fontFamily: '"Inter", -apple-system, sans-serif', borderRadius: 4, lineWidth: 2.5, pointRadius: 4 },
)

// ---------------------------------------------------------------------------
// Industry
// ---------------------------------------------------------------------------

export const healthcareTheme = theme(
  ['#0077c2', '#00a88f', '#5bb5d5', '#8cc152', '#f6bb42', '#e9573f', '#37bc9b', '#3bafda', '#967adc', '#d770ad'],
  { textColor: '#2c3e50', textMuted: '#7f8c8d', axisColor: '#bdc3c7', gridColor: '#f0f4f8', fontFamily: '"Open Sans", "Segoe UI", sans-serif', borderRadius: 8 },
)

export const fintechTheme = theme(
  ['#00c48c', '#ff647c', '#0073e6', '#ffc107', '#7b61ff', '#00b4d8', '#e91e63', '#4caf50', '#ff9800', '#2196f3'],
  { textColor: '#1a1a2e', textMuted: '#6c6c80', axisColor: '#c8c8d4', gridColor: '#f0f0f5', fontFamily: '"DM Sans", "Inter", sans-serif', borderRadius: 10 },
)

export const gamingTheme = theme(
  ['#ff0055', '#00ff87', '#ffaa00', '#0088ff', '#ff00aa', '#00ffff', '#ff5500', '#aa00ff', '#00ff00', '#ff0000'],
  { textColor: '#e0e0e0', textMuted: '#707070', axisColor: '#404040', gridColor: '#1a1a2e', fontFamily: '"Press Start 2P", "Orbitron", monospace', fontSize: 10, fontSizeSmall: 8, fontSizeLarge: 12, borderRadius: 0, gridStyle: 'dotted', lineWidth: 2.5 },
)

export const educationTheme = theme(
  ['#1565c0', '#ef6c00', '#2e7d32', '#c62828', '#6a1b9a', '#00838f', '#d84315', '#4527a0', '#00695c', '#bf360c'],
  { textColor: '#333333', textMuted: '#777777', axisColor: '#cccccc', gridColor: '#f5f5f5', fontFamily: '"Source Sans Pro", sans-serif', borderRadius: 6 },
)

export const governmentTheme = theme(
  ['#112e51', '#205493', '#2e78d2', '#02bfe7', '#12890e', '#e59393', '#981b1e', '#e56a54', '#fad980', '#2e8540'],
  { textColor: '#212121', textMuted: '#757575', axisColor: '#c0c0c0', gridColor: '#eeeeee', fontFamily: '"Source Sans Pro", "Merriweather", serif', borderRadius: 2, gridStyle: 'solid', axisWidth: 1.5 },
)

export const saasDarkTheme = theme(
  ['#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#0984e3', '#e17055', '#74b9ff', '#a29bfe', '#55efc4', '#ffeaa7'],
  { textColor: '#dfe6e9', textMuted: '#636e72', axisColor: '#2d3436', gridColor: '#1e272e', fontFamily: '"DM Sans", "Inter", sans-serif', borderRadius: 8 },
)

export const saasLightTheme = theme(
  ['#6c5ce7', '#00b894', '#e84393', '#fdcb6e', '#0984e3', '#e17055', '#0652dd', '#9980fa', '#00cec9', '#ffc048'],
  { textColor: '#2d3436', textMuted: '#636e72', axisColor: '#dfe6e9', gridColor: '#f5f6fa', fontFamily: '"DM Sans", "Inter", sans-serif', borderRadius: 8 },
)

export const startupBoldTheme = theme(
  ['#ff3366', '#6c5ce7', '#00d2d3', '#feca57', '#ff6348', '#1dd1a1', '#5f27cd', '#54a0ff', '#f368e0', '#ff9f43'],
  { textColor: '#222f3e', textMuted: '#8395a7', axisColor: '#c8d6e5', gridColor: '#f5f6fa', fontFamily: '"Poppins", "Inter", sans-serif', borderRadius: 12, lineWidth: 2.5, pointRadius: 4 },
)

// ---------------------------------------------------------------------------
// Artistic
// ---------------------------------------------------------------------------

export const artDecoTheme = theme(
  ['#c9a84c', '#1a1a2e', '#e8d5a3', '#4a3728', '#8b7355', '#d4af37', '#2c1810', '#9c8a54', '#6b4c3b', '#b8932f'],
  { textColor: '#1a1a2e', textMuted: '#6b5e4c', axisColor: '#c9b896', gridColor: '#f0ead6', fontFamily: '"Poiret One", "Didot", serif', borderRadius: 0, axisWidth: 2, gridStyle: 'solid', gridWidth: 0.5 },
)

export const bauhausTheme = theme(
  ['#dc0d15', '#0047ab', '#ffd700', '#000000', '#ffffff', '#e35205', '#009b48', '#f5d033', '#003d6b', '#c72c35'],
  { textColor: '#000000', textMuted: '#555555', axisColor: '#999999', gridColor: '#eeeeee', fontFamily: '"Futura", "Century Gothic", sans-serif', borderRadius: 0, axisWidth: 2, lineWidth: 2.5 },
)

export const popArtTheme = theme(
  ['#ff1744', '#ffea00', '#2979ff', '#00e676', '#ff9100', '#d500f9', '#f50057', '#76ff03', '#00b0ff', '#ff3d00'],
  { textColor: '#000000', textMuted: '#444444', axisColor: '#888888', gridColor: '#f0f0f0', fontFamily: '"Impact", "Haettenschweiler", sans-serif', borderRadius: 0, axisWidth: 3, lineWidth: 3, pointRadius: 5 },
)

export const impressionistTheme = theme(
  ['#7ca1c4', '#e8b960', '#a3c585', '#d4927c', '#b095c0', '#8fb8a0', '#dba86c', '#c4a0b5', '#91b8c4', '#c8a565'],
  { textColor: '#4a5568', textMuted: '#a0aec0', axisColor: '#cbd5e0', gridColor: '#f7fafc', fontFamily: '"Crimson Text", "Georgia", serif', borderRadius: 16, gridWidth: 0.5, lineWidth: 2.5, pointRadius: 4.5 },
)

export const brutalistTheme = theme(
  ['#ff0000', '#0000ff', '#000000', '#ffff00', '#00ff00', '#ff00ff', '#ffffff', '#ff8000', '#008000', '#800080'],
  { textColor: '#000000', textMuted: '#333333', axisColor: '#000000', gridColor: '#dddddd', fontFamily: '"Courier New", monospace', borderRadius: 0, axisWidth: 3, gridStyle: 'solid', gridWidth: 2, lineWidth: 3, pointRadius: 5 },
)

export const glitchTheme = theme(
  ['#ff0090', '#00ffff', '#ff0000', '#00ff00', '#ff00ff', '#ffff00', '#0000ff', '#00ffaa', '#ff6600', '#aa00ff'],
  { textColor: '#e0e0e0', textMuted: '#606060', axisColor: '#333333', gridColor: '#1a1a1a', fontFamily: '"VT323", "Courier New", monospace', borderRadius: 0, gridStyle: 'dotted', gridWidth: 1, axisWidth: 1, lineWidth: 2.5, pointRadius: 4 },
)

// ---------------------------------------------------------------------------
// Nature
// ---------------------------------------------------------------------------

export const oceanDeepTheme = theme(
  ['#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#023e8a', '#0353a4', '#006494', '#0582ca', '#ade8f4'],
  { textColor: '#caf0f8', textMuted: '#5e8fa0', axisColor: '#1a4a5e', gridColor: '#0a2e3e', fontFamily: '"Inter", sans-serif', borderRadius: 8 },
)

export const volcanicTheme = theme(
  ['#ff4500', '#ff6347', '#dc143c', '#b22222', '#8b0000', '#ff8c00', '#ff7043', '#d84315', '#bf360c', '#e64a19'],
  { textColor: '#f5e6d3', textMuted: '#9a7b5e', axisColor: '#5a3e28', gridColor: '#2d1f14', fontFamily: '"Roboto Slab", serif', borderRadius: 2, lineWidth: 2.5 },
)

export const auroraTheme = theme(
  ['#00ff87', '#00e4ff', '#7b68ee', '#ff69b4', '#ffd700', '#00fa9a', '#87ceeb', '#da70d6', '#ff6347', '#00ced1'],
  { textColor: '#e8e8f0', textMuted: '#7a7a9a', axisColor: '#3a3a5a', gridColor: '#1e1e3a', fontFamily: '"Inter", sans-serif', borderRadius: 8, lineWidth: 2.5, pointRadius: 4 },
)

export const coralReefTheme = theme(
  ['#ff6f61', '#ff9a8b', '#f8a978', '#fccd04', '#88d8b0', '#55b4b0', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'],
  { textColor: '#2c3e50', textMuted: '#7f8c8d', axisColor: '#bdc3c7', gridColor: '#ecf0f1', fontFamily: '"Nunito", sans-serif', borderRadius: 10, pointRadius: 4 },
)

export const rainforestTheme = theme(
  ['#1a472a', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#0b6623', '#228b22', '#556b2f', '#8fbc8f'],
  { textColor: '#0d2818', textMuted: '#4a6f5a', axisColor: '#7aa889', gridColor: '#d0e8d0', fontFamily: '"Lato", sans-serif', borderRadius: 6, gridStyle: 'solid' },
)

export const desertSandTheme = theme(
  ['#c2b280', '#d2b48c', '#deb887', '#f5deb3', '#d2691e', '#8b7355', '#bc8f8f', '#f4a460', '#e0c4a8', '#a0826d'],
  { textColor: '#3e2723', textMuted: '#795548', axisColor: '#bcaaa4', gridColor: '#efebe9', fontFamily: '"Lora", serif', borderRadius: 4, gridStyle: 'dotted' },
)

// ---------------------------------------------------------------------------
// Modern UI
// ---------------------------------------------------------------------------

export const glassmorphismTheme = theme(
  ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#a18cd1', '#fbc2eb'],
  { textColor: '#e0e0f0', textMuted: '#8888aa', axisColor: '#4a4a6a', gridColor: '#2a2a4a', fontFamily: '"Inter", -apple-system, sans-serif', borderRadius: 16, gridWidth: 0.5 },
)

export const neomorphismTheme = theme(
  ['#6c63ff', '#3dc1d3', '#e66767', '#f5cd79', '#546de5', '#e15f41', '#38ada9', '#78e08f', '#fa983a', '#b71540'],
  { textColor: '#444444', textMuted: '#aaaaaa', axisColor: '#d4d4d4', gridColor: '#ececec', fontFamily: '"Inter", sans-serif', borderRadius: 16, gridWidth: 0.5, axisWidth: 0.5 },
)

export const flatDesignTheme = theme(
  ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#e74c3c', '#e67e22', '#f1c40f', '#95a5a6', '#16a085'],
  { textColor: '#2c3e50', textMuted: '#7f8c8d', axisColor: '#bdc3c7', gridColor: '#ecf0f1', fontFamily: '"Open Sans", sans-serif', borderRadius: 4, gridStyle: 'solid' },
)

export const metroTheme = theme(
  ['#0078d7', '#107c10', '#d83b01', '#e81123', '#5c2d91', '#00b294', '#b4009e', '#767676', '#e3008c', '#fff100'],
  { textColor: '#323130', textMuted: '#605e5c', axisColor: '#c8c6c4', gridColor: '#f3f2f1', fontFamily: '"Segoe UI", sans-serif', borderRadius: 0, gridStyle: 'solid' },
)

export const iosLightTheme = theme(
  ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa', '#ff2d55', '#ffcc00', '#64d2ff', '#5856d6'],
  { textColor: '#1c1c1e', textMuted: '#8e8e93', axisColor: '#c7c7cc', gridColor: '#f2f2f7', fontFamily: '"SF Pro Display", -apple-system, sans-serif', borderRadius: 10 },
)

export const iosDarkTheme = theme(
  ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff', '#ff375f', '#ffd60a', '#5ac8fa', '#5e5ce6'],
  { textColor: '#f5f5f7', textMuted: '#8e8e93', axisColor: '#38383a', gridColor: '#1c1c1e', fontFamily: '"SF Pro Display", -apple-system, sans-serif', borderRadius: 10 },
)

export const carbonTheme = theme(
  ['#0f62fe', '#198038', '#da1e28', '#8a3ffc', '#ee538b', '#0072c3', '#009d9a', '#fa4d56', '#6929c4', '#005d5d'],
  { textColor: '#f4f4f4', textMuted: '#6f6f6f', axisColor: '#393939', gridColor: '#262626', fontFamily: '"IBM Plex Sans", "Inter", sans-serif', borderRadius: 0, gridStyle: 'solid' },
)

export const frostTheme = theme(
  ['#b0d4f1', '#89c4e1', '#6db4d8', '#52a3cf', '#3793c4', '#a7d7f7', '#c8e3f5', '#78b8dc', '#4fa0cc', '#3090c0'],
  { textColor: '#2c3e50', textMuted: '#7898a8', axisColor: '#b8d4e4', gridColor: '#e8f4fa', fontFamily: '"Inter", sans-serif', borderRadius: 8, gridWidth: 0.5 },
)

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------

export const EXTRA_THEMES: Record<string, ThemeConfig> = {
  // Original 34 themes
  neon: neonTheme,
  pastel: pastelTheme,
  monochrome: monochromeTheme,
  luxury: luxuryTheme,
  retro: retroTheme,
  minimal: minimalTheme,
  midnight: midnightTheme,
  earth: earthTheme,
  nord: nordTheme,
  dracula: draculaTheme,
  'solarized-light': solarizedLightTheme,
  'solarized-dark': solarizedDarkTheme,
  catppuccin: catppuccinTheme,
  'tokyo-night': tokyoNightTheme,
  gruvbox: gruvboxTheme,
  'one-dark': oneDarkTheme,
  synthwave: synthwaveTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  arctic: arcticTheme,
  autumn: autumnTheme,
  spring: springTheme,
  cyberpunk: cyberpunkTheme,
  vintage: vintageTheme,
  blueprint: blueprintTheme,
  newspaper: newspaperTheme,
  chalk: chalkTheme,
  watercolor: watercolorTheme,
  material: materialTheme,
  'corporate-blue': corporateBlueTheme,
  'corporate-green': corporateGreenTheme,
  'corporate-red': corporateRedTheme,
  sketchy: sketchyTheme,
  'rose-pine': rosePineTheme,
  // Editor Themes (10)
  monokai: monokaiTheme,
  'github-light': githubLightTheme,
  'github-dark': githubDarkTheme,
  'ayu-light': ayuLightTheme,
  'ayu-dark': ayuDarkTheme,
  panda: pandaTheme,
  cobalt: cobaltTheme,
  'night-owl': nightOwlTheme,
  palenight: palenightTheme,
  andromeda: andromedaTheme,
  // Brand-Inspired (8)
  stripe: stripeTheme,
  vercel: vercelTheme,
  linear: linearTheme,
  figma: figmaTheme,
  notion: notionTheme,
  slack: slackTheme,
  spotify: spotifyTheme,
  discord: discordTheme,
  // Regional / Cultural (6)
  sakura: sakuraTheme,
  terracotta: terracottaTheme,
  jade: jadeTheme,
  sahara: saharaTheme,
  fjord: fjordTheme,
  caribbean: caribbeanTheme,
  // Data Viz Standards (6)
  tableau: tableauTheme,
  'd3-category10': d3Category10Theme,
  observable: observableTheme,
  economist: economistTheme,
  bloomberg: bloombergTheme,
  'financial-times': financialTimesTheme,
  // Seasonal (4)
  winter: winterTheme,
  summer: summerTheme,
  harvest: harvestTheme,
  blossom: blossomTheme,
  // Accessibility (4)
  'high-contrast-light': highContrastLightTheme,
  'high-contrast-dark': highContrastDarkTheme,
  'colorblind-safe': colorblindSafeTheme,
  'deuteranopia-safe': deuteranopiaSafeTheme,
  // Industry (8)
  healthcare: healthcareTheme,
  fintech: fintechTheme,
  gaming: gamingTheme,
  education: educationTheme,
  government: governmentTheme,
  'saas-dark': saasDarkTheme,
  'saas-light': saasLightTheme,
  'startup-bold': startupBoldTheme,
  // Artistic (6)
  'art-deco': artDecoTheme,
  bauhaus: bauhausTheme,
  'pop-art': popArtTheme,
  impressionist: impressionistTheme,
  brutalist: brutalistTheme,
  glitch: glitchTheme,
  // Nature (6)
  'ocean-deep': oceanDeepTheme,
  volcanic: volcanicTheme,
  aurora: auroraTheme,
  'coral-reef': coralReefTheme,
  rainforest: rainforestTheme,
  'desert-sand': desertSandTheme,
  // Modern UI (8)
  glassmorphism: glassmorphismTheme,
  neomorphism: neomorphismTheme,
  'flat-design': flatDesignTheme,
  metro: metroTheme,
  'ios-light': iosLightTheme,
  'ios-dark': iosDarkTheme,
  carbon: carbonTheme,
  frost: frostTheme,
}
