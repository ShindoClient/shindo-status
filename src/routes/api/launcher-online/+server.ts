import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
  const res = await fetch('/api/launcher-summary');
  const summary: { ok?: boolean; onlinePlayers?: number; updatedAt?: string } = await res.json();

  return new Response(
    JSON.stringify({
      ok: Boolean(summary?.ok),
      onlinePlayers: Number(summary?.onlinePlayers ?? 0),
      updatedAt: summary?.updatedAt ?? new Date().toISOString(),
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
