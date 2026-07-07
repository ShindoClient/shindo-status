export interface OnlinePlayer {
  uuid: string;
  name: string;
  accountType: 'MICROSOFT' | 'OFFLINE';
  lastSeen: number;
  roles?: 'Member' | 'Gold' | 'Diamond' | 'Staff';
}

const VALID_ROLES = ['Staff', 'Diamond', 'Gold', 'Member'] as const;

export function createOnlinePlayersStore(baseUrl: string) {
  let players = $state<OnlinePlayer[]>([]);
  let loading = $state(false);
  let error = $state<Error | null>(null);

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const apiUrl = `${normalizedBaseUrl}/v1/connected-users`;

  async function fetchPlayers() {
    if (!baseUrl) {
      error = new Error('Base URL is not configured');
      return;
    }

    loading = true;
    error = null;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch online players: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (json.success && Array.isArray(json.users)) {
        players = json.users.map((user: any) => {
          const rawAccountType = (user.accountType || '').toUpperCase();
          const accountType: 'MICROSOFT' | 'OFFLINE' =
            rawAccountType === 'MICROSOFT' ? 'MICROSOFT' : 'OFFLINE';

          const rawRole = (user.roles || 'member').toString();
          const normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
          const roles: 'Member' | 'Gold' | 'Diamond' | 'Staff' =
            (VALID_ROLES as readonly string[]).includes(normalizedRole)
              ? (normalizedRole as 'Member' | 'Gold' | 'Diamond' | 'Staff')
              : 'Member';

          return {
            ...user,
            accountType,
            roles
          };
        });
      }
    } catch (err) {
      console.error('Error fetching online players:', err);
      error = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading = false;
    }
  }

  const playersByRank: Record<string, OnlinePlayer[]> = $derived.by(() => {
    const groups: Record<string, OnlinePlayer[]> = {
      Staff: [],
      Diamond: [],
      Gold: [],
      Member: []
    };

    for (const player of players) {
      const playerRole = player.roles || 'Member';
      const normalizedRole = playerRole.toLowerCase();

      let rank: 'Staff' | 'Diamond' | 'Gold' | 'Member' = 'Member';

      if (normalizedRole.includes('staff')) {
        rank = 'Staff';
      } else if (normalizedRole.includes('diamond')) {
        rank = 'Diamond';
      } else if (normalizedRole.includes('gold')) {
        rank = 'Gold';
      }

      groups[rank].push(player);
    }

    for (const group of Object.values(groups)) {
      group.sort((a, b) => a.name.localeCompare(b.name));
    }

    return groups;
  });

  return {
    get players() { return players; },
    get playersByRank() { return playersByRank; },
    get loading() { return loading; },
    get error() { return error; },
    fetchPlayers
  };
}
