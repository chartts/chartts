/**
 * Embedded CSS for chart animations, hover effects, and visual polish.
 * Injected into SVG <defs> as a <style> element.
 *
 * Uses 6 generic animations instead of 44 per-chart-type keyframes.
 * Chart types apply the appropriate generic class.
 */

export const CHART_CSS = /* css */ `
/* ---- Base ---- */
.chartts {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---- Generic animations (6 total) ---- */
@keyframes chartts-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes chartts-grow-y { from { opacity: 0; transform: scaleY(0.3) } to { opacity: 1; transform: scaleY(1) } }
@keyframes chartts-grow-x { from { opacity: 0; transform: scaleX(0.3) } to { opacity: 1; transform: scaleX(1) } }
@keyframes chartts-pop { 0% { opacity: 0; transform: scale(0) } 70% { transform: scale(1.1) } 100% { opacity: 1; transform: scale(1) } }
@keyframes chartts-draw { from { stroke-dashoffset: var(--chartts-path-len) } to { stroke-dashoffset: 0 } }
@keyframes chartts-shimmer { 0% { opacity: 0.3 } 50% { opacity: 0.7 } 100% { opacity: 0.3 } }

/* ---- Animation utility classes ---- */
[class*="chartts-anim-fade"] {
  animation: chartts-fade 0.4s ease calc(var(--chartts-i, 0) * 15ms) forwards;
  opacity: 0;
}
[class*="chartts-anim-grow-y"] {
  transform-origin: bottom center; transform-box: fill-box;
  animation: chartts-grow-y 0.4s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--chartts-i, 0) * 15ms) forwards;
  opacity: 0;
}
[class*="chartts-anim-grow-x"] {
  transform-origin: left center; transform-box: fill-box;
  animation: chartts-grow-x 0.5s ease calc(var(--chartts-i, 0) * 25ms) forwards;
  opacity: 0;
}
[class*="chartts-anim-pop"] {
  transform-origin: center; transform-box: fill-box;
  animation: chartts-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--chartts-i, 0) * 15ms) forwards;
  opacity: 0;
}
[class*="chartts-anim-draw"] {
  animation: chartts-draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ---- Lines ---- */
.chartts-line {
  stroke-linecap: round; stroke-linejoin: round;
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
}
.chartts-series:hover .chartts-line { stroke-width: 2.5; }
.chartts-line[style*="--chartts-path-len"] {
  animation: chartts-draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ---- Area fills ---- */
.chartts-area { animation: chartts-fade 0.6s ease forwards; transition: opacity 0.2s ease; }

/* ---- Glow (no pointer events) ---- */
.chartts-line-glow, .chartts-point-glow, .chartts-dot-glow { pointer-events: none; }

/* ---- Interactive elements ---- */
.chartts-point, .chartts-dot, .chartts-bubble {
  transform-origin: center; transform-box: fill-box;
  animation: chartts-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--chartts-i, 0) * 10ms + 0.4s) forwards;
  opacity: 0; cursor: pointer;
  transition: opacity 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease;
}
.chartts-point:hover, .chartts-dot:hover, .chartts-bubble:hover { filter: brightness(1.15); }

/* ---- Bars (vertical) ---- */
.chartts-bar {
  transform-origin: bottom center; transform-box: fill-box;
  animation: chartts-grow-y 0.4s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--chartts-i, 0) * 15ms) forwards;
  opacity: 0; cursor: pointer;
  transition: filter 0.15s ease, opacity 0.15s ease;
}
.chartts-bar:hover { filter: brightness(1.12) saturate(1.1); }
.chartts-bar-horizontal {
  transform-origin: left center;
  animation-name: chartts-grow-x;
}

/* ---- Pie / Donut slices ---- */
.chartts-slice {
  transform-origin: center; transform-box: fill-box;
  animation: chartts-pop 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) calc(var(--chartts-i, 0) * 25ms) forwards;
  opacity: 0; cursor: pointer; pointer-events: all;
  transition: filter 0.2s ease, opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.chartts-slice:hover { filter: brightness(1.08) saturate(1.15) drop-shadow(0 2px 8px rgba(0,0,0,0.2)); transform: scale(1.04); }

/* ---- Sparkline ---- */
.chartts-sparkline-line { stroke-linecap: round; stroke-linejoin: round; }
.chartts-sparkline-line[style*="--chartts-path-len"] { animation: chartts-draw 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

/* ---- Radar ---- */
.chartts-radar-area {
  transform-origin: center; transform-box: fill-box;
  animation: chartts-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--chartts-radar-i, 0) * 35ms) forwards;
  opacity: 0; transition: opacity 0.2s ease, fill-opacity 0.2s ease;
}
.chartts-radar-area:hover { fill-opacity: 0.35; }
.chartts-radar-point {
  transform-origin: center; transform-box: fill-box;
  animation: chartts-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--chartts-i, 0) * 10ms + 0.5s) forwards;
  opacity: 0; cursor: pointer; transition: r 0.15s ease, opacity 0.15s ease;
}
.chartts-radar-point:hover { filter: brightness(1.15); }

/* ---- Gauge ---- */
.chartts-gauge-fill[style*="--chartts-path-len"] { animation: chartts-draw 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.chartts-gauge-needle { animation: chartts-fade 0.4s ease 0.6s forwards; opacity: 0; }
.chartts-gauge-needle-cap { animation: chartts-fade 0.3s ease 0.65s forwards; opacity: 0; }
.chartts-gauge-tick { opacity: 0.5; }

/* ---- Generic interactive elements (hover brightness) ---- */
.chartts-funnel-step, .chartts-waterfall-bar, .chartts-candle,
.chartts-heatmap-cell, .chartts-boxplot-box, .chartts-treemap-cell,
.chartts-polar-wedge, .chartts-radialbar-arc, .chartts-lollipop-dot,
.chartts-bullet-bar, .chartts-dumbbell-dot, .chartts-sankey-node,
.chartts-sunburst-sector, .chartts-tree-node, .chartts-graph-node,
.chartts-pictorialbar-symbol, .chartts-chord-arc, .chartts-geo-region,
.chartts-matrix-cell, .chartts-renko-brick, .chartts-violin-shape,
.chartts-pack-circle, .chartts-voronoi-cell, .chartts-wordcloud-word,
.chartts-volume-bar, .chartts-combo-point, .chartts-lines-node {
  cursor: pointer; transition: filter 0.15s ease;
}
.chartts-funnel-step:hover, .chartts-waterfall-bar:hover, .chartts-candle:hover,
.chartts-heatmap-cell:hover, .chartts-boxplot-box:hover, .chartts-treemap-cell:hover,
.chartts-polar-wedge:hover, .chartts-radialbar-arc:hover, .chartts-lollipop-dot:hover,
.chartts-bullet-bar:hover, .chartts-dumbbell-dot:hover, .chartts-sankey-node:hover,
.chartts-sunburst-sector:hover, .chartts-tree-node:hover, .chartts-graph-node:hover,
.chartts-pictorialbar-symbol:hover, .chartts-chord-arc:hover, .chartts-geo-region:hover,
.chartts-matrix-cell:hover, .chartts-renko-brick:hover, .chartts-violin-shape:hover,
.chartts-pack-circle:hover, .chartts-voronoi-cell:hover, .chartts-wordcloud-word:hover,
.chartts-volume-bar:hover, .chartts-lines-node:hover {
  filter: brightness(1.15);
}

/* ---- Specific overrides ---- */
.chartts-heatmap-cell:hover { filter: brightness(1.2) saturate(1.2); stroke: currentColor; stroke-width: 1.5; }
.chartts-slice:hover, .chartts-sunburst-sector:hover { fill-opacity: 0.95 !important; }
.chartts-sankey-link { transition: fill-opacity 0.15s ease; cursor: pointer; }
.chartts-sankey-link:hover { fill-opacity: 0.5 !important; }
.chartts-chord-ribbon { transition: fill-opacity 0.15s ease; cursor: pointer; }
.chartts-chord-ribbon:hover { fill-opacity: 0.55 !important; }
.chartts-themeriver-stream { transition: fill-opacity 0.15s ease; cursor: pointer; }
.chartts-themeriver-stream:hover { fill-opacity: 0.9 !important; }
.chartts-parallel-line { transition: opacity 0.2s ease, stroke-width 0.2s ease; cursor: pointer; }
.chartts-parallel-line:hover { opacity: 1 !important; stroke-width: 3; }
.chartts-lines-flow { transition: stroke-width 0.2s ease, stroke-opacity 0.2s ease; cursor: pointer; }
.chartts-lines-flow:hover { stroke-opacity: 0.9; stroke-width: 4; }
.chartts-geo-region:hover { filter: brightness(1.15) drop-shadow(0 0 2px rgba(0,0,0,0.3)); fill-opacity: 0.95 !important; stroke: #fff !important; stroke-width: 1.5px !important; }
.chartts-geo-label { pointer-events: none; text-shadow: 0 0 3px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.3); }
.chartts-geo-scatter { transition: r 0.15s ease, opacity 0.15s ease; cursor: pointer; }
.chartts-geo-scatter:hover { opacity: 0.9; filter: drop-shadow(0 0 4px currentColor); }

/* ---- No pointer events ---- */
.chartts-boxplot-whisker, .chartts-boxplot-cap, .chartts-boxplot-median,
.chartts-treemap-label, .chartts-treemap-value, .chartts-polar-label,
.chartts-polar-grid, .chartts-radialbar-track, .chartts-bullet-range,
.chartts-bullet-target, .chartts-bullet-label, .chartts-dumbbell-connector,
.chartts-dumbbell-label, .chartts-calendar-daylabel, .chartts-sankey-label,
.chartts-combo-line, .chartts-sunburst-label, .chartts-tree-edge,
.chartts-tree-label, .chartts-graph-label, .chartts-parallel-axis,
.chartts-parallel-label, .chartts-parallel-tick, .chartts-themeriver-label,
.chartts-pictorialbar-value, .chartts-pictorialbar-label, .chartts-chord-label,
.chartts-violin-box, .chartts-violin-median, .chartts-pack-label,
.chartts-voronoi-seed, .chartts-voronoi-label, .chartts-graph-edge,
.chartts-geo-legend text, .chartts-range-bound, .chartts-baseline-ref,
.chartts-wick, .chartts-lollipop-stem {
  pointer-events: none;
}

/* ---- States (empty / loading / error) ---- */
.chartts-state { opacity: 1; }
.chartts-skeleton-bar { animation: chartts-shimmer 1.5s ease-in-out infinite; animation-delay: calc(var(--chartts-i, 0) * 40ms); }

/* ---- DataZoom ---- */
.chartts-datazoom-handle { cursor: ew-resize; transition: fill 0.15s ease; }
.chartts-datazoom-handle:hover { fill: #374151; }
.chartts-datazoom-selected { cursor: grab; }

/* ---- Grid ---- */
.chartts-grid-h, .chartts-grid-v { opacity: 0.6; }

/* ---- Text ---- */
.chartts-x-label, .chartts-y-label, .chartts-x-axis-label, .chartts-y-axis-label,
.chartts-legend text, .chartts-slice-label { user-select: none; pointer-events: none; }

/* ---- Legend ---- */
.chartts-legend-item { cursor: pointer; transition: opacity 0.15s ease; }
.chartts-legend-item:hover { opacity: 0.7; }

/* ---- Skip animations on data update ---- */
.chartts-skip-anim *, .chartts-skip-anim [class*="chartts-anim-"] {
  animation: none !important; opacity: 1 !important;
}
.chartts-skip-anim .chartts-line, .chartts-skip-anim .chartts-sparkline-line,
.chartts-skip-anim .chartts-gauge-fill { stroke-dashoffset: 0 !important; }

/* ---- Reduced motion ---- */
@media (prefers-reduced-motion: reduce) {
  .chartts *, .chartts [class*="chartts-anim-"] {
    animation: none !important; opacity: 1 !important;
  }
  .chartts .chartts-line, .chartts .chartts-sparkline-line,
  .chartts .chartts-gauge-fill { stroke-dashoffset: 0 !important; }
}
`
