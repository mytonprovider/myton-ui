import { describe, expect, it } from "vitest"
import type { CheckKind } from "./checks"
import {
  checkCounts,
  dominantReason,
  KIND_TONE,
  providerStatus,
  ratioPercent,
  ratioState,
  reasonTone,
  STATE_TONE,
  type ProviderState,
  type ReasonCount,
  type StatusInput,
} from "./status"

const counts = (...pairs: [number, number][]): ReasonCount[] => pairs.map(([reason, count]) => ({ reason, count }))

// The healthy provider of the mini app fixtures: 432 passes and one missing proof over a day
const stable: StatusInput = { status: 0, statusRatio: 0.9977, reasons: counts([0, 432], [401, 1]) }
const never: StatusInput = { status: null, statusRatio: 0, reasons: [] }

describe("checkCounts", () => {
  it("counts the passes against every check", () => {
    expect(checkCounts(stable.reasons)).toEqual({ passed: 432, total: 433 })
  })

  it("reads no passes where every check failed or none ran", () => {
    expect(checkCounts(counts([401, 3], [301, 2]))).toEqual({ passed: 0, total: 5 })
    expect(checkCounts([])).toEqual({ passed: 0, total: 0 })
  })
})

describe("providerStatus", () => {
  it("reads the ratio upstream sent for a passing provider", () => {
    expect(providerStatus(stable)).toEqual({ state: "stable", ratio: 0.9977 })
  })

  it("trusts the rounded ratio over a recount on the 0.99 border", () => {
    const border = { status: 0, statusRatio: 0.99, reasons: counts([0, 19799], [401, 201]) }

    expect(19799 / 20000).toBe(0.98995)
    expect(providerStatus(border)).toEqual({ state: "stable", ratio: 0.99 })
  })

  it("counts the checks itself when the ratio is missing", () => {
    const partial = providerStatus({ status: 0, statusRatio: null, reasons: counts([0, 8], [401, 2]) })
    const unstable = providerStatus({ status: 0, statusRatio: null, reasons: counts([0, 7], [401, 3]) })

    expect(partial.state).toBe("partial")
    expect(partial.ratio).toBeCloseTo(0.8, 4)
    expect(unstable.state).toBe("unstable")
  })

  it("counts the checks when the ratio is not a number", () => {
    expect(providerStatus({ ...stable, statusRatio: Number.NaN }).ratio).toBeCloseTo(432 / 433, 6)
    expect(providerStatus({ ...stable, statusRatio: Number.POSITIVE_INFINITY }).ratio).toBeCloseTo(432 / 433, 6)
  })

  it("has no data for a pass with neither a ratio nor a single check, instead of calling it stable", () => {
    expect(providerStatus({ status: 0, statusRatio: null, reasons: [] })).toEqual({ state: "noData", ratio: null })
    expect(providerStatus({ status: 0, statusRatio: Number.NaN, reasons: counts([0, 0]) })).toEqual({
      state: "noData",
      ratio: null,
    })
  })

  it("keeps a provider that was never checked out of the scale", () => {
    expect(providerStatus(never)).toEqual({ state: "noData", ratio: null })
    expect(providerStatus({ ...stable, status: null })).toEqual({ state: "noData", ratio: null })
  })

  it.each([
    [101, "unavailable"],
    [102, "unknown"],
    [203, "unavailable"],
    [301, "notStored"],
    [401, "noProofs"],
    [999, "unknown"],
  ] as const)("reads a failing status %i as %s and hides the ratio", (code, state) => {
    expect(providerStatus({ ...stable, status: code })).toEqual({ state, ratio: null })
  })

  it("hides the ratio of a provider that is not answering even when upstream sent one", () => {
    expect(providerStatus({ status: 101, statusRatio: 0, reasons: [] })).toEqual({ state: "unavailable", ratio: null })
    expect(providerStatus({ status: 301, statusRatio: 0.6, reasons: counts([301, 6], [0, 4]) }).ratio).toBe(null)
  })
})

describe("ratioState", () => {
  it("grades a share of passed checks at 0.99 and 0.8", () => {
    expect(ratioState(1)).toBe("stable")
    expect(ratioState(0.99)).toBe("stable")
    expect(ratioState(0.98995)).toBe("partial")
    expect(ratioState(0.8)).toBe("partial")
    expect(ratioState(0.7999)).toBe("unstable")
    expect(ratioState(0)).toBe("unstable")
  })

  it("has no state for a share it does not know", () => {
    expect(ratioState(null)).toBe(null)
    expect(ratioState(undefined)).toBe(null)
    expect(ratioState(Number.NaN)).toBe(null)
  })
})

describe("ratioPercent", () => {
  it("floors the share to a whole percent", () => {
    expect(ratioPercent(1)).toBe(100)
    expect(ratioPercent(0.9999)).toBe(99)
    expect(ratioPercent(0.9977)).toBe(99)
    expect(ratioPercent(0.9957)).toBe(99)
    expect(ratioPercent(0.995)).toBe(99)
    expect(ratioPercent(0.8)).toBe(80)
    expect(ratioPercent(0)).toBe(0)
  })

  it("reads 0.57 as 57 where a bare floor gives 56", () => {
    expect(Math.floor(0.57 * 100)).toBe(56)
    expect(ratioPercent(0.57)).toBe(57)
    expect(ratioPercent(0.29)).toBe(29)
    expect(ratioPercent(0.58)).toBe(58)
  })

  it("has nothing for a missing or broken share", () => {
    expect(ratioPercent(null)).toBe(null)
    expect(ratioPercent(undefined)).toBe(null)
    expect(ratioPercent(Number.NaN)).toBe(null)
    expect(ratioPercent(Number.POSITIVE_INFINITY)).toBe(null)
  })
})

describe("dominantReason", () => {
  it("reports success when it clearly dominates", () => {
    expect(dominantReason(counts([0, 432], [401, 1]))).toBe(0)
    expect(dominantReason(counts([0, 9], [301, 1]))).toBe(0)
    expect(dominantReason(counts([0, 8], [301, 2]))).toBe(0)
    expect(dominantReason(counts([0, 5]))).toBe(0)
  })

  it("names the failure when passing checks stop being the clear majority", () => {
    expect(dominantReason(counts([0, 7], [301, 3]))).toBe(301)
    expect(dominantReason(counts([0, 5], [401, 3], [301, 2]))).toBe(401)
    expect(dominantReason(counts([0, 4], [301, 6]))).toBe(301)
  })

  it("keeps the most frequent failure even when it holds less than the stable share", () => {
    expect(dominantReason(counts([201, 4], [0, 3], [301, 3]))).toBe(201)
  })

  it("puts a failure before a pass on a tie and keeps the input order between failures", () => {
    expect(dominantReason(counts([0, 5], [301, 5]))).toBe(301)
    expect(dominantReason(counts([301, 5], [0, 5]))).toBe(301)
    expect(dominantReason(counts([401, 3], [301, 3]))).toBe(401)
    expect(dominantReason(counts([301, 3], [401, 3]))).toBe(301)
  })

  it("has nothing when no check ran", () => {
    expect(dominantReason([])).toBe(null)
  })

  it("leaves the input untouched", () => {
    const input = counts([0, 4], [301, 6])
    dominantReason(input)
    expect(input).toEqual(counts([0, 4], [301, 6]))
  })
})

describe("tones", () => {
  it("colours every state, no proofs orange", () => {
    expect(STATE_TONE).toEqual({
      stable: "green",
      partial: "yellow",
      unstable: "red",
      notStored: "red",
      noProofs: "orange",
      unavailable: "gray",
      unknown: "gray",
      noData: "gray",
    })
  })

  it("colours every check kind the way its state is coloured", () => {
    const stateOfKind: Record<Exclude<CheckKind, "stored">, ProviderState> = {
      unavailable: "unavailable",
      unchecked: "unknown",
      noBagInfo: "notStored",
      noProof: "noProofs",
      unknown: "unknown",
    }

    expect(KIND_TONE.stored).toBe("green")
    for (const [kind, state] of Object.entries(stateOfKind) as [Exclude<CheckKind, "stored">, ProviderState][]) {
      expect(KIND_TONE[kind]).toBe(STATE_TONE[state])
    }
  })
})

describe("reasonTone", () => {
  it("colours a check by its kind, a code without one grey", () => {
    expect(reasonTone(0)).toBe("green")
    expect(reasonTone(401)).toBe("orange")
    expect(reasonTone(302)).toBe("red")
    expect(reasonTone(201)).toBe("gray")
    expect(reasonTone(999)).toBe("gray")
    expect(reasonTone(null)).toBe("gray")
  })
})
