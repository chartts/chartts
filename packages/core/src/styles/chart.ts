/**
 * Embedded CSS for chart animations, hover effects, and visual polish.
 * Injected into SVG <defs> as a <style> element.
 */

export const CHART_CSS = /* css */ `
/* ---- Base ---- */
.chartts {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---- Lines ---- */
.chartts-line {
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
}
.chartts-series:hover .chartts-line {
  stroke-width: 2.5;
}

/* Line draw animation */
@keyframes chartts-draw {
  from { stroke-dashoffset: var(--chartts-path-len); }
  to { stroke-dashoffset: 0; }
}
.chartts-line[style*="--chartts-path-len"] {
  animation: chartts-draw 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ---- Area fills ---- */
@keyframes chartts-fade-up {
  from { opacity: 0; }
  to { opacity: 1; }
}
.chartts-area {
  animation: chartts-fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transition: opacity 0.2s ease;
}

/* ---- Line glow ---- */
.chartts-line-glow {
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

/* ---- Point glow ---- */
.chartts-point-glow, .chartts-dot-glow {
  pointer-events: none;
}

/* ---- Data points ---- */
@keyframes chartts-point-pop {
  0% { opacity: 0; transform: scale(0); }
  60% { transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-point {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-point-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 30ms + 0.4s);
  opacity: 0;
  transition: opacity 0.15s ease, stroke-width 0.15s ease;
  cursor: pointer;
}
.chartts-point:hover {
  stroke-width: 3;
  filter: brightness(1.15);
}

/* ---- Bars ---- */
@keyframes chartts-bar-in {
  from { opacity: 0; transform: scaleY(0.3); }
  to { opacity: 1; transform: scaleY(1); }
}
.chartts-bar {
  transform-origin: bottom center;
  transform-box: fill-box;
  animation: chartts-bar-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 40ms);
  opacity: 0;
  transition: filter 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.chartts-bar:hover {
  filter: brightness(1.12) saturate(1.1);
}
.chartts-bar-horizontal {
  transform-origin: left center;
  animation-name: chartts-hbar-in;
}
@keyframes chartts-hbar-in {
  from { opacity: 0; transform: scaleX(0.3); }
  to { opacity: 1; transform: scaleX(1); }
}

/* ---- Pie / Donut slices ---- */
@keyframes chartts-slice-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-slice {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-slice-in 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 60ms);
  opacity: 0;
  transition: filter 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
  pointer-events: all;
}
.chartts-slice:hover {
  filter: brightness(1.1) saturate(1.15);
  opacity: 0.92;
}

/* ---- Sparkline ---- */
.chartts-sparkline-line {
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chartts-sparkline-line[style*="--chartts-path-len"] {
  animation: chartts-draw 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ---- Radar ---- */
@keyframes chartts-radar-in {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-radar-area {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-radar-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-radar-i, 0) * 120ms);
  opacity: 0;
  transition: opacity 0.2s ease, fill-opacity 0.2s ease;
}
.chartts-radar-area:hover {
  fill-opacity: 0.35;
}
.chartts-radar-point {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-point-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 30ms + 0.5s);
  opacity: 0;
  transition: r 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.chartts-radar-point:hover {
  filter: brightness(1.15);
}

/* ---- Gauge ---- */
@keyframes chartts-gauge-draw {
  from { stroke-dashoffset: var(--chartts-path-len); }
  to { stroke-dashoffset: 0; }
}
@keyframes chartts-gauge-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.chartts-gauge-fill[style*="--chartts-path-len"] {
  animation: chartts-gauge-draw 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.chartts-gauge-needle {
  animation: chartts-gauge-fade 0.4s ease 0.6s forwards;
  opacity: 0;
}
.chartts-gauge-needle-cap {
  animation: chartts-gauge-fade 0.3s ease 0.65s forwards;
  opacity: 0;
}
.chartts-gauge-tick {
  opacity: 0.5;
}

/* ---- Funnel ---- */
@keyframes chartts-funnel-slide {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.chartts-funnel-step {
  animation: chartts-funnel-slide 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 80ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-funnel-step:hover {
  filter: brightness(1.1);
}

/* ---- Waterfall ---- */
@keyframes chartts-waterfall-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.chartts-waterfall-bar {
  animation: chartts-waterfall-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 50ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-waterfall-bar:hover {
  filter: brightness(1.12);
}

/* ---- Candlestick ---- */
@keyframes chartts-candle-in {
  from { opacity: 0; transform: scaleY(0.5); }
  to { opacity: 1; transform: scaleY(1); }
}
.chartts-candle {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-candle-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 50ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-candle:hover {
  filter: brightness(1.15);
}
.chartts-wick {
  transition: opacity 0.15s ease;
}

/* ---- Bubble ---- */
@keyframes chartts-bubble-pop {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-bubble {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-bubble-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 50ms);
  opacity: 0;
  transition: filter 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.chartts-bubble:hover {
  filter: brightness(1.1) saturate(1.1);
}

/* ---- Scatter dots ---- */
.chartts-dot {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-point-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 30ms);
  opacity: 0;
  transition: filter 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.chartts-dot:hover {
  filter: brightness(1.15);
  opacity: 1;
}

/* ---- Heatmap ---- */
@keyframes chartts-cell-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.chartts-heatmap-cell {
  animation: chartts-cell-in 0.3s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 15ms);
  opacity: 0;
  transition: filter 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.chartts-heatmap-cell:hover {
  filter: brightness(1.2) saturate(1.2);
  stroke: currentColor;
  stroke-width: 1.5;
}

/* ---- Boxplot ---- */
@keyframes chartts-boxplot-in {
  from { opacity: 0; transform: scaleY(0.4); }
  to { opacity: 1; transform: scaleY(1); }
}
.chartts-boxplot-box {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-boxplot-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 60ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-boxplot-box:hover {
  filter: brightness(1.15);
}
.chartts-boxplot-whisker, .chartts-boxplot-cap, .chartts-boxplot-median {
  pointer-events: none;
}

/* ---- Treemap ---- */
@keyframes chartts-cell-grow {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-treemap-cell {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-cell-grow 0.4s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 40ms);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.chartts-treemap-cell:hover {
  filter: brightness(1.15);
}
.chartts-treemap-label, .chartts-treemap-value {
  pointer-events: none;
}

/* ---- Polar ---- */
@keyframes chartts-wedge-in {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-polar-wedge {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-wedge-in 0.5s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 50ms);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.chartts-polar-wedge:hover {
  filter: brightness(1.15);
}
.chartts-polar-label {
  pointer-events: none;
}
.chartts-polar-grid {
  pointer-events: none;
}

/* ---- Radial Bar ---- */
@keyframes chartts-radialbar-in {
  from { opacity: 0; stroke-dashoffset: var(--chartts-path-len, 200); }
  to { opacity: 1; stroke-dashoffset: 0; }
}
.chartts-radialbar-arc {
  animation: chartts-radialbar-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 100ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-radialbar-arc:hover {
  filter: brightness(1.15);
}
.chartts-radialbar-track {
  pointer-events: none;
}

/* ---- Lollipop ---- */
@keyframes chartts-lollipop-in {
  from { opacity: 0; transform: scaleY(0.3); }
  to { opacity: 1; transform: scaleY(1); }
}
.chartts-lollipop-stem {
  transform-origin: bottom center;
  transform-box: fill-box;
  animation: chartts-lollipop-in 0.4s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 40ms);
}
.chartts-lollipop-dot {
  cursor: pointer;
  transition: r 0.15s ease, filter 0.15s ease;
}
.chartts-lollipop-dot:hover {
  filter: brightness(1.15);
}

/* ---- Bullet ---- */
@keyframes chartts-bullet-in {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.chartts-bullet-bar {
  transform-origin: left center;
  transform-box: fill-box;
  animation: chartts-bullet-in 0.5s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 80ms);
  cursor: pointer;
  transition: filter 0.15s ease;
}
.chartts-bullet-bar:hover {
  filter: brightness(1.15);
}
.chartts-bullet-range, .chartts-bullet-target, .chartts-bullet-label {
  pointer-events: none;
}

/* ---- Dumbbell ---- */
@keyframes chartts-dumbbell-in {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-dumbbell-dot {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-dumbbell-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 60ms);
  opacity: 0;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.chartts-dumbbell-dot:hover {
  filter: brightness(1.15);
}
.chartts-dumbbell-connector, .chartts-dumbbell-label {
  pointer-events: none;
}

/* ---- Calendar ---- */
.chartts-calendar-cell {
  cursor: pointer;
  transition: filter 0.15s ease;
  animation: chartts-cell-in 0.3s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 8ms);
}
.chartts-calendar-cell:hover {
  filter: brightness(1.2);
}
.chartts-calendar-daylabel {
  pointer-events: none;
}

/* ---- Sankey ---- */
@keyframes chartts-sankey-link-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.chartts-sankey-link {
  animation: chartts-sankey-link-in 0.5s ease forwards;
  opacity: 0;
  transition: fill-opacity 0.15s ease;
  cursor: pointer;
}
.chartts-sankey-link:hover {
  fill-opacity: 0.5 !important;
}
.chartts-sankey-node {
  cursor: pointer;
  transition: filter 0.15s ease;
}
.chartts-sankey-node:hover {
  filter: brightness(1.15);
}
.chartts-sankey-label {
  pointer-events: none;
}

/* ---- Combo ---- */
.chartts-combo-line {
  pointer-events: none;
}
.chartts-combo-point {
  cursor: pointer;
  transition: r 0.15s ease;
}

/* ---- Sunburst ---- */
@keyframes chartts-sunburst-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-sunburst-sector {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-sunburst-in 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 30ms);
  opacity: 0;
  transition: filter 0.15s ease, fill-opacity 0.15s ease;
  cursor: pointer;
}
.chartts-sunburst-sector:hover {
  filter: brightness(1.15);
  fill-opacity: 0.95 !important;
}
.chartts-sunburst-label {
  pointer-events: none;
}

/* ---- Tree ---- */
@keyframes chartts-tree-node-in {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-tree-node {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-tree-node-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 50ms);
  opacity: 0;
  transition: filter 0.15s ease, r 0.15s ease;
  cursor: pointer;
}
.chartts-tree-node:hover {
  filter: brightness(1.15);
}
.chartts-tree-edge {
  opacity: 0.6;
  pointer-events: none;
}
.chartts-tree-label {
  pointer-events: none;
}

/* ---- Graph ---- */
@keyframes chartts-graph-node-in {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-graph-node {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-graph-node-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 40ms);
  opacity: 0;
  transition: filter 0.15s ease, r 0.15s ease;
  cursor: pointer;
}
.chartts-graph-node:hover {
  filter: brightness(1.15) saturate(1.2);
}
.chartts-graph-edge {
  pointer-events: none;
  animation: chartts-sankey-link-in 0.5s ease forwards;
  opacity: 0;
}
.chartts-graph-label {
  pointer-events: none;
}

/* ---- Parallel ---- */
@keyframes chartts-parallel-in {
  from { opacity: 0; stroke-dashoffset: var(--chartts-path-len, 1000); }
  to { opacity: 1; stroke-dashoffset: 0; }
}
.chartts-parallel-line {
  transition: opacity 0.2s ease, stroke-width 0.2s ease;
  cursor: pointer;
}
.chartts-parallel-line:hover {
  opacity: 1 !important;
  stroke-width: 3;
}
.chartts-parallel-axis {
  pointer-events: none;
}
.chartts-parallel-label, .chartts-parallel-tick {
  pointer-events: none;
}

/* ---- ThemeRiver ---- */
@keyframes chartts-stream-in {
  from { opacity: 0; transform: scaleY(0.3); }
  to { opacity: 1; transform: scaleY(1); }
}
.chartts-themeriver-stream {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-stream-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 80ms);
  opacity: 0;
  transition: fill-opacity 0.15s ease;
  cursor: pointer;
}
.chartts-themeriver-stream:hover {
  fill-opacity: 0.9 !important;
}
.chartts-themeriver-label {
  pointer-events: none;
}

/* ---- PictorialBar ---- */
@keyframes chartts-pictorial-in {
  0% { opacity: 0; transform: scale(0); }
  70% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
.chartts-pictorialbar-symbol {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-pictorial-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--chartts-i, 0) * 20ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-pictorialbar-symbol:hover {
  filter: brightness(1.15);
}
.chartts-pictorialbar-value, .chartts-pictorialbar-label {
  pointer-events: none;
}

/* ---- Chord ---- */
@keyframes chartts-chord-arc-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.chartts-chord-arc {
  transform-origin: center;
  transform-box: fill-box;
  animation: chartts-chord-arc-in 0.5s ease forwards;
  animation-delay: calc(var(--chartts-i, 0) * 60ms);
  opacity: 0;
  transition: filter 0.15s ease;
  cursor: pointer;
}
.chartts-chord-arc:hover {
  filter: brightness(1.15);
}
@keyframes chartts-chord-ribbon-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.chartts-chord-ribbon {
  animation: chartts-chord-ribbon-in 0.6s ease 0.3s forwards;
  opacity: 0;
  transition: fill-opacity 0.15s ease;
  cursor: pointer;
}
.chartts-chord-ribbon:hover {
  fill-opacity: 0.55 !important;
}
.chartts-chord-label {
  pointer-events: none;
}

/* ---- States (empty / loading / error) ---- */
.chartts-state {
  opacity: 1;
}
@keyframes chartts-shimmer {
  0% { opacity: 0.3; }
  50% { opacity: 0.7; }
  100% { opacity: 0.3; }
}
.chartts-skeleton-bar {
  animation: chartts-shimmer 1.5s ease-in-out infinite;
  animation-delay: calc(var(--chartts-i, 0) * 150ms);
}

/* ---- Grid ---- */
.chartts-grid-h, .chartts-grid-v {
  opacity: 0.6;
}

/* ---- Text ---- */
.chartts-x-label, .chartts-y-label,
.chartts-x-axis-label, .chartts-y-axis-label,
.chartts-legend text, .chartts-slice-label {
  user-select: none;
  pointer-events: none;
}

/* ---- Legend ---- */
.chartts-legend-item {
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.chartts-legend-item:hover {
  opacity: 0.7;
}

/* ---- Reduced motion ---- */
@media (prefers-reduced-motion: reduce) {
  .chartts-line, .chartts-area, .chartts-point,
  .chartts-bar, .chartts-slice, .chartts-bubble,
  .chartts-funnel-step, .chartts-waterfall-bar,
  .chartts-sparkline-line, .chartts-gauge-fill,
  .chartts-gauge-needle, .chartts-gauge-needle-cap,
  .chartts-radar-area, .chartts-radar-point,
  .chartts-treemap-cell, .chartts-polar-wedge,
  .chartts-lollipop-stem, .chartts-bullet-bar,
  .chartts-dumbbell-dot, .chartts-boxplot-box,
  .chartts-radialbar-arc, .chartts-sankey-link,
  .chartts-calendar-cell,
  .chartts-sunburst-sector, .chartts-tree-node,
  .chartts-graph-node, .chartts-graph-edge,
  .chartts-themeriver-stream, .chartts-pictorialbar-symbol,
  .chartts-chord-arc, .chartts-chord-ribbon {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .chartts-gauge-fill {
    stroke-dashoffset: 0 !important;
  }
}
`
