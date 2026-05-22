import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const source = 'https://cdn.shindoclient.com/data/meta/versioning.json'

  const fallback = {
    build: null as number | null,
    semver: null as string | null,
    source,
  }

  try {
    const payload = await fetch(source, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })

    if (!payload.ok) {
      return fallback
    }

    const data = (await payload.json()) as Record<string, any>
    const stable = data?.channels?.stable || null
    const latest = data?.latest || null

    const build = Number(stable?.build ?? latest?.build)
    const semver = (stable?.semver ?? latest?.semver ?? null) as string | null

    return {
      build: Number.isFinite(build) && build > 0 ? build : null,
      semver: typeof semver === 'string' && semver.trim().length > 0 ? semver : null,
      source,
    }
  } catch {
    return fallback
  }
})
