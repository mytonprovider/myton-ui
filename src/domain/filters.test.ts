import { describe, expect, it } from "vitest"
import { toProvider, type CatalogProviderDto, type Provider } from "./catalog"
import {
  FILTER_GROUPS,
  START_FILTERS,
  changedIn,
  countChanged,
  filterEdges,
  freeBytes,
  hostingKey,
  isStart,
  listOptions,
  matchesFilters,
  withFilter,
  type FilterValues,
} from "./filters"

const NOW = 1785545100

const row = {
  pubkey: "3a65231e59031a3a0c6f363030712730b11562a3c77556184c05d58adeb6b466",
  status: 0,
  status_ratio: 0.9977,
  location: { country: "Russia", country_iso: "RU", city: "Moscow", time_zone: "Europe/Moscow" },
  uptime: 99.7,
  working_time: 27064916,
  rating: 20.41,
  price: 10_000_000_000,
  min_span: 604800,
  max_span: 6635520,
  max_bag_size_bytes: 85899345920,
  reg_time: 1758480100,
  last_online_check_time: 1785545007,
  is_send_telemetry: true,
  telemetry: {
    storage_git_hash: "ba05e00",
    provider_git_hash: "8c7ca5b",
    total_provider_space: 3820,
    used_provider_space: 3656.41,
    cpu_name: "Intel(R) Xeon(R) CPU E5-2620 v2 @ 2.10GHz",
    cpu_number: 2,
    cpu_is_virtual: true,
    total_ram: 4.01,
    ram_usage_percent: 28.43,
    qd64_disk_read_speed: "63.9MiB/s",
    speedtest_download: 1970199300,
    speedtest_ping: 15.97,
    isp: "Interserver, Inc",
  },
  statuses_reason_stats: [{ reason: 0, cnt: 432 }],
} satisfies CatalogProviderDto

const parse = (over: Record<string, unknown> = {}): Provider => {
  const provider = toProvider({ ...row, ...over })
  if (provider === null) throw new Error("the row did not parse")
  return provider
}

const withTelemetry = (over: Record<string, unknown>, rest: Record<string, unknown> = {}) =>
  parse({ ...rest, telemetry: { ...row.telemetry, ...over } })

const stable = parse()
const down = parse({ uptime: 12, pubkey: "b".repeat(64) })
const full = withTelemetry({ used_provider_space: 3817.5 }, { pubkey: "c".repeat(64) })
const silent = parse({ is_send_telemetry: false, telemetry: null, pubkey: "d".repeat(64) })
const japan = withTelemetry(
  { isp: "Interserver" },
  { location: { country: "Japan", country_iso: "JP" }, pubkey: "e".repeat(64) },
)

const keeps = (provider: Provider, values: FilterValues) => matchesFilters(provider, values, NOW)

describe("FILTER_GROUPS", () => {
  it("keeps the site's groups in its order, the storage terms after the provider", () => {
    expect(FILTER_GROUPS.map((group) => group.id)).toEqual([
      "provider",
      "storage",
      "benchmarks",
      "hardware",
      "network",
      "software",
    ])
  })

  it("names every field once", () => {
    const ids = FILTER_GROUPS.flatMap((group) => group.fields.map((field) => field.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("START_FILTERS", () => {
  it("keeps providers that are up and have more than 4 GiB left", () => {
    expect(keeps(stable, START_FILTERS)).toBe(true)
    expect(keeps(down, START_FILTERS)).toBe(false)
    expect(keeps(full, START_FILTERS)).toBe(false)
    expect(keeps(silent, START_FILTERS)).toBe(false)
  })
})

describe("matchesFilters", () => {
  it("keeps everyone while nothing is asked", () => {
    expect([stable, down, full, silent, japan].every((provider) => keeps(provider, {}))).toBe(true)
  })

  it("keeps a value sitting exactly on a bound", () => {
    expect(keeps(stable, { rating: { from: 20.41 } })).toBe(true)
    expect(keeps(stable, { rating: { to: 20.41 } })).toBe(true)
  })

  it("leaves an open end open, so nobody past the scale is lost", () => {
    expect(keeps(stable, { ping: { from: 1 } })).toBe(true)
    expect(keeps(stable, { ping: { to: 10 } })).toBe(false)
  })

  it("drops a provider that cannot answer a range it is asked", () => {
    expect(keeps(silent, { ram: { from: 1 } })).toBe(false)
  })

  it("reads spans and sizes in days and GB", () => {
    expect(keeps(stable, { maxSpan: { from: 76, to: 77 } })).toBe(true)
    expect(keeps(stable, { bagSize: { from: 80, to: 80 } })).toBe(true)
    expect(keeps(stable, { download: { from: 1970, to: 1971 } })).toBe(true)
  })

  it("matches countries by their code", () => {
    expect(keeps(japan, { location: ["JP"] })).toBe(true)
    expect(keeps(stable, { location: ["JP"] })).toBe(false)
    expect(keeps(stable, { location: ["JP", "RU"] })).toBe(true)
  })

  it("matches a CPU name anywhere, ignoring case", () => {
    expect(keeps(stable, { cpuName: "xeon" })).toBe(true)
    expect(keeps(stable, { cpuName: "epyc" })).toBe(false)
  })

  it("counts an unknown CPU as physical", () => {
    expect(keeps(silent, { cpuVirtual: false })).toBe(true)
    expect(keeps(silent, { cpuVirtual: true })).toBe(false)
  })

  it("keeps only the stable ones when asked", () => {
    expect(keeps(stable, { stableOnly: true })).toBe(true)
    expect(keeps(parse({ status: 1 }), { stableOnly: true })).toBe(false)
  })
})

describe("freeBytes", () => {
  it("subtracts the used space and never goes below zero", () => {
    expect(freeBytes(stable)).toBeCloseTo((3820 - 3656.41) * 1024 ** 3)
    expect(freeBytes(withTelemetry({ used_provider_space: 4000 }))).toBe(0)
    expect(freeBytes(silent)).toBeNull()
  })
})

describe("filterEdges", () => {
  it("ends the scale where 95 % of the catalog ends", () => {
    const priced = Array.from({ length: 40 }, (_, index) =>
      parse({ pubkey: index.toString(16).padStart(64, "0"), price: (index === 39 ? 1000 : index + 1) * 1e9 }),
    )

    expect(filterEdges(priced, NOW).price).toEqual({ min: 1, max: 39 })
  })

  it("keeps percentages on 0–100", () => {
    const edges = filterEdges([stable], NOW)
    expect(edges.uptime).toEqual({ min: 0, max: 100 })
    expect(edges.ramUsage).toEqual({ min: 0, max: 100 })
  })

  it("gives a field nobody answers a scale of one step", () => {
    expect(filterEdges([silent], NOW).cores).toEqual({ min: 0, max: 1 })
  })
})

describe("listOptions", () => {
  it("counts the catalog, the largest first", () => {
    expect(listOptions([stable, full, japan], "location")).toEqual([
      { value: "RU", label: "Russia", count: 2 },
      { value: "JP", label: "Japan", count: 1 },
    ])
  })

  it("folds a hosting name with its legal form into one company", () => {
    expect(listOptions([stable, japan], "hosting")).toEqual([
      { value: "interserver", label: "Interserver, Inc", count: 2 },
    ])
    expect(hostingKey("Unknown")).toBeNull()
  })
})

describe("activity", () => {
  it("counts what moved from the start, a range once", () => {
    expect(countChanged(START_FILTERS)).toBe(0)
    expect(countChanged({ ...START_FILTERS, rating: { from: 1, to: 5 } })).toBe(1)
    expect(countChanged({ ...START_FILTERS, uptime: { from: 50 } })).toBe(1)
    expect(countChanged({})).toBe(2)
    expect(changedIn(FILTER_GROUPS[0], { ...START_FILTERS, location: ["JP"] })).toBe(1)
  })

  it("drops a field set to nothing", () => {
    expect(withFilter({ location: ["RU"] }, "location", [])).toEqual({})
    expect(withFilter({ rating: { from: 1 } }, "rating", {})).toEqual({})
  })

  it("is back at the start once a moved slider returns to its edge", () => {
    const moved = withFilter(START_FILTERS, "rating", { from: 5 })
    expect(isStart(moved)).toBe(false)
    expect(isStart(withFilter(moved, "rating", { from: undefined }))).toBe(true)
    expect(isStart({})).toBe(false)
  })
})
