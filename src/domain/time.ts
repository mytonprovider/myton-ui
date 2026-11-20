import type { Provider } from "./catalog"
import { DAY } from "./units"

export type TimeUnit = "year" | "day" | "hour" | "minute" | "second"

export interface DurationPart {
  value: number
  unit: TimeUnit
}

// one, few and many as Russian needs them; a language with two forms puts its plural into many
export type PluralForms = readonly [one: string, few: string, many: string]

export interface DurationWords {
  units: Record<TimeUnit, PluralForms>
  plural: (count: number) => 0 | 1 | 2
}

export interface AgoWords extends DurationWords {
  justNow: string
  ago: (time: string) => string
}

const MINUTE = 60
const HOUR = 3600
// A year is 365 days on every front, so the day remainder runs up to 364
const YEAR = 365 * DAY

// Every front calls the last minute "just now", including a negative age when the clock runs behind the node
export const JUST_NOW_SEC = 60

// A last-online or telemetry age past ten minutes is stale: every front shows it in red
const STALE_AGE_SEC = 600

export const isStale = (now: number, then: number | null | undefined): boolean =>
  then != null && now - then > STALE_AGE_SEC

export type StaleSignal = "offline" | "telemetry"

// Two signals apart: a node can stay online with its telemetry stopped, or leave a report from before it went down.
// An age nobody reported says nothing, so it raises neither.
export const staleSignals = (
  provider: Pick<Provider, "lastOnlineAt" | "sendsTelemetry" | "telemetry">,
  now: number,
): StaleSignal[] => {
  const signals: StaleSignal[] = []
  if (isStale(now, provider.lastOnlineAt)) signals.push("offline")
  if (provider.sendsTelemetry && isStale(now, provider.telemetry?.updatedAt)) signals.push("telemetry")
  return signals
}

export const pluralIndexRu = (count: number): 0 | 1 | 2 => {
  const tens = Math.abs(count) % 100
  const ones = tens % 10
  if (ones === 1 && tens !== 11) return 0
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return 1
  return 2
}

export const pluralIndexEn = (count: number): 0 | 1 | 2 => (count === 1 ? 0 : 2)

// The largest unit that is not zero, then its next smaller neighbour when that is not zero either;
// seconds are never the second part
const partsOf = (seconds: number, maxParts: 1 | 2): DurationPart[] => {
  const total = Math.max(0, Math.round(seconds))
  if (total < MINUTE) return [{ value: total, unit: "second" }]
  const ladder: DurationPart[] = [
    { value: Math.floor(total / YEAR), unit: "year" },
    { value: Math.floor(total / DAY) % 365, unit: "day" },
    { value: Math.floor(total / HOUR) % 24, unit: "hour" },
    { value: Math.floor(total / MINUTE) % 60, unit: "minute" },
  ]
  const top = ladder.findIndex((part) => part.value > 0)
  const next = ladder[top + 1]
  return maxParts === 2 && next !== undefined && next.value > 0 ? [ladder[top], next] : [ladder[top]]
}

export const durationParts = (
  seconds: number | null | undefined,
  { maxParts = 2 }: { maxParts?: 1 | 2 } = {},
): DurationPart[] | null => (seconds == null || !Number.isFinite(seconds) ? null : partsOf(seconds, maxParts))

const joinParts = (parts: readonly DurationPart[], words: DurationWords): string =>
  parts.map(({ value, unit }) => `${value} ${words.units[unit][words.plural(value)]}`).join(" ")

export const formatDuration = (parts: readonly DurationPart[] | null, words: DurationWords): string | null =>
  parts === null ? null : joinParts(parts, words)

export type Ago = { justNow: true } | { justNow: false; parts: DurationPart[] }

export const ago = (now: number, then: number | null | undefined): Ago | null => {
  if (then == null || !Number.isFinite(then) || then <= 0 || !Number.isFinite(now)) return null
  const age = now - then
  return age < JUST_NOW_SEC ? { justNow: true } : { justNow: false, parts: partsOf(age, 2) }
}

export const formatAgo = (now: number, then: number | null | undefined, words: AgoWords): string | null => {
  const since = ago(now, then)
  if (since === null) return null
  if (since.justNow) return words.justNow
  return words.ago(joinParts(since.parts, words))
}
