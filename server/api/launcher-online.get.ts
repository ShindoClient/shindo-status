import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const summary = await $fetch<{ ok?: boolean; onlinePlayers?: number; updatedAt?: string }>('/api/launcher-summary')
  return {
    ok: Boolean(summary?.ok),
    onlinePlayers: Number(summary?.onlinePlayers ?? 0),
    updatedAt: summary?.updatedAt ?? new Date().toISOString(),
  }
})
