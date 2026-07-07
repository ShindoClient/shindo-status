<script lang="ts">
import { Users, User, Gem, Award, Shield, ChevronDown, ChevronUp } from '@lucide/svelte'
import BaseCard from './BaseCard.svelte'

export interface OnlinePlayer {
  uuid: string
  name: string
  accountType: 'MICROSOFT' | 'OFFLINE'
  lastSeen: number
  roles?: 'Member' | 'Gold' | 'Diamond' | 'Staff'
}

let {
  loading = false,
  players = [],
  playersByRank = undefined as Record<string, OnlinePlayer[]> | undefined
}: {
  loading?: boolean
  players: OnlinePlayer[]
  playersByRank?: Record<string, OnlinePlayer[]>
} = $props()

let expandedCategories = $state<Record<string, boolean>>({})

function toggleCategory(category: string) {
  expandedCategories[category] = !expandedCategories[category]
}

const hasOnlinePlayers = $derived(players.length > 0)

const displayGroups = $derived(playersByRank || { Jogadores: players })

const rankIconConfig: Record<string, { component: typeof Shield; color: string }> = {
  Staff: { component: Shield, color: 'text-red-400' },
  Diamond: { component: Gem, color: 'text-blue-400' },
  Gold: { component: Award, color: 'text-yellow-400' },
  Member: { component: User, color: 'text-gray-400' }
}

const rankColorMap: Record<string, string> = {
  Staff: 'from-red-500/10 to-red-600/10 border-red-500/20',
  Diamond: 'from-blue-500/10 to-indigo-600/10 border-blue-500/20',
  Gold: 'from-yellow-500/10 to-amber-600/10 border-amber-500/20',
  Member: 'from-gray-500/10 to-gray-600/10 border-gray-500/20'
}

const playerIconColorMap: Record<string, string> = {
  Staff: 'text-red-400',
  Diamond: 'text-blue-400',
  Gold: 'text-yellow-400',
  Member: 'text-gray-300'
}

function getRankIcon(rank: string): typeof Shield {
  return rankIconConfig[rank]?.component || User
}

function getRankColor(rank: string): string {
  return rankColorMap[rank] || rankColorMap['Member']
}

function getRankIconColor(rank: string): string {
  return rankIconConfig[rank]?.color || 'text-gray-400'
}

function getPlayerIconColor(roles: string | undefined): string {
  return playerIconColorMap[roles || 'Member'] || 'text-gray-300'
}

function getAccountTypeLabel(type: string): string {
  return type === 'MICROSOFT' ? 'Microsoft' : 'Cracked'
}

function getPlayerHead(uuid: string): string {
  return `https://crafatar.com/avatars/${uuid}?size=40&overlay&default=steve`
}

function handleAvatarError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = `https://crafatar.com/avatars/steve?size=40&overlay`
}

const rankOrder = ['Staff', 'Diamond', 'Gold', 'Member']
</script>

<BaseCard class="h-full flex flex-col">
  <div class="relative px-6 py-4 border-b border-gray-700/50">
    <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50 rounded-t-lg"></div>
    <div class="relative z-10 flex items-center gap-3">
      <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-300">
        <Users class="w-5 h-5" />
      </div>
      <h3 class="text-sm font-semibold text-white/90">Jogadores Online</h3>
      <span class="ml-auto bg-gray-700/50 text-white/80 text-xs px-2.5 py-1 rounded-full">
        {players.length} / 100
      </span>
    </div>
  </div>

  <div class="flex-1 p-6 flex flex-col">
    {#if loading}
      <div class="flex-1 flex items-center justify-center">
        <div class="text-white/50">Carregando jogadores...</div>
      </div>
    {:else if !hasOnlinePlayers}
      <div class="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div class="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <User class="w-8 h-8 text-gray-500" />
        </div>
        <h4 class="text-white/90 font-medium mb-1">Nenhum jogador online</h4>
        <p class="text-sm text-white/60 max-w-xs">Os jogadores que estiverem online aparecer\u00e3o aqui</p>
      </div>
    {:else}
      <div class="space-y-6 overflow-y-auto pr-2 -mr-2 max-h-[500px]">
        {#each rankOrder as rank}
          {@const group = displayGroups[rank]}
          {#if group && group.length > 0}
            <div class="space-y-3">
              {#if playersByRank}
                <button
                  onclick={() => toggleCategory(rank)}
                  class="w-full flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors mb-1"
                >
                  {#if rank === 'Staff'}
                    <Shield class="w-3.5 h-3.5 {getRankIconColor(rank)}" />
                  {:else if rank === 'Diamond'}
                    <Gem class="w-3.5 h-3.5 {getRankIconColor(rank)}" />
                  {:else if rank === 'Gold'}
                    <Award class="w-3.5 h-3.5 {getRankIconColor(rank)}" />
                  {:else}
                    <User class="w-3.5 h-3.5 {getRankIconColor(rank)}" />
                  {/if}
                  <span class="uppercase tracking-wider">{rank}</span>
                  <span class="ml-auto text-white/40">{group.length}</span>
                  {#if expandedCategories[rank]}
                    <ChevronUp class="w-4 h-4 ml-1 text-white/40" />
                  {:else}
                    <ChevronDown class="w-4 h-4 ml-1 text-white/40" />
                  {/if}
                </button>
              {/if}

              {#if expandedCategories[rank] !== false}
                <div class="space-y-2">
                  {#each group as player (player.uuid)}
                    <div class="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors">
                      <div class="relative">
                        <img
                          src={getPlayerHead(player.uuid)}
                          alt={player.name}
                          class="w-10 h-10 rounded-md border-2 border-gray-600/50 group-hover:border-indigo-400/50 transition-colors"
                          loading="lazy"
                          onerror={handleAvatarError}
                        />
                        <div
                          class="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 border border-gray-700/50"
                          class:text-blue-400={player.accountType === 'MICROSOFT'}
                          class:text-amber-400={player.accountType === 'OFFLINE'}
                          title={getAccountTypeLabel(player.accountType)}
                        >
                          <div
                            class="w-3 h-3 rounded-full"
                            class:bg-blue-500={player.accountType === 'MICROSOFT'}
                            class:bg-amber-500={player.accountType === 'OFFLINE'}
                          ></div>
                        </div>
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h4 class="font-medium text-white truncate">{player.name}</h4>
                        </div>
                        <div class="flex items-center gap-1.5 mt-0.5">
                          {#if !playersByRank}
                            <span
                              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r border {getRankColor(player.roles || 'Member')}"
                            >
                              {#if (player.roles || 'Member') === 'Staff'}
                                <Shield class="w-3 h-3 mr-1 text-red-400" />
                              {:else if (player.roles || 'Member') === 'Diamond'}
                                <Gem class="w-3 h-3 mr-1 text-blue-400" />
                              {:else if (player.roles || 'Member') === 'Gold'}
                                <Award class="w-3 h-3 mr-1 text-yellow-400" />
                              {:else}
                                <User class="w-3 h-3 mr-1 text-gray-300" />
                              {/if}
                              {player.roles || 'Member'}
                            </span>
                          {/if}
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-xs text-white/60">Online</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/each}

        {#each Object.entries(displayGroups) as [rank, group]}
          {#if !rankOrder.includes(rank) && group.length > 0}
            <div class="space-y-3">
              <button
                onclick={() => toggleCategory(rank)}
                class="w-full flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors mb-1"
              >
                <User class="w-3.5 h-3.5 text-gray-400" />
                <span class="uppercase tracking-wider">{rank}</span>
                <span class="ml-auto text-white/40">{group.length}</span>
                {#if expandedCategories[rank]}
                  <ChevronUp class="w-4 h-4 ml-1 text-white/40" />
                {:else}
                  <ChevronDown class="w-4 h-4 ml-1 text-white/40" />
                {/if}
              </button>

              {#if expandedCategories[rank] !== false}
                <div class="space-y-2">
                  {#each group as player (player.uuid)}
                    <div class="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors">
                      <div class="relative">
                        <img
                          src={getPlayerHead(player.uuid)}
                          alt={player.name}
                          class="w-10 h-10 rounded-md border-2 border-gray-600/50 group-hover:border-indigo-400/50 transition-colors"
                          loading="lazy"
                          onerror={handleAvatarError}
                        />
                        <div
                          class="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 border border-gray-700/50"
                          class:text-blue-400={player.accountType === 'MICROSOFT'}
                          class:text-amber-400={player.accountType === 'OFFLINE'}
                          title={getAccountTypeLabel(player.accountType)}
                        >
                          <div
                            class="w-3 h-3 rounded-full"
                            class:bg-blue-500={player.accountType === 'MICROSOFT'}
                            class:bg-amber-500={player.accountType === 'OFFLINE'}
                          ></div>
                        </div>
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h4 class="font-medium text-white truncate">{player.name}</h4>
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-xs text-white/60">Online</span>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</BaseCard>
