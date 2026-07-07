<script lang="ts">
import { Gauge } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'

let {
  loading,
  latencyMs
}: {
  loading: boolean
  latencyMs: number | null
} = $props()

type LatencyStatus = 'loading' | 'excellent' | 'good' | 'poor'

const latencyStatus: LatencyStatus = $derived.by(() => {
  if (loading || latencyMs === null || latencyMs === undefined) return 'loading'
  if (latencyMs < 150) return 'excellent'
  if (latencyMs < 400) return 'good'
  return 'poor'
})

const statusConfig: Record<LatencyStatus, { color: string; text: string; label: string }> = {
  loading: { color: 'bg-gray-500', text: 'Carregando...', label: 'N/A' },
  excellent: { color: 'bg-emerald-500', text: 'R\u00e1pida', label: '\u00d3tima' },
  good: { color: 'bg-yellow-500', text: 'M\u00e9dia', label: 'Boa' },
  poor: { color: 'bg-red-500', text: 'Lenta', label: 'Alta' }
}

const currentStatus = $derived(statusConfig[latencyStatus])

const barPct = $derived.by(() => {
  if (latencyMs === null || latencyMs === undefined) return 0
  const capped = Math.min(800, Math.max(0, latencyMs))
  return (capped / 800) * 100
})

const styleConfig: Record<LatencyStatus, {
  border: string
  glowVia: string
  barColor: string
  iconBg: string
  badge: string
}> = {
  loading: {
    border: 'border-gray-500/50 hover:border-gray-400/60',
    glowVia: 'via-gray-500/5',
    barColor: 'bg-gray-500',
    iconBg: 'bg-gray-500/10 text-gray-500/80',
    badge: 'bg-gray-500/10 text-gray-500/90 border-gray-500/20'
  },
  excellent: {
    border: 'border-emerald-500/50 hover:border-emerald-400/60',
    glowVia: 'via-emerald-500/5',
    barColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/10 text-emerald-500/80',
    badge: 'bg-emerald-500/10 text-emerald-500/90 border-emerald-500/20'
  },
  good: {
    border: 'border-yellow-500/50 hover:border-yellow-400/60',
    glowVia: 'via-yellow-500/5',
    barColor: 'bg-yellow-500',
    iconBg: 'bg-yellow-500/10 text-yellow-500/80',
    badge: 'bg-yellow-500/10 text-yellow-500/90 border-yellow-500/20'
  },
  poor: {
    border: 'border-red-500/50 hover:border-red-400/60',
    glowVia: 'via-red-500/5',
    barColor: 'bg-red-500',
    iconBg: 'bg-red-500/10 text-red-500/80',
    badge: 'bg-red-500/10 text-red-500/90 border-red-500/20'
  }
}

const currentStyle = $derived(styleConfig[latencyStatus])
</script>

<BaseCard class="group relative overflow-hidden border-2 transition-all duration-300 {currentStyle.border}">
  <div
    class="absolute inset-0 bg-gradient-to-br from-accent-500/0 via-accent-500/5 to-accent-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none {currentStyle.glowVia}"
  ></div>

  {#snippet header()}
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg {currentStyle.iconBg}">
          <Gauge class="w-5 h-5" />
        </div>
        <h3 class="text-sm font-semibold text-white/90">Lat\u00eancia</h3>
      </div>
      <div class="px-3 py-1 text-xs font-medium rounded-full border {currentStyle.badge}">
        {currentStatus.label}
      </div>
    </div>
  {/snippet}

  <div class="space-y-4 relative z-10">
    <div class="text-3xl font-bold text-white">
      {#if loading || latencyMs === null}
        <span class="text-gray-400">--</span>
      {:else}
        {latencyMs}<span class="text-lg text-gray-400">ms</span>
      {/if}
    </div>

    <div class="mt-4">
      <div class="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out {currentStyle.barColor}"
          style="width: {barPct}%"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>0ms</span>
        <span>800ms+</span>
      </div>
    </div>
  </div>

  <p class="text-sm text-gray-400">
    {currentStatus.text}
  </p>
</BaseCard>
