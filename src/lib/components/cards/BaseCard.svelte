<script lang="ts">
let {
  class: className = '',
  header,
  children
}: {
  class?: string
  header?: import('svelte').Snippet
  children: import('svelte').Snippet
} = $props()
</script>

<div
  class="group relative h-full rounded-2xl border-2 border-white/10 bg-gradient-to-br from-surface-soft to-surface-deep backdrop-blur-xl shadow-lg transition-all duration-300 overflow-hidden hover:border-accent-500/50 hover:shadow-accent-500/20 hover:shadow-xl {className}"
>
  <div class="absolute inset-0 bg-gradient-to-br from-accent-500/0 via-accent-500/10 to-accent-500/0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

  <div class="absolute inset-0 rounded-2xl border-2 border-white/15 group-hover:border-accent-500/80 transition-all duration-300 pointer-events-none"></div>

  <div class="absolute -inset-1 bg-gradient-to-br from-accent-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-500 pointer-events-none"></div>

  <div class="h-full flex flex-col p-6">
    {#if header}
      {@render header()}
    {/if}
    <div class="flex-1 flex flex-col justify-between">
      {@render children()}
    </div>
  </div>
</div>
