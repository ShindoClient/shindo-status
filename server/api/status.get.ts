import { defineEventHandler, getMethod, setHeaders, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'

type FetchResult = { ok: boolean; latency: number; data: any; status?: number; error?: string }

const toNumberOrNull = (value: any): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

const toTimestamp = (value: any): number | null => {
    const numeric = toNumberOrNull(value)
    if (numeric != null) return numeric
    if (value == null) return null
    const parsed = Date.parse(String(value))
    return Number.isFinite(parsed) ? parsed : null
}

async function safeFetch(url: string, init?: RequestInit): Promise<FetchResult> {
    const controller = new AbortController()
    const t0 = Date.now()
    const timeout = setTimeout(() => controller.abort(), 3500)
    try {
        const baseHeaders = {
            accept: 'application/json',
            'user-agent': 'shindo-status-probe/1.0 (+status)',
        }
        const res = await fetch(
            url,
            {
                ...init,
                headers: { ...baseHeaders, ...(init?.headers as any) },
                signal: controller.signal,
                cache: 'no-store',
            } as any
        )
        clearTimeout(timeout)
        const latency = Date.now() - t0
        if (!res.ok) return { ok: false, latency, data: null, status: res.status }
        const data = await res.json().catch(() => ({}))
        return { ok: true, latency, data, status: res.status }
    } catch (err: any) {
        clearTimeout(timeout)
        return {
            ok: false,
            latency: Date.now() - t0,
            data: null,
            error: err?.message || 'fetch_failed',
        }
    }
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const { wsAdminKey, public: publicConfig } = config as { wsAdminKey?: string; public?: { wsAdminBase?: string } }

    // sempre tenta ler primeiro do runtimeConfig (funciona em dev e na Vercel), com fallback para process.env
    let base = publicConfig?.wsAdminBase || process.env.NUXT_PUBLIC_WS_ADMIN_BASE || ''
    base = (base || '').trim().replace(/\/$/, '')

    // tenta ler a admin key de diferentes variáveis para não falhar em ambientes que usam prefixos diferentes
    const adminKey =
        wsAdminKey ||
        process.env.WS_ADMIN_KEY ||
        process.env.NUXT_WS_ADMIN_KEY ||
        process.env.NUXT_PRIVATE_WS_ADMIN_KEY ||
        process.env.NUXT_PUBLIC_WS_ADMIN_KEY ||
        ''

    if (getMethod(event) === 'OPTIONS') {
        setResponseStatus(event, 204)
        return null
    }

    setHeaders(event, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
    })

    if (!base || !/^https?:\/\//i.test(base)) {
        const timestamp = new Date().toISOString()
        return {
            health: { ok: false, error: 'status endpoint not configured' },
            players: { count: 0 },
            latencyMs: null,
            timestamp,
            updatedAt: timestamp,
        }
    }

    try {
        const adminHeaders = adminKey ? { 'x-admin-key': adminKey } : undefined

        // health NÃO precisa de header admin
        const h = await safeFetch(`${base}/v1/health`)
        let latencyMs = h.latency
        let health = {
            ok: false as boolean,
            startedAt: undefined as string | undefined,
            uptimeMs: undefined as number | undefined,
            env: undefined as string | undefined,
            version: undefined as string | undefined,
            connections: 0 as number | undefined,
            uniqueUsers: undefined as number | undefined,
            status: h.status,
            error: h.error,
        }
        if (h.ok && h.data && typeof h.data === 'object') {
            const d: any = h.data
            let ok = h.ok
            if (typeof d?.ok === 'boolean') ok = d.ok
            else if (typeof d?.success === 'boolean') ok = d.success
            else if (d === true) ok = true

            const connections = toNumberOrNull(d?.connections)

            health = {
                ok,
                startedAt: d?.startedAt || undefined,
                uptimeMs: toNumberOrNull(d?.uptimeMs) ?? undefined,
                env: typeof d?.env === 'string' ? d.env : undefined,
                version: typeof d?.version === 'string' ? d.version : undefined,
                connections: connections ?? 0,
                uniqueUsers: toNumberOrNull(d?.uniqueUsers) ?? undefined,
                status: h.status,
                error: undefined,
            }
        }

        let userList: any[] = []
        let playersError: string | undefined = adminHeaders ? undefined : 'missing_admin_key'
        if (adminHeaders) {
            const users = await safeFetch(`${base}/v1/connected-users`, { headers: adminHeaders })
            const payload: any = users.data
            if (users.ok && payload) {
                if (Array.isArray(payload.users)) userList = payload.users
                else if (Array.isArray(payload.data)) userList = payload.data
                else if (Array.isArray(payload)) userList = payload
            } else if (!users.ok) {
                playersError = `players_fetch_failed:${users.status || 'unknown'}`
            }
        }

        if (Array.isArray(userList) && userList.length > 0) {
            const deduped = new Map<string, any>()
            for (const user of userList) {
                const uuid = typeof user?.uuid === 'string' ? user.uuid : null
                if (!uuid) continue
                const currentTs = toTimestamp(user?.lastSeen) ?? toTimestamp(user?.connectedAt)
                const existing = deduped.get(uuid)
                const existingTs = existing ? (toTimestamp(existing.lastSeen) ?? toTimestamp(existing.connectedAt)) : null
                if (!existing || (currentTs != null && (existingTs == null || currentTs > existingTs))) {
                    deduped.set(uuid, user)
                }
            }
            userList = Array.from(deduped.values())
        }

        // se não conseguir listar players, usa o número de conexões do health como fallback de contagem
        const count = Array.isArray(userList) && userList.length > 0
            ? Number(userList.length)
            : typeof health.uniqueUsers === 'number'
                ? Number(health.uniqueUsers)
                : typeof health.connections === 'number'
                    ? Number(health.connections)
                    : 0

        const timestamp = new Date().toISOString()

        return {
            health,
            players: { count, list: userList, error: playersError },
            latencyMs,
            timestamp,
            updatedAt: timestamp,
        }
    } catch (err: any) {
        const timestamp = new Date().toISOString()
        return {
            health: { ok: false, error: err?.message || 'status_failed' },
            players: { count: 0, list: [], error: 'unexpected_error' },
            latencyMs: null,
            timestamp,
            updatedAt: timestamp,
        }
    }
})
