import type { Provider } from "./catalog"
import { PING_MAX, parseDiskSpeed } from "./format"
import { providerStatus } from "./status"
import { DAY, GIB, NANO } from "./units"

const MEGABIT = 1e6

// The site's has_free_space, on by default (dearjohndoe/mytonprovider-org app/page.tsx L16): more than 4 GiB left, the
// floor its backend applies (mytonprovider-backend coordinator/internal/repositories/providers/helpers.go L61)
const FREE_SPACE_FLOOR = 4 * GIB

// The scale stops where 95 % of the catalog ends: ping runs to 1 800 000 ms while 95 % fit in 688, and a scale to
// the maximum left them in 0.04 % of the track
const EDGE_SHARE = 0.95

export type FilterGroupId = "provider" | "storage" | "benchmarks" | "hardware" | "network" | "software"

export type RangeId =
  | "rating"
  | "age"
  | "uptime"
  | "price"
  | "minSpan"
  | "maxSpan"
  | "bagSize"
  | "diskRead"
  | "diskWrite"
  | "totalSpace"
  | "usedSpace"
  | "cores"
  | "ram"
  | "ramUsage"
  | "download"
  | "upload"
  | "ping"

export type ListId = "location" | "hosting" | "storageHash" | "providerHash"
export type FlagId = "freeSpace" | "stableOnly"
export type ChoiceId = "cpuVirtual" | "telemetry"
export type TextId = "cpuName"
export type FilterId = RangeId | ListId | FlagId | ChoiceId | TextId

// A bound left out is open: the far end of a slider means "and beyond", so nobody past the scale is lost
export interface RangeValue {
  from?: number
  to?: number
}

export type FilterValues = Partial<
  Record<RangeId, RangeValue> &
    Record<ListId, string[]> &
    Record<FlagId, true> &
    Record<ChoiceId, boolean> &
    Record<TextId, string>
>

export interface Edge {
  min: number
  max: number
}

export type FilterEdges = Record<RangeId, Edge>

export interface ListOption {
  value: string
  label: string
  count: number
}

interface RangeField {
  kind: "range"
  id: RangeId
  step: number
  fixed?: Edge
  read: (provider: Provider, now: number) => number | null
}

interface ListField {
  kind: "list"
  id: ListId
  mono?: boolean
  read: (provider: Provider) => { value: string; label: string } | null
}

interface FlagField {
  kind: "flag"
  id: FlagId
  test: (provider: Provider) => boolean
}

interface ChoiceField {
  kind: "choice"
  id: ChoiceId
  read: (provider: Provider) => boolean
}

interface TextField {
  kind: "text"
  id: TextId
  read: (provider: Provider) => string | null
}

export type FilterField = RangeField | ListField | FlagField | ChoiceField | TextField

export interface FilterGroup {
  id: FilterGroupId
  fields: FilterField[]
}

const finite = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null

const per = (value: number | null | undefined, unit: number): number | null => {
  const amount = finite(value)
  return amount === null ? null : amount / unit
}

const same = (text: string | null | undefined) => (text ? { value: text, label: text } : null)

// Legal forms trailing a hosting name, as the backend folds them into isp_key (sync_providers.py LEGAL_SUFFIXES):
// "Interserver" and "Interserver, Inc" are one company
const LEGAL_SUFFIXES = ["inc", "llc", "ltd", "limited", "gmbh", "ou", "pjsc", "plc"]

export const hostingKey = (name: string | null | undefined): string | null => {
  if (!name || name === "Unknown") return null
  const words = name.toLowerCase().replace(/,/g, " ").split(/\s+/).filter(Boolean)
  while (words.length && LEGAL_SUFFIXES.includes(words[words.length - 1].replace(/\.$/, ""))) words.pop()
  return words.length ? words.join(" ") : null
}

export const freeBytes = (provider: Provider): number | null => {
  const total = finite(provider.telemetry?.totalSpaceBytes)
  const used = finite(provider.telemetry?.usedSpaceBytes)
  return total === null || used === null ? null : Math.max(0, total - used)
}

// Each group reads lists first, then switches, then scales by how often they are reached for, related fields side by
// side; location, stable only and free space lead the sheet
export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "provider",
    fields: [
      {
        kind: "list",
        id: "location",
        read: (provider) => {
          const place = provider.location
          return place?.countryIso ? { value: place.countryIso, label: place.country || place.countryIso } : null
        },
      },
      { kind: "flag", id: "stableOnly", test: (provider) => providerStatus(provider).state === "stable" },
      {
        kind: "flag",
        id: "freeSpace",
        test: (provider) => (freeBytes(provider) ?? 0) > FREE_SPACE_FLOOR,
      },
      {
        kind: "range",
        id: "uptime",
        step: 0.1,
        fixed: { min: 0, max: 100 },
        read: (provider) => finite(provider.uptime),
      },
      { kind: "range", id: "rating", step: 0.01, read: (provider) => finite(provider.rating) },
      {
        kind: "range",
        id: "age",
        step: 1,
        read: (provider, now) => (provider.regTime === null ? null : (now - provider.regTime) / DAY),
      },
    ],
  },
  // The terms a bag is stored on, out of the provider's own group: ten fields there made one column of the desktop
  // sheet a hundred pixels longer than the other
  {
    id: "storage",
    fields: [
      { kind: "range", id: "price", step: 0.01, read: (provider) => per(provider.price, NANO) },
      { kind: "range", id: "bagSize", step: 1, read: (provider) => per(provider.maxBagBytes, GIB) },
      { kind: "range", id: "minSpan", step: 1, read: (provider) => per(provider.minSpan, DAY) },
      { kind: "range", id: "maxSpan", step: 1, read: (provider) => per(provider.maxSpan, DAY) },
    ],
  },
  {
    id: "benchmarks",
    fields: [
      { kind: "range", id: "diskRead", step: 1, read: (provider) => parseDiskSpeed(provider.telemetry?.diskRead) },
      { kind: "range", id: "diskWrite", step: 1, read: (provider) => parseDiskSpeed(provider.telemetry?.diskWrite) },
    ],
  },
  {
    id: "hardware",
    fields: [
      { kind: "text", id: "cpuName", read: (provider) => provider.telemetry?.cpuName || null },
      // An unknown CPU counts as physical, as the site's backend answers cpu_is_virtual=false
      { kind: "choice", id: "cpuVirtual", read: (provider) => provider.telemetry?.cpuVirtual ?? false },
      { kind: "range", id: "cores", step: 1, read: (provider) => finite(provider.telemetry?.cpuCount) },
      { kind: "range", id: "totalSpace", step: 10, read: (provider) => per(provider.telemetry?.totalSpaceBytes, GIB) },
      { kind: "range", id: "usedSpace", step: 10, read: (provider) => per(provider.telemetry?.usedSpaceBytes, GIB) },
      { kind: "range", id: "ram", step: 1, read: (provider) => per(provider.telemetry?.totalRamBytes, GIB) },
      {
        kind: "range",
        id: "ramUsage",
        step: 1,
        fixed: { min: 0, max: 100 },
        read: (provider) => finite(provider.telemetry?.ramUsagePercent),
      },
    ],
  },
  {
    id: "network",
    fields: [
      {
        kind: "list",
        id: "hosting",
        read: (provider) => {
          const key = hostingKey(provider.telemetry?.isp)
          return key === null ? null : { value: key, label: provider.telemetry?.isp ?? key }
        },
      },
      { kind: "range", id: "download", step: 1, read: (provider) => per(provider.telemetry?.downloadBits, MEGABIT) },
      { kind: "range", id: "upload", step: 1, read: (provider) => per(provider.telemetry?.uploadBits, MEGABIT) },
      {
        kind: "range",
        id: "ping",
        step: 1,
        read: (provider) => {
          const ping = finite(provider.telemetry?.pingMs)
          return ping !== null && ping < PING_MAX ? ping : null
        },
      },
    ],
  },
  {
    id: "software",
    fields: [
      { kind: "list", id: "storageHash", mono: true, read: (provider) => same(provider.telemetry?.storageGitHash) },
      { kind: "list", id: "providerHash", mono: true, read: (provider) => same(provider.telemetry?.providerGitHash) },
      { kind: "choice", id: "telemetry", read: (provider) => provider.sendsTelemetry },
    ],
  },
]

const FIELDS = FILTER_GROUPS.flatMap((group) => group.fields)

const RANGES = FIELDS.filter((field): field is RangeField => field.kind === "range")

// The pair mytonprovider.org opens with: up a fifth of the time and with room for a bag
export const START_FILTERS: FilterValues = { freeSpace: true, uptime: { from: 20 } }

const snap = (value: number, step: number, round: (value: number) => number): number =>
  Number((round(value / step) * step).toFixed(6))

export const filterEdges = (providers: Provider[], now: number): FilterEdges => {
  const edges = {} as FilterEdges

  for (const field of RANGES) {
    if (field.fixed) {
      edges[field.id] = field.fixed
      continue
    }

    const values = providers
      .map((provider) => field.read(provider, now))
      .filter((value): value is number => value !== null && Number.isFinite(value))
      .sort((a, b) => a - b)

    if (!values.length) {
      edges[field.id] = { min: 0, max: field.step }
      continue
    }

    const min = snap(values[0], field.step, Math.floor)
    const top = values[Math.min(values.length - 1, Math.floor(values.length * EDGE_SHARE))]
    edges[field.id] = { min, max: Math.max(min + field.step, snap(top, field.step, Math.ceil)) }
  }

  return edges
}

export const listOptions = (providers: Provider[], id: ListId): ListOption[] => {
  const field = FIELDS.find((candidate): candidate is ListField => candidate.kind === "list" && candidate.id === id)
  const options = new Map<string, ListOption>()

  for (const provider of providers) {
    const entry = field?.read(provider)
    if (!entry) continue
    const known = options.get(entry.value)
    if (known) known.count += 1
    else options.set(entry.value, { ...entry, count: 1 })
  }

  return [...options.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export const filterOptions = (providers: Provider[]): Record<ListId, ListOption[]> => ({
  location: listOptions(providers, "location"),
  hosting: listOptions(providers, "hosting"),
  storageHash: listOptions(providers, "storageHash"),
  providerHash: listOptions(providers, "providerHash"),
})

const fieldMatches = (field: FilterField, provider: Provider, values: FilterValues, now: number): boolean => {
  switch (field.kind) {
    case "range": {
      const range = values[field.id]
      if (!range || (range.from === undefined && range.to === undefined)) return true
      const value = field.read(provider, now)
      if (value === null) return false
      return (range.from === undefined || value >= range.from) && (range.to === undefined || value <= range.to)
    }
    case "list": {
      const picked = values[field.id]
      if (!picked?.length) return true
      const entry = field.read(provider)
      return entry !== null && picked.includes(entry.value)
    }
    case "flag":
      return !values[field.id] || field.test(provider)
    case "choice": {
      const wanted = values[field.id]
      return wanted === undefined || field.read(provider) === wanted
    }
    case "text": {
      const wanted = values[field.id]?.trim().toLowerCase()
      if (!wanted) return true
      return field.read(provider)?.toLowerCase().includes(wanted) ?? false
    }
  }
}

export const matchesFilters = (provider: Provider, values: FilterValues, now: number): boolean =>
  FIELDS.every((field) => fieldMatches(field, provider, values, now))

const isActive = (field: FilterField, values: FilterValues): boolean => {
  switch (field.kind) {
    case "range": {
      const range = values[field.id]
      return range?.from !== undefined || range?.to !== undefined
    }
    case "list":
      return (values[field.id]?.length ?? 0) > 0
    case "text":
      return (values[field.id]?.trim() ?? "") !== ""
    default:
      return values[field.id] !== undefined
  }
}

const sameIn = (field: FilterField, a: FilterValues, b: FilterValues): boolean => {
  const aSet = isActive(field, a)
  if (aSet !== isActive(field, b)) return false
  if (!aSet) return true
  if (field.kind === "range") return a[field.id]?.from === b[field.id]?.from && a[field.id]?.to === b[field.id]?.to
  if (field.kind === "list") {
    const left = a[field.id] ?? []
    const right = b[field.id] ?? []
    return left.length === right.length && left.every((value) => right.includes(value))
  }
  return a[field.id] === b[field.id]
}

// What was changed from the start, not what is set: the start filter alone would count on a sheet nobody touched,
// while the Filters button beside it stays off
export const changedIn = (group: FilterGroup, values: FilterValues): number =>
  group.fields.filter((field) => !sameIn(field, values, START_FILTERS)).length

export const countChanged = (values: FilterValues): number =>
  FILTER_GROUPS.reduce((total, group) => total + changedIn(group, values), 0)

// A field set to nothing counts as unset, so a slider dragged back to its edge is the start again
export const isStart = (values: FilterValues): boolean => FIELDS.every((field) => sameIn(field, values, START_FILTERS))

// Writes one field back and drops it when it says nothing, so the values stay comparable with isStart
export const withFilter = <K extends FilterId>(values: FilterValues, id: K, value: FilterValues[K]): FilterValues => {
  const next: FilterValues = { ...values }
  next[id] = value
  const field = FIELDS.find((candidate) => candidate.id === id)
  if (field && !isActive(field, next)) delete next[id]
  return next
}
