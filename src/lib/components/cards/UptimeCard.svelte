<script lang="ts">
import { Wifi, WifiOff } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'

let {
  loading,
  data
}: {
  loading: boolean
  data?: { ok: boolean; startedAt?: string; uptimeMs?: number }
} = $props()

const ok = $derived(data?.ok ?? false)
const started = $derived(data?.startedAt ? new Date(data.startedAt) : null)
const uptimeMs = $derived(data?.uptimeMs ?? null)

function fmt(ms: number | null): string {
  if (!ms) return '\u2014'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (s < 60 || parts.length === 0) parts.push(`${sec}s`)
  return parts.length > 0 ? parts.join(' ') : '\u2014'
}
</script>

<BaseCard>
  {#snippet header()}
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg {ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}">
          {#if ok}
            <Wifi class="w-5 h-5" />
          {:else}
            <WifiOff class="w-5 h-5" />
          {/if}
        </div>
        <h3 class="text-sm font-semibold text-white/90">Status do Servidor</h3>
      </div>
      <div class="px-2.5 py-1 text-xs font-medium rounded-full border {ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}">
        {ok ? 'ONLINE' : 'OFFLINE'}
      </div>
    </div>
  {/snippet}

  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-xs font-medium text-white/60 mb-1">Iniciado em</div>
        <div class="text-sm font-medium text-white/90">
          {loading ? '...' : (started ? started.toLocaleString() : '\u2014')}
        </div>
      </div>
      <div>
        <div class="text-xs font-medium text-white/60 mb-1">Tempo de atividade</div>
        <div class="text-sm font-mono font-medium text-white/90">
          {loading ? '...' : (uptimeMs ? fmt(uptimeMs) : '\u2014')}
        </div>
      </div>
    </div>
  </div>
</BaseCard>
