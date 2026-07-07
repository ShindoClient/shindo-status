<script lang="ts">
  import '../app.css'
  import { injectAnalytics } from '@vercel/analytics/sveltekit'
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit'
  import { onMount } from 'svelte'

  let { children }: import('./$types').LayoutProps = $props()

  onMount(() => {
    injectAnalytics()
    injectSpeedInsights()
  })
</script>

<svelte:head>
  <meta content="#7854ff" name="theme-color" />
</svelte:head>

{@render children()}
