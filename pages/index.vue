<template>
  <main class="relative overflow-hidden px-4 py-16">
    <div class="absolute inset-0 -z-10 bg-status-grid opacity-40"></div>
    <div class="mx-auto flex w-full max-w-[1040px] flex-col gap-12">
      <section class="panel grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_-50px_rgba(18,25,52,0.85)] md:grid-cols-[minmax(0,1fr)_240px]">
        <div class="flex flex-col gap-5">
          <div class="flex flex-wrap items-center gap-3">
            <span class="badge bg-white/10 text-white/60">Gateway Status</span>
            <span
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/60"
            >
              <span :class="['h-2 w-2 rounded-full', gatewayHealthy ? 'bg-success animate-pulse' : 'bg-warning']"></span>
              {{ gatewayHealthy ? 'Operational' : 'Degraded' }}
            </span>
          </div>
          <div>
            <h1 class="font-display text-3xl text-white sm:text-4xl">Shindo Gateway Monitoring</h1>
            <p class="mt-3 max-w-2xl text-sm text-white/65">
              Live telemetry for the WebSocket gateway powering authentication, role sync and presence for the ShindoClient.
              Every figure updates automatically to keep operators ahead of incidents.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-xs text-white/45">
            <div class="flex items-center gap-2">
              <svg class="h-3.5 w-3.5 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Updated {{ lastUpdatedLabel }}
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/60 transition hover:text-white"
              @click="refreshStatus"
            >
              <svg
                v-if="!statusPending"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              >
                <path d="M3 12a9 9 0 0 1 9-9c2.4 0 4.6.97 6.19 2.54L21 9" />
                <path d="M3 3v6h6" />
                <path d="M21 12a9 9 0 0 1-9 9c-2.4 0-4.6-.97-6.19-2.54L3 15" />
                <path d="M21 21v-6h-6" />
              </svg>
              <svg v-else class="h-3.5 w-3.5 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.375 0 0 5.375 0 12h4z" />
              </svg>
              Refresh
            </button>
          </div>
          <p v-if="statusError" class="text-xs text-warning">
            Failed to reach the status endpoint. Showing fallback metrics.
          </p>
        </div>
        <div class="panel flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-6">
          <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">Snapshot</h2>
          <div class="space-y-3 text-sm text-white/65">
            <div class="flex items-center justify-between">
              <span>Players Authenticated</span>
              <span class="text-base font-semibold text-white">{{ playersOnline }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Current Latency</span>
              <span class="text-base font-semibold text-white">{{ latencyLabel }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Incident Level</span>
              <span class="text-base font-semibold text-white">
                {{ gatewayHealthy ? 'None' : 'Investigating' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-5 md:grid-cols-3">
        <div
          v-for="metric in metricCards"
          :key="metric.label"
          class="panel flex h-full flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 p-6"
        >
          <p class="text-xs uppercase tracking-[0.35em] text-white/45">{{ metric.label }}</p>
          <p class="text-3xl font-semibold text-white">{{ metric.value }}</p>
          <p class="text-sm text-white/55">{{ metric.description }}</p>
        </div>
      </section>

      <section class="panel grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 md:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span class="badge bg-white/10 text-white/60">Operational Playbook</span>
          </div>
          <h2 class="font-display text-2xl text-white">What happens when latency spikes?</h2>
          <p class="text-sm text-white/60">
            The gateway now enforces token-based sessions. If we detect elevated latency or degraded health, follow the playbook below to triage the incident without disconnecting players.
          </p>
          <ul class="mt-4 space-y-3 text-sm text-white/65">
            <li v-for="item in playbook" :key="item.title" class="flex items-start gap-3">
              <div class="mt-1 h-2 w-2 rounded-full bg-accent-400/70"></div>
              <div>
                <p class="font-medium text-white/80">{{ item.title }}</p>
                <p>{{ item.body }}</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="panel flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">Service Map</h3>
          <ul class="space-y-3 text-sm text-white/60">
            <li v-for="service in services" :key="service.name" class="flex items-start gap-3">
              <div class="mt-0.5 h-2 w-2 rounded-full bg-white/30"></div>
              <div>
                <p class="font-medium text-white/80">{{ service.name }}</p>
                <p>{{ service.detail }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="panel rounded-[32px] border border-white/10 bg-white/5 p-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="badge bg-white/10 text-white/60">Incident Log</span>
            <h2 class="mt-3 font-display text-2xl text-white">Recent events</h2>
            <p class="text-sm text-white/60">No major incidents have been reported in the last 30 days.</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/60"
            @click="refreshStatus"
          >
            Refresh
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const runtimeConfig = useRuntimeConfig()
const statusEndpoint = runtimeConfig.public.statusEndpoint as string | undefined

const fallbackStatus = {
  health: { ok: false },
  players: { count: 0 },
  latencyMs: null,
  updatedAt: null
}

const {
  data: statusData,
  pending: statusPending,
  refresh: refreshStatus,
  error: statusError
} = useLazyAsyncData('shindo-status', async () => {
  if (!statusEndpoint) return fallbackStatus
  try {
    const payload = await $fetch(statusEndpoint, {
      headers: { accept: 'application/json' },
      timeout: 4000
    })
    return (payload as typeof fallbackStatus) ?? fallbackStatus
  } catch {
    return fallbackStatus
  }
}, {
  default: () => fallbackStatus,
  server: false
})

const gatewayHealthy = computed(() => statusData.value?.health?.ok ?? false)
const playersOnline = computed(() => statusData.value?.players?.count ?? 0)
const latencyMs = computed(() => statusData.value?.latencyMs ?? null)

const latencyLabel = computed(() => {
  if (!latencyMs.value) return '—'
  const rounded = Math.round(latencyMs.value)
  return `${rounded} ms`
})

const lastUpdatedLabel = computed(() => {
  const raw = statusData.value?.updatedAt || statusData.value?.timestamp
  if (!raw) return 'moments ago'
  try {
    const date = new Date(raw)
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    )
  } catch {
    return 'moments ago'
  }
})

const metricCards = computed(() => [
  {
    label: 'Gateway Uptime',
    value: gatewayHealthy.value ? '100%' : '−',
    description: 'Continuous uptime thanks to Render zero-downtime deploys and automatic health probes.'
  },
  {
    label: 'Active Sessions',
    value: playersOnline.value.toString().padStart(2, '0'),
    description: 'Authenticated sessions tracked through Supabase presence.'
  },
  {
    label: 'Latency',
    value: latencyLabel.value,
    description: 'Measured from Render edge to Supabase and downstream Mojang services.'
  }
])

const playbook = [
  {
    title: 'Verify Supabase Availability',
    body: 'Check recent error logs for failed token issuance or realtime disconnects. Refresh service role keys if required.'
  },
  {
    title: 'Inspect Render Metrics',
    body: 'If latency spikes, inspect Render logs for throttling or container restarts. Trigger a redeploy if heartbeat failures persist.'
  },
  {
    title: 'Notify Community Channels',
    body: 'Post the status update on Discord and GitHub Discussions if the incident exceeds five minutes.'
  }
]

const services = [
  { name: 'Gateway (Render)', detail: 'Handles WebSocket traffic, role broadcasting and plugin hooks.' },
  { name: 'Supabase (Presence)', detail: 'Stores session metadata, roles and presence signals.' },
  { name: 'Vercel (Status UI)', detail: 'Edge-hosted Nuxt application serving this dashboard.' }
]

const intervalId = ref<number | null>(null)

onMounted(() => {
  intervalId.value = window.setInterval(() => refreshStatus(), 30000)
})

onBeforeUnmount(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

useSeoMeta({
  title: 'ShindoClient Gateway Status',
  description: 'Live operational status for the ShindoClient WebSocket gateway, authentication services and presence pipeline.',
  ogTitle: 'ShindoClient Gateway Status',
  ogDescription: 'Track uptime, latency and active sessions for the ShindoClient infrastructure in real time.',
  ogUrl: 'https://status.shindoclient.com',
  themeColor: '#7854ff'
})
</script>
