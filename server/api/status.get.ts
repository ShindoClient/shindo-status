import { defineEventHandler, getMethod, setHeaders, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'

async function safeFetch(url: string, init?: RequestInit) {
    const controller = new AbortController()
    const t0 = Date.now()
    const timeout = setTimeout(() => controller.abort(), 3500)
    try {
        const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' } as any)
        clearTimeout(timeout)
        const latency = Date.now() - t0
        if (!res.ok) return { ok: false, latency, data: null }
        const data = await res.json().catch(() => ({}))
        return { ok: true, latency, data }
    } catch {
        clearTimeout(timeout)
        return { ok: false, latency: Date.now() - t0, data: null }
    }
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const { wsAdminKey } = config as { wsAdminKey?: string }
    let base = process.env.NUXT_PUBLIC_WS_ADMIN_BASE || ''

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

    if (!base || !wsAdminKey) {
        return {
            health: { ok: false, error: 'status endpoint not configured' },
            players: { count: 0 },
            latencyMs: null,
            timestamp: new Date().toISOString(),
        }
    }

    const adminHeaders = { 'x-admin-key': wsAdminKey }
    base = base.replace(/\/$/, '')
    // tenta health
    const h = await safeFetch(`${base}/v1/health`)
    let latencyMs = h.latency
    let health = {
        ok: false as boolean,
        startedAt: undefined as string | undefined,
        uptimeMs: undefined as number | undefined,
        env: undefined as string | undefined,
        version: undefined as string | undefined,
        connections: undefined as number | undefined,
    }
    if (h.ok && h.data) {
        const d: any = h.data
        let ok = h.ok
        if (typeof d?.ok === 'boolean') ok = d.ok
        else if (typeof d?.success === 'boolean') ok = d.success
        else if (d === true) ok = true
        health = {
            ok,
            startedAt: d?.startedAt || undefined,
            uptimeMs: typeof d?.uptimeMs === 'number' ? d.uptimeMs : undefined,
            env: typeof d?.env === 'string' ? d.env : undefined,
            version: typeof d?.version === 'string' ? d.version : undefined,
            connections: typeof d?.connections === 'number' ? d.connections : undefined,
        }
    } else {
        const cu = await safeFetch(`${base}/v1/connected-users`, { headers: adminHeaders })
        latencyMs = cu.latency
        health = {
            ok: cu.ok,
            startedAt: undefined,
            uptimeMs: undefined,
            env: undefined,
            version: undefined,
            connections: undefined,
        }
    }

    const users = await safeFetch(`${base}/v1/connected-users`, { headers: adminHeaders })
    const userList = users.ok && (users.data as any)?.users ? (users.data as any).users : []
    const count = Array.isArray(userList) ? Number(userList.length) : 0

    return { health, players: { count, list: userList }, latencyMs, timestamp: new Date().toISOString() }
})
