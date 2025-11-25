<script setup lang="ts">
import { Users, User, Gem, Award, Shield, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { ref } from 'vue'
import BaseCard from './BaseCard.vue'
import type { OnlinePlayer } from '~/composables/useOnlinePlayers'

const expandedCategories = ref<Record<string, boolean>>({})

const toggleCategory = (category: string) => {
  expandedCategories.value = {
    ...expandedCategories.value,
    [category]: !expandedCategories.value[category]
  }
}
defineProps<{
  loading?: boolean
  players: OnlinePlayer[]
  playersByRank?: Record<string, OnlinePlayer[]>
}>()

const getRankIcon = (rank: string) => {
  const icons: Record<string, any> = {
    'Staff': Shield,
    'Diamond': Gem,
    'Gold': Award,
    'Member': User
  }
  return icons[rank] || User
}

const getRankColor = (rank: string) => {
  const colors: Record<string, string> = {
    'Staff': 'from-red-500/10 to-red-600/10 border-red-500/20',
    'Diamond': 'from-blue-500/10 to-indigo-600/10 border-blue-500/20',
    'Gold': 'from-yellow-500/10 to-amber-600/10 border-amber-500/20',
    'Member': 'from-gray-500/10 to-gray-600/10 border-gray-500/20'
  }
  return colors[rank] || colors['Member']
}

const getAccountTypeLabel = (type: string) => {
  return type === 'MICROSOFT' ? 'Microsoft' : 'Cracked'
}

// Generate Minecraft avatar URL using Crafatar
const getPlayerHead = (username: string) => {
  return `https://crafatar.com/avatars/${username}?size=40&overlay&default=steve`
}
</script>

<template>
  <BaseCard class="h-full flex flex-col">
    <!-- Header with plate style -->
    <div class="relative px-6 py-4 border-b border-gray-700/50">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50 rounded-t-lg"></div>
      <div class="relative z-10 flex items-center gap-3">
        <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-300">
          <Users class="w-5 h-5" />
        </div>
        <h3 class="text-sm font-semibold text-white/90">Jogadores Online</h3>
        <span class="ml-auto bg-gray-700/50 text-white/80 text-xs px-2.5 py-1 rounded-full">
          {{ players.length }} / 100
        </span>
      </div>
    </div>

    <div class="flex-1 p-6 flex flex-col">
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-white/50">Carregando jogadores...</div>
      </div>

      <div v-else-if="!players.length" class="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div class="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <User class="w-8 h-8 text-gray-500" />
        </div>
        <h4 class="text-white/90 font-medium mb-1">Nenhum jogador online</h4>
        <p class="text-sm text-white/60 max-w-xs">Os jogadores que estiverem online aparecerão aqui</p>
      </div>

      <div v-else class="space-y-6 overflow-y-auto pr-2 -mr-2 max-h-[500px]">
        <div v-for="(group, rank) in (playersByRank || { 'Jogadores': players })" :key="rank" class="space-y-3">
            <button
                v-if="playersByRank"
                @click="toggleCategory(rank)"
                class="w-full flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition-colors mb-1"
            >
              <component
                  :is="getRankIcon(rank)"
                  class="w-3.5 h-3.5"
                  :class="{
                    'text-red-400': rank === 'Staff',
                    'text-blue-400': rank === 'Diamond',
                    'text-yellow-400': rank === 'Gold',
                    'text-gray-400': rank === 'Member' || !rank
                  }"
              />
              <span class="uppercase tracking-wider">{{ rank }}</span>
              <span class="ml-auto text-white/40">{{ group.length }}</span>
              <component
                  :is="expandedCategories[rank] ? ChevronUp : ChevronDown"
                  class="w-4 h-4 ml-1 text-white/40"
              />
            </button>

          <div v-show="expandedCategories[rank] !== false" class="space-y-2">
            <div class="space-y-2">
              <div
                v-for="player in group"
                :key="player.uuid"
                class="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors"
              >
                <div class="relative">
                  <img
                    :src="getPlayerHead(player.uuid)"
                    :alt="player.name"
                    class="w-10 h-10 rounded-md border-2 border-gray-600/50 group-hover:border-indigo-400/50 transition-colors"
                    loading="lazy"
                  />
                  <div
                    class="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 border border-gray-700/50"
                    :class="{
                      'text-blue-400': player.accountType === 'MICROSOFT',
                      'text-amber-400': player.accountType === 'OFFLINE'
                    }"
                    :title="getAccountTypeLabel(player.accountType)"
                  >
                    <div class="w-3 h-3 rounded-full"
                      :class="{
                        'bg-blue-500': player.accountType === 'MICROSOFT',
                        'bg-amber-500': player.accountType === 'OFFLINE'
                      }"
                    ></div>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium text-white truncate">{{ player.name }}</h4>
                  </div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span
                      v-if="!playersByRank"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                      :class="`bg-gradient-to-r ${getRankColor(player.roles || 'Member')} border`"
                    >
                      <component
                        :is="getRankIcon(player.roles || 'Member')"
                        class="w-3 h-3 mr-1"
                        :class="{
                          'text-red-400': player.roles === 'Staff',
                          'text-blue-400': player.roles === 'Diamond',
                          'text-yellow-400': player.roles === 'Gold',
                          'text-gray-300': player.roles === 'Member' || !player.roles
                        }"
                      />
                      {{ player.roles || 'Member' }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-xs text-white/60">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
