import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
  const res = await fetch('/api/status');
  const status: {
    players?: {
      count?: number;
      list?: Array<{
        uuid?: string;
        name?: string;
        accountType?: string;
        connectedAt?: number | string;
        lastSeen?: number | string;
        roles?: unknown;
      }>;
      error?: string;
    };
    updatedAt?: string;
  } = await res.json();

  const list = Array.isArray(status?.players?.list) ? status.players.list : [];

  return new Response(
    JSON.stringify({
      count: Number(status?.players?.count ?? list.length ?? 0),
      players: list.map((player) => ({
        uuid: typeof player?.uuid === 'string' ? player.uuid : null,
        name: typeof player?.name === 'string' ? player.name : 'Unknown',
        accountType: typeof player?.accountType === 'string' ? player.accountType : 'LOCAL',
        connectedAt: player?.connectedAt ?? null,
        lastSeen: player?.lastSeen ?? null,
        roles: player?.roles ?? [],
      })),
      error: status?.players?.error ?? null,
      updatedAt: status?.updatedAt ?? new Date().toISOString(),
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
