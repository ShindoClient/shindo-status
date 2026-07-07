<script lang="ts">
let {
  points = [],
  width = '100%',
  height = '100%',
  color = '#7f5fff',
  fill = true,
  fillColor = '',
  smooth = true,
  strokeWidth = 2,
  class: className = ''
}: {
  points: number[]
  width?: number | string
  height?: number | string
  color?: string
  fill?: boolean
  fillColor?: string
  smooth?: boolean
  strokeWidth?: number
  class?: string
} = $props()

let uid = $state(Math.random().toString(36).slice(2, 9))

const resolvedFillColor = $derived(fillColor || color)

const paths = $derived.by(() => {
  if (points.length <= 1) return { stroke: '', fill: '' }

  const validPoints = points.filter(p => typeof p === 'number' && isFinite(p))
  if (validPoints.length <= 1) return { stroke: '', fill: '' }

  const max = Math.max(...validPoints)
  const min = Math.min(...validPoints)
  const range = max - min || 1
  const padding = 2
  const step = validPoints.length > 1 ? 100 / (validPoints.length - 1) : 0

  let strokeD = ''
  let fillD = ''

  validPoints.forEach((point, i) => {
    const x = i * step
    const y = 100 - ((point - min) / range * (100 - padding * 2) + padding)

    if (i === 0) {
      strokeD = `M ${x} ${y}`
      fillD = `M ${x} 100 L ${x} ${y}`
    } else if (smooth && i < validPoints.length - 1) {
      const nextX = (i + 1) * step
      const nextY = 100 - ((validPoints[i + 1] - min) / range * (100 - padding * 2) + padding)
      const cp1x = x + (nextX - x) * 0.3
      const cp1y = y
      const cp2x = x + (nextX - x) * 0.7
      const cp2y = nextY
      const bezier = `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${nextX} ${nextY}`
      strokeD += ` ${bezier}`
      fillD += ` ${bezier}`
    } else {
      const line = `L ${x} ${y}`
      strokeD += ` ${line}`
      fillD += ` ${line}`
    }
  })

  const lastX = (validPoints.length - 1) * step
  fillD += ` L ${lastX} 100 Z`

  return { stroke: strokeD, fill: fillD }
})

const containerWidth = $derived(typeof width === 'number' ? `${width}px` : width)
const containerHeight = $derived(typeof height === 'number' ? `${height}px` : height)

const hasNoData = $derived(points.length <= 1)
</script>

<div class="sparkline-container {className}" style="width: {containerWidth}; height: {containerHeight}">
  {#if hasNoData}
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
      <line x1="0" y1="50" x2="100" y2="50" stroke={color} stroke-width={strokeWidth} stroke-linecap="round" opacity="0.3" />
    </svg>
  {:else}
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
      <defs>
        <linearGradient id={`sparkline-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={resolvedFillColor} stop-opacity={fillColor ? '1' : '0.15'} />
          <stop offset="100%" stop-color={resolvedFillColor} stop-opacity="0" />
        </linearGradient>
      </defs>
      {#if fill && paths.fill}
        <path d={paths.fill} fill={`url(#sparkline-fill-${uid})`} />
      {/if}
      {#if paths.stroke}
        <path
          d={paths.stroke}
          fill="none"
          stroke={color}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {/if}
    </svg>
  {/if}
</div>

<style>
  .sparkline-container {
    position: relative;
    overflow: hidden;
  }
</style>
