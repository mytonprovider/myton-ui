import { describe, expect, it } from "vitest"
import { fitTicks } from "./Range"

const boxes = (...spans: [number, number][]) => spans.map(([left, right]) => ({ left, right }))

describe("fitTicks", () => {
  it("keeps a lone label", () => {
    expect(fitTicks(boxes([0, 20]))).toEqual([0])
  })

  it("keeps every label that has room", () => {
    expect(fitTicks(boxes([0, 20], [40, 60], [80, 100]))).toEqual([0, 1, 2])
  })

  it("drops an inner label crowding its neighbour and keeps both ends", () => {
    expect(fitTicks(boxes([0, 20], [25, 45], [60, 80], [100, 120]))).toEqual([0, 2, 3])
  })

  it("drops an inner label crowding the last one", () => {
    expect(fitTicks(boxes([0, 20], [40, 90], [95, 110]))).toEqual([0, 2])
  })
})
