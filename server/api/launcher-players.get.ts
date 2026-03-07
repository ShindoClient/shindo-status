import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const status = await $fetch<{
    players?: {
      count?: number
      list?: Array<{
        uuid?: string
        name?: string
        accountType?: string
        connectedAt?: number | string
        lastSeen?: number | string
        roles?: unknown
      }>
      error?: string
    }
    updatedAt?: string
  }>('/api/status')

  const list = Array.isArray(status?.players?.list) ? status.players!.list! : []

  return {
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
  }
})
