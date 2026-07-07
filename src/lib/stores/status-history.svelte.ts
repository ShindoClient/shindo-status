export interface StatusData {
  players?: {
    count: number;
  };
  latencyMs?: number | null;
  health?: {
    ok: boolean;
  };
}

export interface HistoryPoint {
  t: number;
  count: number;
  latency: number | null;
  ok: boolean;
}

export function createStatusHistory() {
  const maxPoints = 30;
  const minIntervalMs = 1000;

  let history = $state<HistoryPoint[]>([]);
  let lastUpdate = 0;

  function update(data: StatusData | null) {
    if (!data) return;

    const now = Date.now();
    if (history.length > 0 && now - lastUpdate < minIntervalMs) return;

    lastUpdate = now;

    const point: HistoryPoint = {
      t: now,
      count: data.players?.count ?? 0,
      latency: data.latencyMs ?? null,
      ok: data.health?.ok ?? false
    };

    history = [...history.slice(-(maxPoints - 1)), point];
  }

  function init(data: StatusData | null) {
    if (!data) return;
    const now = Date.now();
    lastUpdate = now;

    const point: HistoryPoint = {
      t: now,
      count: data.players?.count ?? 0,
      latency: data.latencyMs ?? null,
      ok: data.health?.ok ?? false
    };

    history = [point];
  }

  const players: Array<{ t: number; count: number; latency: number | null }> = $derived.by((): Array<{ t: number; count: number; latency: number | null }> => {
    if (history.length === 0) return [];
    return history.map((p) => ({
      t: p.t,
      count: p.count,
      latency: p.latency
    }));
  });

  const latency: Array<{ t: number; latency: number }> = $derived.by((): Array<{ t: number; latency: number }> => {
    return history
      .filter((p) => p.latency !== null)
      .map((p) => ({
        t: p.t,
        latency: p.latency as number
      }));
  });

  const uptimeSeries: Array<{ t: number; ok: boolean }> = $derived.by((): Array<{ t: number; ok: boolean }> => {
    if (history.length === 0) return [];
    return history.map((p) => ({
      t: p.t,
      ok: p.ok
    }));
  });

  return {
    get players() { return players; },
    get latency() { return latency; },
    get uptimeSeries() { return uptimeSeries; },
    get history() { return history; },
    update,
    init
  };
}
