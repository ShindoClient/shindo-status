import type { RequestHandler } from './$types';

const SOURCE = 'https://cdn.shindoclient.com/data/meta/versioning.json';

export const GET: RequestHandler = async () => {
  const fallback = {
    build: null as number | null,
    semver: null as string | null,
    source: SOURCE,
  };

  try {
    const payload = await fetch(SOURCE, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    if (!payload.ok) {
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = (await payload.json()) as Record<string, unknown>;
    const channels = data?.channels as Record<string, unknown> | undefined;
    const stable = channels?.stable ?? null;
    const latest = data?.latest ?? null;

    const stableRecord = stable as Record<string, unknown> | null;
    const latestRecord = latest as Record<string, unknown> | null;

    const build = Number(stableRecord?.build ?? latestRecord?.build);
    const semver = (stableRecord?.semver ?? latestRecord?.semver ?? null) as string | null;

    return new Response(
      JSON.stringify({
        build: Number.isFinite(build) && build > 0 ? build : null,
        semver: typeof semver === 'string' && semver.trim().length > 0 ? semver : null,
        source: SOURCE,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch {
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
