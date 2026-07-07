import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
  const res = await fetch('/api/status');
  const status: {
    health?: {
      ok?: boolean;
      startedAt?: string;
      uptimeMs?: number;
      deployStartedAt?: string;
      deployUptimeMs?: number;
      env?: string;
      version?: string;
      connections?: number;
      uniqueUsers?: number;
      onlineUsers?: number;
      error?: string;
    };
    players?: {
      count?: number;
      error?: string;
    };
    latencyMs?: number | null;
    updatedAt?: string;
  } = await res.json();

  const online = Number(status?.players?.count ?? status?.health?.onlineUsers ?? status?.health?.connections ?? 0);

  return new Response(
    JSON.stringify({
      ok: Boolean(status?.health?.ok),
      onlinePlayers: Number.isFinite(online) ? online : 0,
      latencyMs: typeof status?.latencyMs === 'number' ? status.latencyMs : null,
      uptimeMs: typeof status?.health?.uptimeMs === 'number' ? status.health.uptimeMs : null,
      startedAt: status?.health?.startedAt ?? null,
      deployStartedAt: status?.health?.deployStartedAt ?? null,
      deployUptimeMs: typeof status?.health?.deployUptimeMs === 'number' ? status.health.deployUptimeMs : null,
      connections: typeof status?.health?.connections === 'number' ? status.health.connections : 0,
      uniqueUsers: typeof status?.health?.uniqueUsers === 'number' ? status.health.uniqueUsers : null,
      env: status?.health?.env ?? null,
      version: status?.health?.version ?? null,
      updatedAt: status?.updatedAt ?? new Date().toISOString(),
      errors: {
        health: status?.health?.error ?? null,
        players: status?.players?.error ?? null,
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    },
  );
};
