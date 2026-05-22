import {
  defineEventHandler,
  getMethod,
  setHeaders,
  setResponseStatus,
} from "h3";

type Json = Record<string, any>;

type FetchResult = {
  ok: boolean;
  status?: number;
  latency: number;
  data: Json | any[] | null;
  error?: string;
};

const REQUEST_TIMEOUT = 3500;

function toNumber(value: any): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function toTimestamp(value: any): number | undefined {
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
  startedAt?: any,
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
  init?: RequestInit,
): Promise<FetchResult> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  const started = Date.now();

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; ShindoStatus/1.0)",
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

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      return {
        ok: false,
        status: response.status,
        latency,
        data: null,
        error: "invalid_json",
      };
    }

    return {
      ok: true,
      status: response.status,
      latency,
      data,
    };
  } catch (error: any) {
    clearTimeout(timeout);

    return {
      ok: false,
      latency: Date.now() - started,
      data: null,
      error: error?.message || "fetch_failed",
    };
  }
}

function dedupeUsers(users: any[]): any[] {
  const map = new Map<string, any>();

  for (const user of users) {
    const uuid = typeof user?.uuid === "string" ? user.uuid : undefined;

    if (!uuid) {
      continue;
    }

    const currentTimestamp =
      toTimestamp(user?.lastSeen) ?? toTimestamp(user?.connectedAt) ?? 0;

    const existing = map.get(uuid);

    if (!existing) {
      map.set(uuid, user);
      continue;
    }

    const existingTimestamp =
      toTimestamp(existing?.lastSeen) ??
      toTimestamp(existing?.connectedAt) ??
      0;

    if (currentTimestamp > existingTimestamp) {
      map.set(uuid, user);
    }
  }

  return [...map.values()];
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) === "OPTIONS") {
    setResponseStatus(event, 204);
    return null;
  }

  setHeaders(event, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  const base = (process.env.NUXT_PUBLIC_WS_ADMIN_BASE || "")
    .trim()
    .replace(/\/$/, "");

  const adminKey =
    process.env.WS_ADMIN_KEY ||
    process.env.NUXT_WS_ADMIN_KEY ||
    process.env.NUXT_PRIVATE_WS_ADMIN_KEY ||
    process.env.NUXT_PUBLIC_WS_ADMIN_KEY ||
    "";

  if (!base || !/^https?:\/\//i.test(base)) {
    return {
      health: {
        ok: false,
        error: "status endpoint not configured",
      },
      players: {
        count: 0,
        list: [],
      },
      latencyMs: null,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const healthResponse = await safeFetch(`${base}/v1/health`);

    const healthData: Json =
      healthResponse.ok &&
      healthResponse.data &&
      !Array.isArray(healthResponse.data) &&
      typeof healthResponse.data === "object"
        ? healthResponse.data
        : {};

    const health = {
      ok:
        typeof healthData.ok === "boolean" ? healthData.ok : healthResponse.ok,

      startedAt: healthData.startedAt || undefined,

      uptimeMs: calculateUptime(
        toNumber(healthData.uptimeMs),
        healthData.startedAt,
      ),

      deployStartedAt: healthData.deployStartedAt || undefined,

      deployUptimeMs: calculateUptime(
        toNumber(healthData.deployUptimeMs),
        healthData.deployStartedAt,
      ),

      env: typeof healthData.env === "string" ? healthData.env : undefined,

      version:
        typeof healthData.version === "string" ? healthData.version : undefined,

      connections: toNumber(healthData.connections) ?? 0,

      uniqueUsers: toNumber(healthData.uniqueUsers),

      onlineUsers: toNumber(healthData.onlineUsers),

      status: healthResponse.status,

      error: healthResponse.ok ? undefined : healthResponse.error,
    };

    let users: any[] = [];
    let playersError: string | undefined;

    if (!adminKey) {
      playersError = "missing_admin_key";
    } else {
      const usersResponse = await safeFetch(`${base}/v1/connected-users`, {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (usersResponse.ok) {
        const payload = usersResponse.data;

        if (Array.isArray(payload)) {
          users = payload;
        } else if (Array.isArray(payload?.users)) {
          users = payload.users;
        } else if (Array.isArray(payload?.data)) {
          users = payload.data;
        } else {
          playersError = "invalid_players_payload";
        }
      } else {
        playersError =
          usersResponse.error ||
          `players_fetch_failed:${usersResponse.status || "unknown"}`;
      }
    }

    users = dedupeUsers(users);

    const count =
      users.length ||
      health.onlineUsers ||
      health.uniqueUsers ||
      health.connections ||
      0;

    return {
      health,
      players: {
        count,
        list: users,
        error: playersError,
      },
      latencyMs: healthResponse.latency,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      health: {
        ok: false,
        error: error?.message || "unexpected_error",
      },
      players: {
        count: 0,
        list: [],
        error: "unexpected_error",
      },
      latencyMs: null,
      timestamp: new Date().toISOString(),
    };
  }
});
