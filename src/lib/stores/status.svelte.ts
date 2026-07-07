import { browser } from '$app/environment';

export interface StatusResponse {
  health?: {
    ok: boolean;
    startedAt?: string;
    uptimeMs?: number;
  };
  players?: {
    count: number;
    list: any[];
    error?: string;
  };
  latencyMs?: number | null;
  timestamp?: string;
}

export function createStatusStore() {
  let data = $state<StatusResponse | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(false);
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  async function fetchStatus() {
    loading = true;
    error = null;

    try {
      const response = await fetch('/api/status', { headers: noCacheHeaders });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      data = await response.json() as StatusResponse;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch status';
      console.error('Error fetching status:', e);
    } finally {
      loading = false;
    }
  }

  function startPolling(intervalMs = 30000) {
    if (!browser) return;
    if (pollingInterval !== null) return;
    pollingInterval = setInterval(fetchStatus, intervalMs);
  }

  function stopPolling() {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  return {
    get data() { return data; },
    get error() { return error; },
    get loading() { return loading; },
    fetchStatus,
    startPolling,
    stopPolling
  };
}
