import { describe, expect, it } from "vitest"
import { pubkeyFrom, toProvider, toProviders, type CatalogProviderDto, type Provider } from "./catalog"

const GIB = 1024 ** 3
const GB = 1e9

// A real catalog row as the mini app fixtures keep it: disk in GiB, RAM in decimal GB, speed in bits, price in nano
const row = {
  pubkey: "3a65231e59031a3a0c6f363030712730b11562a3c77556184c05d58adeb6b466",
  address: "EQAjRhPNqC9mY2muFNsYwYI5eqb-lsq-sD5xk3SLfrDljMwB",
  status: 0,
  status_ratio: 0.9977,
  location: { country: "Russia", country_iso: "RU", city: "Moscow", time_zone: "Europe/Moscow" },
  uptime: 99.717606,
  working_time: 27064916,
  rating: 20.415426,
  price: 10002432000,
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
    updated_at: 1785544962,
    cpu_name: "Intel(R) Xeon(R) CPU E5-2620 v2 @ 2.10GHz",
    cpu_number: 2,
    cpu_is_virtual: true,
    total_ram: 4.01,
    usage_ram: 1.14,
    ram_usage_percent: 28.43,
    qd64_disk_read_speed: "63.9MiB/s",
    qd64_disk_write_speed: "18.1MiB/s",
    speedtest_download: 1970199300,
    speedtest_upload: 1177201500,
    speedtest_ping: 15.970891,
    country: "RU",
    isp: "JSC IOT",
  },
  statuses_reason_stats: [
    { reason: 0, cnt: 432 },
    { reason: 401, cnt: 1 },
  ],
} satisfies CatalogProviderDto

const parse = (over: Record<string, unknown> = {}): Provider => {
  const provider = toProvider({ ...row, ...over })
  if (provider === null) throw new Error("the row did not parse")
  return provider
}

const stable = parse()
const telemetryOf = (over: Record<string, unknown>) => parse({ telemetry: { ...row.telemetry, ...over } }).telemetry

describe("toProvider", () => {
  it("reads disk in GiB and RAM in decimal gigabytes", () => {
    expect(stable.telemetry?.totalSpaceBytes).toBe(3820 * GIB)
    expect(stable.telemetry?.usedSpaceBytes).toBeCloseTo(3656.41 * GIB, 0)
    expect(stable.telemetry?.totalRamBytes).toBe(4.01 * GB)
    expect(stable.telemetry?.usageRamBytes).toBeCloseTo(1.14 * GB, 0)
  })

  it("reads the whole row into camelCase", () => {
    expect(stable).toEqual({
      pubkey: row.pubkey,
      address: row.address,
      status: 0,
      statusRatio: 0.9977,
      reasons: [
        { reason: 0, count: 432 },
        { reason: 401, count: 1 },
      ],
      location: { country: "Russia", countryIso: "RU", city: "Moscow", timeZone: "Europe/Moscow" },
      uptime: 99.717606,
      workingTime: 27064916,
      rating: 20.415426,
      price: 10002432000,
      minSpan: 604800,
      maxSpan: 6635520,
      maxBagBytes: 85899345920,
      regTime: 1758480100,
      lastOnlineAt: 1785545007,
      sendsTelemetry: true,
      telemetry: {
        storageGitHash: "ba05e00",
        providerGitHash: "8c7ca5b",
        updatedAt: 1785544962,
        cpuName: "Intel(R) Xeon(R) CPU E5-2620 v2 @ 2.10GHz",
        cpuCount: 2,
        cpuVirtual: true,
        totalSpaceBytes: 3820 * GIB,
        usedSpaceBytes: 3656.41 * GIB,
        totalRamBytes: 4.01 * GB,
        usageRamBytes: 1.14 * GB,
        ramUsagePercent: 28.43,
        diskRead: "63.9MiB/s",
        diskWrite: "18.1MiB/s",
        downloadBits: 1970199300,
        uploadBits: 1177201500,
        pingMs: 15.970891,
        country: "RU",
        isp: "JSC IOT",
      },
    })
  })

  // The schema is unstable: fields go missing and the whole blob comes as null
  it("survives a telemetry blob that is empty or missing", () => {
    const empty = parse({ telemetry: {} })
    const missing = parse({ telemetry: null, statuses_reason_stats: undefined })

    expect(empty.telemetry?.totalSpaceBytes).toBe(null)
    expect(empty.telemetry?.cpuCount).toBe(null)
    expect(missing.telemetry).toBe(null)
    expect(missing.reasons).toEqual([])
    expect(parse({ telemetry: "broken" }).telemetry).toBe(null)
    expect(parse({ telemetry: [] }).telemetry).toBe(null)
  })

  it("drops a value that is not a finite number or not of its type", () => {
    const broken = telemetryOf({ total_ram: Number.NaN, total_provider_space: null, cpu_number: "2", isp: 7 })

    expect(broken?.totalRamBytes).toBe(null)
    expect(broken?.totalSpaceBytes).toBe(null)
    expect(broken?.cpuCount).toBe(null)
    expect(broken?.isp).toBe(null)
    expect(telemetryOf({ cpu_is_virtual: "yes" })?.cpuVirtual).toBe(null)
    expect(parse({ address: undefined }).address).toBe(null)
    expect(parse({ rating: Number.POSITIVE_INFINITY, status_ratio: "0.99", status: null })).toMatchObject({
      rating: null,
      statusRatio: null,
      status: null,
    })
  })

  it("keeps the location it was given and nothing when there is none", () => {
    expect(stable.location?.countryIso).toBe("RU")
    expect(parse({ location: null }).location).toBe(null)
    expect(parse({ location: undefined }).location).toBe(null)
    expect(parse({ location: { country: "Russia" } }).location).toEqual({
      country: "Russia",
      countryIso: null,
      city: null,
      timeZone: null,
    })
  })

  it("throws out broken and empty check counters", () => {
    const reasons = parse({
      statuses_reason_stats: [null, { reason: 0, cnt: 5 }, { reason: 301, cnt: 0 }, { reason: "401", cnt: 2 }, 7],
    }).reasons

    expect(reasons).toEqual([{ reason: 0, count: 5 }])
    expect(parse({ statuses_reason_stats: null }).reasons).toEqual([])
    expect(parse({ statuses_reason_stats: { reason: 0, cnt: 1 } }).reasons).toEqual([])
  })

  it("counts telemetry as sent only when the catalog says so", () => {
    expect(parse({ is_send_telemetry: false }).sendsTelemetry).toBe(false)
    expect(parse({ is_send_telemetry: null }).sendsTelemetry).toBe(false)
    expect(parse({ is_send_telemetry: "true" }).sendsTelemetry).toBe(false)
  })

  it("refuses an entry without a string key", () => {
    expect(toProvider({ ...row, pubkey: undefined })).toBe(null)
    expect(toProvider({ ...row, pubkey: 42 })).toBe(null)
    expect(toProvider({ address: "EQ" })).toBe(null)
    expect(toProvider({})).toBe(null)
    expect(toProvider(null)).toBe(null)
    expect(toProvider("abc")).toBe(null)
    expect(toProvider([row])).toBe(null)
  })

  it("takes a bare key the way the storage site test sends it", () => {
    expect(toProvider({ pubkey: "abc" })).toMatchObject({ pubkey: "abc", telemetry: null, reasons: [], location: null })
  })
})

describe("toProviders", () => {
  it("drops entries the catalog sends without a key, counts them and keeps every good one around them", () => {
    const other = { ...row, pubkey: "b".repeat(64), telemetry: 5 }
    const page = toProviders({ providers: [row, {}, { pubkey: 42 }, "broken", { address: "EQ" }, null, other] })

    expect(page?.providers).toEqual([stable, { ...stable, pubkey: other.pubkey, telemetry: null }])
    expect(page?.skipped).toBe(5)
  })

  it("treats a missing or null providers array as an empty catalog", () => {
    expect(toProviders({})).toEqual({ providers: [], skipped: 0 })
    expect(toProviders({ providers: null })).toEqual({ providers: [], skipped: 0 })
    expect(toProviders({ providers: [] })).toEqual({ providers: [], skipped: 0 })
  })

  it("refuses an answer that is not shaped like a catalog", () => {
    expect(toProviders([{ unexpected: true }])).toBe(null)
    expect(toProviders(null)).toBe(null)
    expect(toProviders("providers")).toBe(null)
    expect(toProviders({ providers: { pubkey: "abc" } })).toBe(null)
  })
})

describe("pubkeyFrom", () => {
  const key = "ABCDEF0123456789".repeat(4)

  it("accepts a 64-hex key and hands it back lower-cased", () => {
    expect(pubkeyFrom(key)).toBe(key.toLowerCase())
    expect(pubkeyFrom(key.toLowerCase())).toBe(key.toLowerCase())
  })

  it("trims surrounding whitespace before validating", () => {
    expect(pubkeyFrom(`  ${key}  `)).toBe(key.toLowerCase())
    expect(pubkeyFrom(`  ${key}\n`)).toBe(key.toLowerCase())
  })

  it("rejects anything that is not exactly 64 hex characters", () => {
    expect(pubkeyFrom("")).toBe(null)
    expect(pubkeyFrom("   ")).toBe(null)
    expect(pubkeyFrom(key.slice(1))).toBe(null)
    expect(pubkeyFrom(`${key}0`)).toBe(null)
    expect(pubkeyFrom(`g${key.slice(1)}`)).toBe(null)
    expect(pubkeyFrom(`0:${key}`)).toBe(null)
    expect(pubkeyFrom(`${key.slice(0, 32)} ${key.slice(32)}`)).toBe(null)
  })

  it("has nothing for a missing value", () => {
    expect(pubkeyFrom(null)).toBe(null)
    expect(pubkeyFrom(undefined)).toBe(null)
  })
})
