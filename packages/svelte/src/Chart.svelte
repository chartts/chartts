<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import {
    createChart,
    type ChartData, type ChartOptions, type ChartInstance, type ChartTypePlugin,
  } from '@chartts/core'

  let {
    type: chartType,
    data,
    class: className = '',
    ...options
  }: { type: ChartTypePlugin; data: ChartData; class?: string } & ChartOptions = $props()

  let container: HTMLDivElement
  let instance: ChartInstance | null = null

  onMount(() => {
    instance = createChart(container, chartType, data, options)
  })

  $effect(() => {
    instance?.setData(data)
  })

  $effect(() => {
    instance?.setOptions(options)
  })

  onDestroy(() => {
    instance?.destroy()
    instance = null
  })

  export function getInstance(): ChartInstance | null {
    return instance
  }
</script>

<div bind:this={container} class={className}></div>
