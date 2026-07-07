import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

type Json = Record<string, unknown>;

type FetchResult = {
  ok: boolean;
  status?: number;
  latency: number;
  data: Json | unknown[] | null;
  error?: string;
};

const REQUEST_TIMEOUT = 3500;

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toTimestamp(value: unknown): number | undefined {
  const numeric = toNumber(value);

  if (numeric != null) {
    return numeric;
  }

  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(String(value));

  return Number.isFinite(parsed) ? parsed : undefined;
}

function calculateUptime(
  uptimeMs?: number,
  startedAt?: unknown,
): number | undefined {
  if (uptimeMs != null) {
    return uptimeMs;
  }

  const startedAtTs = toTimestamp(startedAt);

  if (startedAtTs == null) {
    return undefined;
  }

  return Date.now() - startedAtTs;
}

async function safeFetch(
  url: string,
  init: RequestInit | undefined,
  fetcher: typeof fetch,
): Promise<FetchResult> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const started = Date.now();

  try {
    const response = await fetcher(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0 (compatible; ShindoStatus/1.0)',
        ...(init?.headers || {}),
      },
    });

    const latency = Date.now() - started;

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        latency,
        data: null,
      };
    }

    let data: Json | unknown[] | null = null;

    try {
      data = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        latency,
        data: null,
        error: 'invalid_json',
      };
    }

    return {
      ok: true,
      status: response.status,
      latency,
      data,
    };
  } catch (error: unknown) {
    clearTimeout(timeout);

    return {
      ok: false,
      latency: Date.now() - started,
      data: null,
      error: error instanceof Error ? error.message : 'fetch_failed',
    };
  }
}

function dedupeUsers(users: unknown[]): unknown[] {
  const map = new Map<string, unknown>();

  for (const user of users) {
    const u = user as Record<string, unknown>;
    const uuid = typeof u?.uuid === 'string' ? u.uuid : undefined;

    if (!uuid) {
      continue;
    }

    const currentTimestamp =
      toTimestamp(u?.lastSeen) ?? toTimestamp(u?.connectedAt) ?? 0;

    const existing = map.get(uuid);

    if (!existing) {
      map.set(uuid, user);
      continue;
    }

    const e = existing as Record<string, unknown>;
    const existingTimestamp =
      toTimestamp(e?.lastSeen) ??
      toTimestamp(e?.connectedAt) ??
      0;

    if (currentTimestamp > existingTimestamp) {
      map.set(uuid, user);
    }
  }

  return [...map.values()];
}

export const GET: RequestHandler = async ({ fetch }) => {
  const base = (env.NUXT_PUBLIC_WS_ADMIN_BASE || '')
    .trim()
    .replace(/\/$/, '');

  const adminKey =
    env.WS_ADMIN_KEY ||
    '';

  if (!base || !/^https?:\/\//i.test(base)) {
    return new Response(
      JSON.stringify({
        health: {
          ok: false,
          error: 'status endpoint not configured',
        },
        players: {
          count: 0,
          list: [],
        },
        latencyMs: null,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  }

  try {
    const healthResponse = await safeFetch(`${base}/v1/health`, undefined, fetch);

    const healthRaw: Json =
      healthResponse.ok &&
      healthResponse.data &&
      !Array.isArray(healthResponse.data) &&
      typeof healthResponse.data === 'object'
        ? (healthResponse.data as Json)
        : {};

    const health = {
      ok:
        typeof healthRaw.ok === 'boolean' ? healthRaw.ok : healthResponse.ok,

      startedAt: healthRaw.startedAt || undefined,

      uptimeMs: calculateUptime(
        toNumber(healthRaw.uptimeMs),
        healthRaw.startedAt,
      ),

      deployStartedAt: healthRaw.deployStartedAt || undefined,

      deployUptimeMs: calculateUptime(
        toNumber(healthRaw.deployUptimeMs),
        healthRaw.deployStartedAt,
      ),

      env: typeof healthRaw.env === 'string' ? healthRaw.env : undefined,

      version:
        typeof healthRaw.version === 'string' ? healthRaw.version : undefined,

      connections: toNumber(healthRaw.connections) ?? 0,

      uniqueUsers: toNumber(healthRaw.uniqueUsers),

      onlineUsers: toNumber(healthRaw.onlineUsers),

      status: healthResponse.status,

      error: healthResponse.ok ? undefined : healthResponse.error,
    };

    let users: unknown[] = [];
    let playersError: string | undefined;

    if (!adminKey) {
      playersError = 'missing_admin_key';
    } else {
      const usersResponse = await safeFetch(`${base}/v1/connected-users`, {
        headers: {
          'x-admin-key': adminKey,
        },
      }, fetch);

      if (usersResponse.ok) {
        const payload = usersResponse.data as Record<string, unknown>;

        if (Array.isArray(payload)) {
          users = payload;
        } else if (Array.isArray(payload?.users)) {
          users = payload.users;
        } else if (Array.isArray(payload?.data)) {
          users = payload.data;
        } else {
          playersError = 'invalid_players_payload';
        }
      } else {
        playersError =
          usersResponse.error ||
          `players_fetch_failed:${usersResponse.status || 'unknown'}`;
      }
    }

    users = dedupeUsers(users);

    const count =
      users.length ||
      health.onlineUsers ||
      health.uniqueUsers ||
      health.connections ||
      0;

    return new Response(
      JSON.stringify({
        health,
        players: {
          count,
          list: users,
          error: playersError,
        },
        latencyMs: healthResponse.latency,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        health: {
          ok: false,
          error: error instanceof Error ? error.message : 'unexpected_error',
        },
        players: {
          count: 0,
          list: [],
          error: 'unexpected_error',
        },
        latencyMs: null,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  }
};
