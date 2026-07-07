<script lang="ts">
import { Server, Clock } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'
import Sparkline from '$lib/components/Sparkline.svelte'

interface Point {
  t: number
  ok: boolean
}

let {
  loading = false,
  data = { ok: false },
  series = []
}: {
  loading?: boolean
  data?: { ok: boolean }
  series?: Point[]
} = $props()

const uptimePercentage = $derived.by(() => {
  if (loading) return '\u2014\u2014'
  if (!series.length) return '\u2014\u2014'

  const total = series.length
  if (total === 0) return '\u2014\u2014'

  const upCount = series.filter(p => p.ok).length
  return Math.round((upCount / total) * 100)
})

const uptimePoints = $derived(series.map(p => p.ok ? 1 : 0))

type Status = 'loading' | 'up' | 'down'

const currentStatus: Status = $derived.by(() => {
  if (loading) return 'loading'

  if (series.length > 0) {
    return series[series.length - 1]?.ok ? 'up' : 'down'
  }

  return data?.ok ? 'up' : 'down'
})

const lastUpdated = $derived.by(() => {
  if (!series || series.length === 0) return '\u2014\u2014'

  const lastPoint = series[series.length - 1]
  if (!lastPoint) return '\u2014\u2014'

  const lastTime = lastPoint.t
  const diffMs = Date.now() - lastTime
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `H\u00e1 ${diffMins}m`
  const hours = Math.floor(diffMins / 60)
  return `H\u00e1 ${hours}h`
})
</script>

<BaseCard class="h-full flex flex-col">
  <div class="relative px-6 py-4 border-b border-gray-700/50">
    <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50 rounded-t-lg"></div>
    <div class="relative z-10 flex items-center gap-3">
      <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-300">
        <Server class="w-5 h-5" />
      </div>
      <h3 class="text-sm font-semibold text-white/90">Hist\u00f3rico de Uptime</h3>
    </div>
  </div>

  <div class="flex-1 p-6 flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="text-3xl font-bold text-white">
          {uptimePercentage}{#if uptimePercentage !== '\u2014\u2014'}<span class="text-sm font-normal text-white/60 ml-1">%</span>{/if}
        </div>
        <div class="text-xs text-white/60">Taxa de disponibilidade</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-medium text-white flex items-center justify-end gap-2">
          <span>Status:</span>
          {#if loading}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-300 border border-gray-500/20">
              Carregando...
            </span>
          {:else if currentStatus === 'up'}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Online
            </span>
          {:else}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
              Offline
            </span>
          {/if}
        </div>
        <div class="text-xs text-white/40 mt-1 flex items-center justify-end gap-1">
          <Clock class="w-3 h-3" />
          {lastUpdated}
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-[100px] -mx-2 -mb-2">
      {#if loading}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Carregando...</div>
        </div>
      {:else if !uptimePoints.length}
        <div class="h-full flex items-center justify-center">
          <div class="text-white/50">Aguardando dados...</div>
        </div>
      {:else}
        <Sparkline
          points={uptimePoints}
          color="#8b5cf6"
          fill={false}
          smooth={true}
          strokeWidth={2}
          class="h-full w-full"
        />
      {/if}
    </div>

    <div class="flex justify-between text-xs text-white/40 mt-2 px-1">
      <span>H\u00e1 24h</span>
      <span>Agora</span>
    </div>
  </div>
</BaseCard>
