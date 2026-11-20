import type { Provider } from "./catalog"
import { freeBytes } from "./filters"
import { providerStatus, type ProviderState } from "./status"

export const SORT_FIELDS = [
  "pubkey",
  "rating",
  "status",
  "uptime",
  "price",
  "freeSpace",
  "workingTime",
  "location",
] as const

export type SortField = (typeof SORT_FIELDS)[number]
export type SortDirection = "asc" | "desc"

// The column already sorted turns its order over; another one starts from the top of its scale
export const nextSortDirection = (picked: SortField, field: SortField, direction: SortDirection): SortDirection =>
  picked !== field || direction === "asc" ? "desc" : "asc"

// Worst to best, so a descending sort puts the stable ones first; the share of passed checks orders a state inside
const STATUS_ORDER: Record<ProviderState, number> = {
  noData: 0,
  unknown: 1,
  unavailable: 2,
  notStored: 3,
  noProofs: 4,
  unstable: 5,
  partial: 6,
  stable: 7,
}

const passedShare = (provider: Provider): number => {
  const total = provider.reasons.reduce((sum, item) => sum + item.count, 0)
  const valid = provider.reasons.find((item) => item.reason === 0)?.count ?? 0
  return total > 0 ? valid / total : 0
}

// An unknown number sorts below every known one, so it never passes for zero
const sortValue = (provider: Provider, field: SortField): string | number => {
  switch (field) {
    case "pubkey":
      return provider.pubkey
    case "location":
      return provider.location?.country ?? ""
    case "status": {
      const { state, ratio } = providerStatus(provider)
      return STATUS_ORDER[state] + (ratio ?? passedShare(provider))
    }
    case "freeSpace":
      return freeBytes(provider) ?? -1
    default:
      return provider[field] ?? -1
  }
}

export const sortProviders = (providers: Provider[], field: SortField, direction: SortDirection): Provider[] => {
  const sign = direction === "asc" ? 1 : -1

  return [...providers].sort((a, b) => {
    const left = sortValue(a, field)
    const right = sortValue(b, field)
    return typeof left === "string" && typeof right === "string"
      ? left.localeCompare(right) * sign
      : (Number(left) - Number(right)) * sign
  })
}
