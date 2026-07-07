import { browser } from '$app/environment';

const STORAGE_KEY = 'shindo-api-history';

interface HistoryData {
  players: Array<{
    timestamp: number;
    count: number;
  }>;
  latency: Array<{
    timestamp: number;
    value: number;
  }>;
  playersList: Array<{
    timestamp: number;
    players: Array<{
      username: string;
      uuid: string;
      accountType: string;
    }>;
  }>;
}

async function loadHistory(): Promise<HistoryData> {
  if (!browser) {
    return { players: [], latency: [], playersList: [] };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { players: [], latency: [], playersList: [] };
  } catch (error) {
    console.error('Error loading history:', error);
    return { players: [], latency: [], playersList: [] };
  }
}

async function saveHistory(data: HistoryData) {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

export async function addPlayerHistory(count: number) {
  const history = await loadHistory();
  const timestamp = Date.now();
  const twentyFourHoursAgo = timestamp - (24 * 60 * 60 * 1000);

  history.players = [
    ...history.players.filter(entry => entry.timestamp >= twentyFourHoursAgo),
    { timestamp, count }
  ];

  await saveHistory(history);
}

export async function addLatencyHistory(latency: number) {
  const history = await loadHistory();
  const timestamp = Date.now();
  const twentyFourHoursAgo = timestamp - (24 * 60 * 60 * 1000);

  history.latency = [
    ...history.latency.filter(entry => entry.timestamp >= twentyFourHoursAgo),
    { timestamp, value: latency }
  ];

  await saveHistory(history);
}

export async function addPlayersListHistory(players: Array<{ username: string; uuid: string; accountType: string }>) {
  const history = await loadHistory();
  const timestamp = Date.now();
  const twentyFourHoursAgo = timestamp - (24 * 60 * 60 * 1000);

  history.playersList = [
    ...history.playersList.filter(entry => entry.timestamp >= twentyFourHoursAgo),
    {
      timestamp,
      players: players.map(p => ({
        username: p.username || p.uuid,
        uuid: p.uuid,
        accountType: (p.accountType || 'member').toLowerCase()
      }))
    }
  ];

  await saveHistory(history);
}

export async function getPlayerHistory(hours = 24) {
  const history = await loadHistory();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return history.players
    .filter(entry => entry.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getLatencyHistory(hours = 24) {
  const history = await loadHistory();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return history.latency
    .filter(entry => entry.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getPlayersListHistory(hours = 24) {
  const history = await loadHistory();
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return history.playersList
    .filter(entry => entry.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}
