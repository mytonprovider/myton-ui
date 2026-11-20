import { describe, expect, it } from "vitest"
import { toProvider, type Provider } from "./catalog"
import { freePercent, freeTone, rankByRating, rankTone } from "./standing"

const provider = (pubkey: string, rating: number | null, total: number | null, used: number | null): Provider => {
  const parsed = toProvider({
    pubkey: pubkey.repeat(64),
    rating,
    is_send_telemetry: true,
    telemetry: { total_provider_space: total, used_provider_space: used },
  })
  if (parsed === null) throw new Error("the row did not parse")
  return parsed
}

describe("rankByRating", () => {
  it("ranks by rating and leaves the unrated out", () => {
    const ranks = rankByRating([provider("a", 20, 1, 0), provider("b", 23, 1, 0), provider("c", null, 1, 0)])
    expect(ranks["b".repeat(64)]).toBe(1)
    expect(ranks["a".repeat(64)]).toBe(2)
    expect(ranks["c".repeat(64)]).toBe(undefined)
  })

  it("gives a rating printed alike one place and skips the places it took", () => {
    const ranks = rankByRating([
      provider("a", 23.381, 1, 0),
      provider("b", 23.379, 1, 0),
      provider("c", 24, 1, 0),
      provider("d", 20, 1, 0),
    ])
    expect(["c", "a", "b", "d"].map((key) => ranks[key.repeat(64)])).toEqual([1, 2, 2, 4])
  })
})

describe("freePercent", () => {
  it("measures what is left and stays inside the scale", () => {
    expect(freePercent(provider("a", 1, 3820, 3656.41))).toBeCloseTo(4.28, 2)
    expect(freePercent(provider("a", 1, 100, 120))).toBe(0)
    expect(freePercent(provider("a", 1, 0, 0))).toBe(null)
  })
})

describe("tones", () => {
  it("gives the prize places and the top ten their own tone", () => {
    expect([3, 4, 10, 11].map(rankTone)).toEqual(["prize", "top", "top", "rest"])
  })

  it("colours free space only when it runs low", () => {
    expect([15, 25, 26].map(freeTone)).toEqual(["red", "orange", "normal"])
  })
})
