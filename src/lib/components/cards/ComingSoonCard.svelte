<script lang="ts">
import { Clock } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'

let {
  title = 'Em Breve',
  description = 'Novo recurso em desenvolvimento'
}: {
  title?: string
  description?: string
} = $props()
</script>

<BaseCard class="group relative overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-accent-500/0 via-accent-500/5 to-accent-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

  <div class="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
    <div class="p-3 mb-4 rounded-full bg-accent-500/10 text-accent-300">
      <Clock class="w-6 h-6" />
    </div>
    <h3 class="mb-2 text-sm font-semibold text-white/90">
      {title}
    </h3>
    <p class="text-sm text-white/60">
      {description}
    </p>

    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div class="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-accent-500/10 to-accent-500/5"></div>
      <span class="relative z-10 px-3 py-1.5 text-xs font-medium bg-accent-500/10 text-accent-300 rounded-full border border-accent-500/20 backdrop-blur-sm">
        Em Desenvolvimento
      </span>
    </div>
  </div>
</BaseCard>
