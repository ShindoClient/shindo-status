<script lang="ts">
import { Users } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'

let {
  loading = false,
  count = 0
}: {
  loading?: boolean
  count?: number
} = $props()

const last = $derived.by(() => {
  if (loading) return 0
  const c = Number(count)
  return isFinite(c) ? Math.max(0, c) : 0
})
</script>

<BaseCard>
  {#snippet header()}
    <div class="flex items-center gap-3 mb-4">
      <div class="p-2 rounded-lg bg-accent-500/10 text-accent-300">
        <Users class="w-5 h-5" />
      </div>
      <h3 class="text-sm font-semibold text-white/90">Jogadores Online</h3>
    </div>
  {/snippet}

  <div class="flex flex-col h-full">
    <div class="flex items-end gap-2">
      <div class="text-4xl font-bold tracking-tight text-white">
        {loading || last === undefined ? '\u2014' : last}
      </div>
      <div class="mb-1 text-sm text-white/60">
        {last === 1 ? 'jogador' : 'jogadores'}
      </div>
    </div>

    <div class="mt-4 text-xs text-white/50">
      Atualizado em tempo real
    </div>
  </div>
</BaseCard>
