<script lang="ts">
import { Gauge } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'
import Sparkline from '$lib/components/Sparkline.svelte'

interface Point {
  t: number
  latency: number | null
  count?: number
}

let {
  loading = false,
  series = []
}: {
  loading?: boolean
  series?: Point[]
} = $props()

type LatencyStatus = 'loading' | 'excellent' | 'good' | 'poor'

const safeSeries = $derived.by(() => {
  if (!Array.isArray(series)) return []
  return series
    .map(p => ({
      t: p?.t || 0,
      latency: p?.latency !== null && p?.latency !== undefined ? Math.max(0, Number(p.latency)) : null
    }))
    .filter((p): p is { t: number; latency: number } => p.latency !== null)
})

const latencyValues = $derived(safeSeries.map(p => p.latency))

const stats = $derived.by(() => {
  if (!latencyValues.length) return { min: 0, max: 1, current: 0, avg: 0 }

  const values = latencyValues
  const current = values[values.length - 1] || 0
  const min = Math.min(...values)
  const max = Math.max(...values, 1)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length

  return { min, max, current, avg }
})

const latencyStatus: LatencyStatus = $derived.by(() => {
  if (loading) return 'loading'
  if (stats.current < 150) return 'excellent'
  if (stats.current < 400) return 'good'
  return 'poor'
})

const statusConfig: Record<LatencyStatus, { color: string; text: string; label: string }> = {
  loading: { color: 'bg-gray-500', text: 'Carregando...', label: 'N/A' },
  excellent: { color: 'bg-emerald-500', text: 'R\u00e1pida', label: '\u00d3tima' },
  good: { color: 'bg-yellow-500', text: 'M\u00e9dia', label: 'Boa' },
  poor: { color: 'bg-red-500', text: 'Lenta', label: 'Alta' }
}

const currentStatus = $derived(statusConfig[latencyStatus])

const styleConfig: Record<LatencyStatus, {
  iconBg: string
  badge: string
  sparkColor: string
  sparkFill: string
}> = {
  loading: {
    iconBg: 'bg-gray-500/10 text-gray-500/80',
    badge: 'bg-gray-500/10 text-gray-500/90 border border-gray-500/20',
    sparkColor: '#6b7280',
    sparkFill: 'rgba(107, 114, 128, 0.15)'
  },
  excellent: {
    iconBg: 'bg-emerald-500/10 text-emerald-500/80',
    badge: 'bg-emerald-500/10 text-emerald-500/90 border border-emerald-500/20',
    sparkColor: '#10b981',
    sparkFill: 'rgba(16, 185, 129, 0.15)'
  },
  good: {
    iconBg: 'bg-yellow-500/10 text-yellow-500/80',
    badge: 'bg-yellow-500/10 text-yellow-500/90 border border-yellow-500/20',
    sparkColor: '#eab308',
    sparkFill: 'rgba(234, 179, 8, 0.15)'
  },
  poor: {
    iconBg: 'bg-red-500/10 text-red-500/80',
    badge: 'bg-red-500/10 text-red-500/90 border border-red-500/20',
    sparkColor: '#ef4444',
    sparkFill: 'rgba(239, 68, 68, 0.15)'
  }
}

const currentStyle = $derived(styleConfig[latencyStatus])
</script>

<BaseCard class="h-full flex flex-col">
  <div class="relative px-6 py-4 border-b border-gray-700/50">
    <div class="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-900/30 opacity-50 rounded-t-lg"></div>
    <div class="relative z-10 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg {currentStyle.iconBg}">
          <Gauge class="w-5 h-5" />
        </div>
        <h3 class="text-sm font-semibold text-white/90">Hist\u00f3rico de Lat\u00eancia</h3>
      </div>
      <div class="px-3 py-1 text-xs font-medium rounded-full {currentStyle.badge}">
        {currentStatus.label}
      </div>
    </div>
  </div>

  <div class="flex-1 p-6 flex flex-col">
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : Math.round(stats.current)}<span class="text-sm font-normal text-white/60 ml-0.5">ms</span></div>
        <div class="text-xs text-white/60">Atual</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : Math.round(stats.avg)}<span class="text-sm font-normal text-white/60 ml-0.5">ms</span></div>
        <div class="text-xs text-white/60">M\u00e9dia</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : Math.round(stats.max)}<span class="text-sm font-normal text-white/60 ml-0.5">ms</span></div>
        <div class="text-xs text-white/60">M\u00e1x</div>
      </div>
    </div>

    <div class="flex-1 min-h-[100px] -mx-2 -mb-2">
      {#if loading}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Carregando...</div>
        </div>
      {:else if !latencyValues.length}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Sem dados dispon\u00edveis</div>
        </div>
      {:else}
        <Sparkline
          points={latencyValues}
          color={currentStyle.sparkColor}
          fillColor={currentStyle.sparkFill}
          smooth={true}
          class="h-full w-full"
        />
      {/if}
    </div>

    <div class="flex justify-between text-xs text-white/40 mt-2 px-1">
      <span>H\u00e1 10 min</span>
      <span>Agora</span>
    </div>
  </div>
</BaseCard>
