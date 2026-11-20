import { checkKind, type CheckKind } from "./checks"
import type { StatusTone } from "./tone"

export type ProviderState =
  | "noData"
  | "stable"
  | "partial"
  | "unstable"
  | "unavailable"
  | "notStored"
  | "noProofs"
  | "unknown"

export interface ReasonCount {
  reason: number
  count: number
}

export interface StatusInput {
  status: number | null
  statusRatio: number | null
  reasons: readonly ReasonCount[]
}

// ratio is the share of passed checks, so it exists only while the most frequent code is a pass
export interface ProviderStatus {
  state: ProviderState
  ratio: number | null
}

const STABLE_FROM = 0.99
const PARTIAL_FROM = 0.8

const STATE_OF_KIND: Record<Exclude<CheckKind, "stored">, ProviderState> = {
  unavailable: "unavailable",
  unchecked: "unknown",
  noBagInfo: "notStored",
  noProof: "noProofs",
  unknown: "unknown",
}

const NO_DATA: ProviderStatus = { state: "noData", ratio: null }

export const checkCounts = (reasons: readonly ReasonCount[]): { passed: number; total: number } => ({
  passed: reasons.find((item) => item.reason === 0)?.count ?? 0,
  total: reasons.reduce((sum, item) => sum + item.count, 0),
})

// The coordinator always sends status_ratio as the share of the most frequent code, rounded to four
// places (providers/repository.go UpdateStatuses); counting the reasons is the fallback for a body without it
const passedShare = ({ statusRatio, reasons }: StatusInput): number | null => {
  if (statusRatio != null && Number.isFinite(statusRatio)) return statusRatio
  const { passed, total } = checkCounts(reasons)
  return total > 0 ? passed / total : null
}

export const ratioState = (ratio: number | null | undefined): "stable" | "partial" | "unstable" | null => {
  if (ratio == null || !Number.isFinite(ratio)) return null
  return ratio >= STABLE_FROM ? "stable" : ratio >= PARTIAL_FROM ? "partial" : "unstable"
}

export const providerStatus = (provider: StatusInput): ProviderStatus => {
  const kind = checkKind(provider.status)
  if (kind === null) return NO_DATA
  if (kind !== "stored") return { state: STATE_OF_KIND[kind], ratio: null }
  const ratio = passedShare(provider)
  const state = ratioState(ratio)
  return state === null ? NO_DATA : { state, ratio }
}

// Rounding to the four places upstream sends comes first: 0.57 * 100 is 56.99999999999999 in float64
export const ratioPercent = (ratio: number | null | undefined): number | null =>
  ratio == null || !Number.isFinite(ratio) ? null : Math.floor(Math.round(ratio * 1e4) / 100)

// A pass that holds less than the stable share of checks hides the failure behind it, so the runner-up
// is named instead. Upstream breaks ties arbitrarily; here a failure goes before a pass and the input
// order decides between failures.
export const dominantReason = (reasons: readonly ReasonCount[]): number | null => {
  const sorted = [...reasons].sort((a, b) => b.count - a.count || Number(a.reason === 0) - Number(b.reason === 0))
  const [top, next] = sorted
  if (top === undefined) return null
  if (top.reason !== 0 || next === undefined) return top.reason
  const total = sorted.reduce((sum, item) => sum + item.count, 0)
  return top.count >= total * PARTIAL_FROM ? top.reason : next.reason
}

// No proofs is orange, a step below a provider that does not store the bag at all
export const STATE_TONE: Record<ProviderState, StatusTone> = {
  stable: "green",
  partial: "yellow",
  unstable: "red",
  notStored: "red",
  noProofs: "orange",
  unavailable: "gray",
  unknown: "gray",
  noData: "gray",
}

// One tone map for every front; an unavailable check is grey, as an unavailable provider is
export const KIND_TONE: Record<CheckKind, StatusTone> = {
  stored: "green",
  unavailable: "gray",
  unchecked: "gray",
  noBagInfo: "red",
  noProof: "orange",
  unknown: "gray",
}

// A check without a code reads as an unknown one
export const reasonTone = (reason: number | null | undefined): StatusTone => KIND_TONE[checkKind(reason) ?? "unknown"]
