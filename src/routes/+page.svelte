<script lang="ts">
  import { onMount } from 'svelte'
  import { RefreshCw } from '@lucide/svelte'
  import { createStatusStore } from '$lib/stores/status.svelte'
  import { createStatusHistory } from '$lib/stores/status-history.svelte'

  interface StatusPlayer {
    uuid?: string;
    name?: string;
    accountType?: string;
    lastSeen?: unknown;
    connectedAt?: unknown;
    roles?: unknown;
  }

  const statusStore = createStatusStore()
  const historyStore = createStatusHistory()

  // --- client version ---
  let clientVersionData = $state<{ build: number | null; semver: string | null; source: string }>({
    build: null,
    semver: null,
    source: ''
  })

  let clientVersionLabel = $derived.by(() => {
    const semver = clientVersionData.semver
    const build = clientVersionData.build
    if (typeof semver === 'string' && semver.trim().length > 0) return semver
    if (typeof build === 'number' && Number.isFinite(build) && build > 0) return `build ${build}`
    return ''
  })

  // --- has fetched tracking ---
  let hasFetched = $state(false)

  // --- derived status values ---
  type DeepHealth = NonNullable<typeof statusStore.data>['health'] & {
    connections?: number | null;
    onlineUsers?: number | null;
    uniqueUsers?: number | null;
  }

  let gatewayHealthy = $derived(statusStore.data?.health?.ok ?? false)
  let connections = $derived((statusStore.data?.health as DeepHealth | undefined)?.connections ?? null)
  let latencyMs = $derived(statusStore.data?.latencyMs ?? null)
  let uptimeMs = $derived(statusStore.data?.health?.uptimeMs ?? null)

  // --- dedupePlayers ---
  const parseTimestamp = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
    if (value == null) return null
    const parsed = Date.parse(String(value))
    return Number.isFinite(parsed) ? parsed : null
  }

  const dedupePlayers = (list: unknown[]): StatusPlayer[] => {
    if (!Array.isArray(list)) return []
    const byUuid = new Map<string, StatusPlayer>()
    for (const raw of list) {
      const player = raw as StatusPlayer
      const uuid = typeof player?.uuid === 'string' ? player.uuid : null
      if (!uuid) continue
      const currentTs = parseTimestamp(player?.lastSeen) ?? parseTimestamp(player?.connectedAt)
      const existing = byUuid.get(uuid)
      const existingTs = existing ? (parseTimestamp(existing.lastSeen) ?? parseTimestamp(existing.connectedAt)) : null
      if (!existing || (currentTs != null && (existingTs == null || currentTs > existingTs))) {
        byUuid.set(uuid, player)
      }
    }
    return Array.from(byUuid.values())
  }

  // --- online players derived ---
  const onlinePlayers = $derived(dedupePlayers(statusStore.data?.players?.list ?? []))

  const playersOnline = $derived.by(() => {
    const listCount = onlinePlayers.length
    if (listCount > 0) return listCount
    const playersCount = statusStore.data?.players?.count
    if (typeof playersCount === 'number') return playersCount
    const health = statusStore.data?.health as DeepHealth | undefined
    const onlineUsers = health?.onlineUsers
    if (typeof onlineUsers === 'number') return onlineUsers
    const uniqueUsers = health?.uniqueUsers
    if (typeof uniqueUsers === 'number') return uniqueUsers
    if (typeof connections === 'number') return connections
    return 0
  })

  // --- formatting helpers ---
  const latencyLabel = $derived.by(() => {
    if (latencyMs == null) return '--'
    const rounded = Math.round(latencyMs)
    return `${rounded} ms`
  })

  const uptimeLabel = $derived.by(() => {
    if (uptimeMs == null) return '--'
    const totalSeconds = Math.max(0, Math.floor(uptimeMs / 1000))
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  })

  const lastUpdatedLabel = $derived.by(() => {
    const raw = (statusStore.data as Record<string, unknown>)?.updatedAt ?? (statusStore.data as Record<string, unknown>)?.timestamp
    if (!raw) return 'moments ago'
    try {
      const date = new Date(raw as string | number)
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      return rtf.format(Math.round((date.getTime() - Date.now()) / (1000 * 60)), 'minute')
    } catch {
      return 'moments ago'
    }
  })

  const metricCards = $derived([
    {
      label: 'WebSocket Uptime',
      value: uptimeLabel,
      description: 'Uptime reported by the gateway healthcheck.'
    },
    {
      label: 'Active Connections',
      value: (playersOnline ?? connections ?? 0).toString().padStart(2, '0'),
      description: 'Open WebSocket connections reported by the gateway.'
    },
    {
      label: 'Latency',
      value: latencyLabel,
      description: 'Edge to WebSocket and downstream services.'
    }
  ])

  // --- player helpers ---
  const fallbackAvatar = 'https://mc-heads.net/avatar/steve/48'

  const getPlayerHead = (uuidOrName: string | undefined, accountType?: string) => {
    const isOffline = (accountType || '').toUpperCase() === 'OFFLINE'
    if (!uuidOrName || isOffline) return fallbackAvatar
    const identifier = encodeURIComponent(uuidOrName)
    return `https://mc-heads.net/avatar/${identifier}/48`
  }

  const getAccountTypeLabel = (type: string | undefined) => {
    return type === 'MICROSOFT' ? 'Microsoft' : 'Cracked'
  }

  const formatLastSeen = (value: unknown) => {
    const ts = parseTimestamp(value)
    if (ts == null) return 'Recently active'
    const diff = Date.now() - ts
    if (diff < 30_000) return 'Active now'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 48) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const onAvatarError = (e: Event) => {
    const target = (e as Event).target as HTMLImageElement | null
    if (!target) return
    if (target.getAttribute('data-fallback-applied')) return
    target.src = fallbackAvatar
    target.setAttribute('data-fallback-applied', '1')
  }

  const normalizeRole = (role: unknown) => {
    if (Array.isArray(role)) return role.join(',').trim() || 'Member'
    if (typeof role === 'string') return role.trim() || 'Member'
    if (role == null) return 'Member'
    const coerced = String(role).trim()
    return coerced || 'Member'
  }

  const getRoleLabel = (role: unknown) => {
    const normalized = normalizeRole(role)
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  const getRoleClass = (role: unknown) => {
    const normalized = normalizeRole(role).toLowerCase()
    if (normalized.includes('staff')) return 'text-red-200 border-red-400/40 bg-red-400/10'
    if (normalized.includes('diamond') || normalized.includes('mvp')) return 'text-blue-200 border-blue-400/40 bg-blue-400/10'
    if (normalized.includes('gold')) return 'text-yellow-200 border-yellow-400/40 bg-yellow-400/10'
    return 'text-white/70 bg-white/5'
  }

  // --- refresh handler ---
  const refreshStatus = () => {
    statusStore.fetchStatus()
  }

  // --- error state ---
  let statusError = $derived(statusStore.error)

  // --- history tracking ---
  $effect(() => {
    if (statusStore.data) {
      historyStore.update(statusStore.data)
    }
  })

  // --- hasFetched tracking ---
  $effect(() => {
    if (!statusStore.loading && statusStore.data) {
      hasFetched = true
    }
  })

  // --- lifecycle ---
  onMount(async () => {
    // fetch client version
    try {
      const res = await fetch('/api/client-version')
      if (res.ok) {
        clientVersionData = await res.json()
      }
    } catch {
      // ignore
    }

    // initial status fetch
    await statusStore.fetchStatus()
    hasFetched = true

    // start polling
    statusStore.startPolling(30000)
  })

  // --- cleanup ---
  $effect(() => {
    return () => {
      statusStore.stopPolling()
    }
  })

</script>

<svelte:head>
  <title>ShindoClient WebSocket Status</title>
  <meta name="description" content="Live operational status for the ShindoClient WebSocket gateway, authentication services and presence pipeline." />
  <meta property="og:title" content="ShindoClient WebSocket Status" />
  <meta property="og:description" content="Track uptime, latency and active sessions for the ShindoClient infrastructure in real time." />
  <meta property="og:url" content="https://status.shindoclient.com" />
  <meta name="theme-color" content="#7854ff" />
</svelte:head>

<div class="relative overflow-hidden px-4 py-16">
  <div class="pointer-events-none absolute inset-0 -z-10">
    <div
      class="absolute inset-0 opacity-50"
      style="background-image: radial-gradient(circle at 25% 15%, rgba(120,84,255,0.22), transparent 60%), radial-gradient(circle at 80% 0%, rgba(66,43,211,0.18), transparent 55%)"
    ></div>
    <div class="absolute left-10 top-4 h-64 w-64 rounded-full bg-accent-600/25 blur-3xl"></div>
    <div class="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl"></div>
  </div>

  <div class="mx-auto flex w-full max-w-[1120px] flex-col gap-10">
    <section class="panel grid gap-8 p-8 md:grid-cols-[minmax(0,1.15fr)_1fr] md:p-10">
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center gap-3">
          <span class="section-label">WebSocket Status</span>
          <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            {#if gatewayHealthy}
              <span class="h-2.5 w-2.5 rounded-full bg-success shadow-md shadow-accent-500/40 animate-pulse"></span>
              Operational
            {:else}
              <span class="h-2.5 w-2.5 rounded-full bg-warning shadow-md shadow-accent-500/40"></span>
              Degraded
            {/if}
          </span>
          <span class="text-xs text-white/45">Updated {lastUpdatedLabel}</span>
          {#if clientVersionLabel}
            <span class="text-xs text-white/45">Client {clientVersionLabel}</span>
          {/if}
        </div>

        <div class="space-y-3">
          <h1 class="font-display text-3xl leading-tight text-white sm:text-4xl">Shindo WebSocket Status</h1>
          <p class="max-w-2xl text-sm text-white/70">
            Watch the WebSocket that handles auth, presence and roles with live uptime, latency and active session counts.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="button-primary" onclick={refreshStatus}>
            {#if statusStore.loading}
              <svg class="h-4 w-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.375 0 0 5.375 0 12h4z" />
              </svg>
            {:else}
              <RefreshCw class="h-4 w-4" />
            {/if}
            Refresh now
          </button>
          <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            <span class="h-2 w-2 rounded-full bg-white/40"></span>
            {gatewayHealthy ? 'Incident level: none' : 'Incident level: investigating'}
          </span>
        </div>

        {#if statusError}
          <p class="text-xs text-warning">
            Failed to reach the status endpoint. Showing fallback metrics.
          </p>
        {/if}
      </div>

      <div class="relative overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-br from-accent-700/40 via-accent-500/25 to-surface-elevated/80 p-6 shadow-[0_40px_100px_-45px_rgba(90,62,247,0.7)]">
        <div class="absolute right-[-60px] top-[-80px] h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div class="absolute left-[-80px] bottom-[-60px] h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"></div>
        <div class="relative space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-xs uppercase tracking-[0.35em] text-white/65">Live snapshot</p>
            <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
              {gatewayHealthy ? 'Stable' : 'Needs attention'}
            </span>
          </div>
          <div class="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/70">
            <div class="flex items-center justify-between">
              <span>Active Sessions</span>
              <span class="text-base font-semibold text-white">{playersOnline}</span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span>Latency</span>
              <span class="text-base font-semibold text-white">{latencyLabel}</span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span>Health</span>
              <span class="text-base font-semibold text-white">{gatewayHealthy ? 'Operational' : 'Degraded'}</span>
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
        <button class="button-ghost" onclick={refreshStatus}>Force refresh</button>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        {#each metricCards as card}
          <div class="metric-tile h-full">
            <p class="text-xs uppercase tracking-[0.35em] text-white/55">{card.label}</p>
            <p class="text-3xl font-semibold text-white">{card.value}</p>
            <p class="text-sm text-white/60">{card.description}</p>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel space-y-6 p-6 md:p-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <span class="section-label">Players Online</span>
          <h2 class="font-display text-2xl text-white">Who is online</h2>
        </div>
        <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70">
          {playersOnline} active
        </span>
      </div>

      {#if !hasFetched}
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Loading players…
        </div>
      {:else if onlinePlayers.length === 0}
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          No players online right now.
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each onlinePlayers as player (player.uuid)}
            <div class="metric-tile flex items-center gap-5 p-6">
              <img
                src={getPlayerHead(player.uuid || player.name, player.accountType)}
                alt={player.name}
                class="h-12 w-12 rounded-lg border-2 border-white/15"
                loading="lazy"
                onerror={onAvatarError}
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">{player.name}</p>
                <p class="text-xs text-white/60">
                  {getAccountTypeLabel(player.accountType)}
                </p>
                <p class="text-[11px] text-white/45">
                  {formatLastSeen(player.lastSeen || player.connectedAt)}
                </p>
              </div>
              <span
                class="rounded-full border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] {getRoleClass(player.roles)}"
              >
                {getRoleLabel(player.roles)}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>
