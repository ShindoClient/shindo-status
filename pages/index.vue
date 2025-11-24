<template>
  <main class="relative overflow-hidden px-4 py-16">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-status-grid opacity-50"></div>
      <div class="absolute left-10 top-4 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl"></div>
      <div class="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-brand-400/15 blur-3xl"></div>
    </div>

    <div class="mx-auto flex w-full max-w-[1120px] flex-col gap-10">
      <section class="panel grid gap-8 p-8 md:grid-cols-[minmax(0,1.15fr)_1fr] md:p-10">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-3">
            <span class="section-label">WebSocket Status</span>
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
              <span :class="['h-2.5 w-2.5 rounded-full shadow-md shadow-brand-500/40', gatewayHealthy ? 'bg-success animate-pulse' : 'bg-warning']"></span>
              {{ gatewayHealthy ? 'Operational' : 'Degraded' }}
            </span>
            <span class="text-xs text-white/45">Updated {{ lastUpdatedLabel }}</span>
          </div>

          <div class="space-y-3">
            <h1 class="font-display text-3xl leading-tight text-white sm:text-4xl">Shindo WebSocket Status</h1>
            <p class="max-w-2xl text-sm text-white/70">
              Watch the WebSocket that handles auth, presence and roles with live uptime, latency and active session counts.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="button-primary"
              @click="refreshStatus"
            >
              <svg
                v-if="!statusPending"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M3 12a9 9 0 0 1 9-9c2.4 0 4.6.97 6.19 2.54L21 9" />
                <path d="M3 3v6h6" />
                <path d="M21 12a9 9 0 0 1-9 9c-2.4 0-4.6-.97-6.19-2.54L3 15" />
                <path d="M21 21v-6h-6" />
              </svg>
              <svg v-else class="h-4 w-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.375 0 0 5.375 0 12h4z" />
              </svg>
              Refresh now
            </button>
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
              <span class="h-2 w-2 rounded-full bg-white/40"></span>
              {{ gatewayHealthy ? 'Incident level: none' : 'Incident level: investigating' }}
            </span>
          </div>

          <p v-if="statusError" class="text-xs text-warning">
            Failed to reach the status endpoint. Showing fallback metrics.
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="metric-tile">
              <p class="text-xs uppercase tracking-[0.35em] text-white/55">Players online</p>
              <p class="text-3xl font-semibold text-white">{{ playersOnline }}</p>
              <p class="text-xs text-white/55">Authenticated sessions synced through the WebSocket.</p>
            </div>
            <div class="metric-tile">
              <p class="text-xs uppercase tracking-[0.35em] text-white/55">Latency</p>
              <p class="text-3xl font-semibold text-white">{{ latencyLabel }}</p>
              <p class="text-xs text-white/55">Edge to WebSocket measurement in the health loop.</p>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-br from-brand-700/40 via-brand-500/25 to-surface-elevated/80 p-6 shadow-[0_40px_100px_-45px_rgba(90,62,247,0.7)]">
          <div class="absolute right-[-60px] top-[-80px] h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
          <div class="absolute left-[-80px] bottom-[-60px] h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"></div>
          <div class="relative space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-[0.35em] text-white/65">Live snapshot</p>
              <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                {{ gatewayHealthy ? 'Stable' : 'Needs attention' }}
              </span>
            </div>
            <div class="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/70">
              <div class="flex items-center justify-between">
                <span>Active Sessions</span>
                <span class="text-base font-semibold text-white">{{ playersOnline }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <span>Latency</span>
                <span class="text-base font-semibold text-white">{{ latencyLabel }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <span>Health</span>
                <span class="text-base font-semibold text-white">{{ gatewayHealthy ? 'Operational' : 'Degraded' }}</span>
              </div>
            </div>
            <p class="text-xs text-white/60">Auto-refresh every 30s.</p>
          </div>
        </div>
      </section>

      <section class="panel space-y-6 p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <span class="section-label">Live Telemetry</span>
            <h2 class="font-display text-2xl text-white">WebSocket vitals</h2>
          </div>
          <button class="button-ghost" @click="refreshStatus">Force refresh</button>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="metric in metricCards"
            :key="metric.label"
            class="metric-tile h-full"
          >
            <p class="text-xs uppercase tracking-[0.35em] text-white/55">{{ metric.label }}</p>
            <p class="text-3xl font-semibold text-white">{{ metric.value }}</p>
            <p class="text-sm text-white/60">{{ metric.description }}</p>
          </div>
        </div>
      </section>

      <section class="panel space-y-6 p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <span class="section-label">Players Online</span>
            <h2 class="font-display text-2xl text-white">Who is online</h2>
          </div>
          <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
            {{ playersOnline }} active
          </span>
        </div>

        <div v-if="onlinePlayers.length === 0" class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          No players online right now.
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="player in onlinePlayers"
            :key="player.uuid"
            class="metric-tile flex items-center gap-3 p-4"
          >
            <img
              :src="getPlayerHead(player.uuid)"
              :alt="player.name"
              class="h-12 w-12 rounded-lg border-2 border-white/15"
              loading="lazy"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ player.name }}</p>
              <p class="text-xs text-white/60">
                {{ player.roles || 'Member' }} | {{ getAccountTypeLabel(player.accountType) }}
              </p>
            </div>
            <span
              class="rounded-full border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              :class="{
                'text-red-200 border-red-400/40 bg-red-400/10': player.roles?.toLowerCase().includes('staff'),
                'text-blue-200 border-blue-400/40 bg-blue-400/10': player.roles?.toLowerCase().includes('diamond') || player.roles?.toLowerCase().includes('mvp'),
                'text-yellow-200 border-yellow-400/40 bg-yellow-400/10': player.roles?.toLowerCase().includes('gold'),
                'text-white/70 bg-white/5': true
              }"
            >
              {{ (player.roles || 'Member') }}
            </span>
          </div>
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
  players: { count: 0, list: [] as any[] },
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
const uptimeMs = computed(() => statusData.value?.health?.uptimeMs ?? null)
const onlinePlayers = computed(() => statusData.value?.players?.list ?? [])

const latencyLabel = computed(() => {
  if (latencyMs.value == null) return '--'
  const rounded = Math.round(latencyMs.value)
  return `${rounded} ms`
})

const uptimeLabel = computed(() => {
  if (uptimeMs.value == null) return '--'
  const totalSeconds = Math.max(0, Math.floor(uptimeMs.value / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
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
    label: 'WebSocket Uptime',
    value: uptimeLabel.value,
    description: 'Uptime reported by the gateway healthcheck.'
  },
  {
    label: 'Active Sessions',
    value: playersOnline.value.toString().padStart(2, '0'),
    description: 'Authenticated sessions tracked in presence.'
  },
  {
    label: 'Latency',
    value: latencyLabel.value,
    description: 'Edge to WebSocket and downstream services.'
  }
])

const getAccountTypeLabel = (type: string) => {
  return type === 'MICROSOFT' ? 'Microsoft' : 'Offline'
}

const getPlayerHead = (username: string) => {
  return `https://crafatar.com/avatars/${username}?size=48&overlay&default=steve`
}

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
  title: 'ShindoClient WebSocket Status',
  description: 'Live operational status for the ShindoClient WebSocket gateway, authentication services and presence pipeline.',
  ogTitle: 'ShindoClient WebSocket Status',
  ogDescription: 'Track uptime, latency and active sessions for the ShindoClient infrastructure in real time.',
  ogUrl: 'https://status.shindoclient.com',
  themeColor: '#7854ff'
})
</script>
