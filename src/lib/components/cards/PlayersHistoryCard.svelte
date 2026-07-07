<script lang="ts">
import { Users } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'
import Sparkline from '$lib/components/Sparkline.svelte'

interface Point {
  t: number
  count: number
  latency?: number | null
}

let {
  loading = false,
  series = []
}: {
  loading?: boolean
  series?: Point[]
} = $props()

const safeSeries = $derived.by(() => {
  if (!Array.isArray(series)) return []
  return series
    .map(p => ({
      t: p?.t || 0,
      count: typeof p?.count === 'number' ? Math.max(0, p.count) : 0
    }))
    .filter(Boolean)
})

const playerCounts = $derived(safeSeries.map(p => p.count))

const stats = $derived.by(() => {
  if (!playerCounts.length) return { min: 0, max: 1, current: 0, total: 0, avg: 0 }

  const counts = playerCounts
  const current = counts[counts.length - 1] || 0
  const min = Math.min(...counts)
  const max = Math.max(...counts, 1)
  const total = counts.reduce((sum, count) => sum + count, 0)

  return { min, max, current, total, avg: total / counts.length || 0 }
})
</script>

<BaseCard class="h-full flex flex-col">
  <div class="relative px-6 py-4 border-b border-gray-700/50">
    <div class="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-gray-900/30 opacity-50 rounded-t-lg"></div>
    <div class="relative z-10 flex items-center gap-3">
      <div class="p-2 rounded-lg bg-blue-500/10 text-blue-300">
        <Users class="w-5 h-5" />
      </div>
      <h3 class="text-sm font-semibold text-white/90">Hist\u00f3rico de Jogadores</h3>
    </div>
  </div>

  <div class="flex-1 p-6 flex flex-col">
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : stats.current}</div>
        <div class="text-xs text-white/60">Atual</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : Math.round(stats.avg)}</div>
        <div class="text-xs text-white/60">M\u00e9dia</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{loading ? '--' : stats.max}</div>
        <div class="text-xs text-white/60">M\u00e1x</div>
      </div>
    </div>

    <div class="flex-1 min-h-[100px] -mx-2 -mb-2">
      {#if loading}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Carregando...</div>
        </div>
      {:else if !playerCounts.length}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Sem dados dispon\u00edveis</div>
        </div>
      {:else}
        <Sparkline
          points={playerCounts}
          color="#3b82f6"
          fillColor="rgba(59, 130, 246, 0.15)"
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
