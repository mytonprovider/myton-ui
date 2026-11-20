import type { Provider } from "./catalog"

const PRIZE_RANK = 3
const TOP_RANK = 10
const FREE_LOW = 15
const FREE_WARN = 25

export type RankTone = "prize" | "top" | "rest"
export type FreeTone = "red" | "orange" | "normal"

// The place by rating among the providers given, which a list passes as what its filters keep; the unrated have none.
// Ratings are compared as every front prints them, to two places: two providers at 23.38 share #3 and the next is #5.
export const rankByRating = (providers: Provider[]): Record<string, number> => {
  const ranks: Record<string, number> = {}
  const shown = (provider: Provider): number => Math.round((provider.rating ?? 0) * 100)
  providers
    .filter((provider) => (provider.rating ?? 0) > 0)
    .sort((a, b) => shown(b) - shown(a))
    .forEach((provider, index, sorted) => {
      const previous = sorted[index - 1]
      ranks[provider.pubkey] = previous && shown(previous) === shown(provider) ? ranks[previous.pubkey] : index + 1
    })
  return ranks
}

// Kept inside 0–100: a provider that reports more used than total shows none left, not a negative share.
export const freePercent = (provider: Provider): number | null => {
  const total = provider.telemetry?.totalSpaceBytes ?? null
  const used = provider.telemetry?.usedSpaceBytes ?? null
  if (total === null || used === null || total <= 0) return null
  return Math.min(100, Math.max(0, ((total - used) / total) * 100))
}

export const rankTone = (rank: number): RankTone => (rank <= PRIZE_RANK ? "prize" : rank <= TOP_RANK ? "top" : "rest")

// Plenty of room stays quiet; only running low takes a colour.
export const freeTone = (percent: number): FreeTone =>
  percent <= FREE_LOW ? "red" : percent <= FREE_WARN ? "orange" : "normal"
