import { describe, expect, it } from "vitest"
import { toProvider, type CatalogProviderDto, type Provider } from "./catalog"
import { nextSortDirection, sortProviders } from "./sort"
import { providerStatus } from "./status"

const row = {
  pubkey: "a".repeat(64),
  status: 0,
  status_ratio: 0.99,
  location: { country: "Russia", country_iso: "RU" },
  uptime: 99,
  rating: 20,
  price: 10e9,
  statuses_reason_stats: [{ reason: 0, cnt: 99 }],
} satisfies CatalogProviderDto

const parse = (over: Record<string, unknown>): Provider => {
  const provider = toProvider({ ...row, ...over })
  if (provider === null) throw new Error("the row did not parse")
  return provider
}

const stable = parse({})
const partial = parse({ pubkey: "b".repeat(64), status_ratio: 0.8, rating: 22, location: { country: "Japan" } })
const unknown = parse({ pubkey: "c".repeat(64), status: null, status_ratio: null, rating: null, uptime: null })

const order = (list: Provider[]) => list.map((provider) => provider.pubkey[0])

describe("sortProviders", () => {
  it("puts an unknown number below every known one", () => {
    expect(order(sortProviders([unknown, stable, partial], "rating", "desc"))).toEqual(["b", "a", "c"])
    expect(order(sortProviders([unknown, stable, partial], "uptime", "asc"))).toEqual(["c", "a", "b"])
  })

  it("orders the status from the worst to the best", () => {
    expect(order(sortProviders([partial, unknown, stable], "status", "desc"))).toEqual(["a", "b", "c"])
  })

  it("sorts text alphabetically", () => {
    expect(order(sortProviders([stable, partial], "location", "asc"))).toEqual(["b", "a"])
  })

  it("orders one state by the share of checks passed", () => {
    const stored = (pubkey: string, ratio: number) => parse({ pubkey: pubkey.repeat(64), status_ratio: ratio })
    const broken = (pubkey: string, passed: number) =>
      parse({ pubkey: pubkey.repeat(64), status: 301, statuses_reason_stats: [{ reason: 301, cnt: 100 - passed }, { reason: 0, cnt: passed }] })
    const healthy = [stored("d", 0.99), stored("e", 1)]
    const failing = [broken("f", 10), broken("g", 20)]

    expect(providerStatus(healthy[0]).state).toBe(providerStatus(healthy[1]).state)
    expect(providerStatus(failing[0]).state).toBe(providerStatus(failing[1]).state)
    expect(order(sortProviders(healthy, "status", "desc"))).toEqual(["e", "d"])
    expect(order(sortProviders(failing, "status", "desc"))).toEqual(["g", "f"])
  })

  it("puts a provider without known free space at the bottom", () => {
    const roomy = parse({ pubkey: "h".repeat(64), telemetry: { total_provider_space: 100, used_provider_space: 10 } })
    expect(order(sortProviders([stable, roomy], "freeSpace", "desc"))).toEqual(["h", "a"])
  })

  it("leaves the list it was given in its order", () => {
    const input = [stable, partial]
    sortProviders(input, "rating", "desc")
    expect(order(input)).toEqual(["a", "b"])
  })
})

describe("nextSortDirection", () => {
  it("turns the sorted column over and starts another one from the top", () => {
    expect(nextSortDirection("rating", "rating", "desc")).toBe("asc")
    expect(nextSortDirection("rating", "rating", "asc")).toBe("desc")
    expect(nextSortDirection("price", "rating", "asc")).toBe("desc")
    expect(nextSortDirection("price", "rating", "desc")).toBe("desc")
  })
})
