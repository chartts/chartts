<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import {
    createChart, graphChartType,
    type ChartData, type ChartOptions, type ChartInstance,
  } from '@chartts/core'

  let {
    data,
    class: className = '',
    ...options
  }: { data: ChartData; class?: string } & ChartOptions = $props()

  let container: HTMLDivElement
  let instance: ChartInstance | null = null

  onMount(() => {
    instance = createChart(container, graphChartType, data, options)
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
